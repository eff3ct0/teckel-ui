"use client";

import { useState } from "react";
import {
  X,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { JobResponse, JobStatus } from "@/lib/api/teckel-client";

interface JobHistoryPanelProps {
  jobs: JobResponse[];
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const STATUS_CONFIG: Record<
  JobStatus,
  { icon: React.ElementType; color: string; label: string }
> = {
  completed: { icon: CheckCircle2, color: "text-emerald-400", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  running: { icon: Loader2, color: "text-blue-400", label: "Running" },
  queued: { icon: Clock, color: "text-amber-400", label: "Queued" },
  cancelled: { icon: Ban, color: "text-[var(--muted-foreground)]", label: "Cancelled" },
};

function formatDuration(ms: number | undefined): string {
  if (ms == null) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1000);
  return `${mins}m ${secs}s`;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function computeDuration(job: JobResponse): number | undefined {
  if (job.duration_ms != null) return job.duration_ms;
  if (job.started_at && job.completed_at) {
    return new Date(job.completed_at).getTime() - new Date(job.started_at).getTime();
  }
  return undefined;
}

export function JobHistoryPanel({
  jobs,
  loading,
  error,
  isOpen,
  onClose,
  onRefresh,
}: JobHistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const runningCount = jobs.filter(
    (j) => j.status === "running" || j.status === "queued",
  ).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-[520px] max-w-[90vw] flex-col border-l border-[var(--border)] bg-[var(--card)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-[var(--foreground)]">Job History</span>
                {runningCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-medium text-white">
                    {runningCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)] disabled:opacity-40"
                  title="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {error && (
                <div className="m-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-red-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error}
                  </div>
                </div>
              )}

              {jobs.length === 0 && !loading && !error && (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-[var(--muted-foreground)]">
                  <Clock className="h-8 w-8 opacity-30" />
                  <span className="text-xs">No jobs yet</span>
                </div>
              )}

              {loading && jobs.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--muted-foreground)]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs">Loading jobs...</span>
                </div>
              )}

              {jobs.length > 0 && (
                <div className="divide-y divide-[var(--border)]">
                  {jobs.map((job) => {
                    const cfg = STATUS_CONFIG[job.status];
                    const StatusIcon = cfg.icon;
                    const isExpanded = expandedId === job.id;
                    const duration = computeDuration(job);

                    return (
                      <button
                        key={job.id}
                        onClick={() => setExpandedId(isExpanded ? null : job.id)}
                        className="flex w-full flex-col px-4 py-3 text-left transition-colors hover:bg-[var(--secondary)]/50"
                      >
                        <div className="flex items-center gap-3">
                          {/* Status icon */}
                          <StatusIcon
                            className={`h-4 w-4 shrink-0 ${cfg.color} ${
                              job.status === "running" ? "animate-spin" : ""
                            }`}
                          />

                          {/* Job ID */}
                          <span className="font-mono text-xs text-[var(--foreground)]">
                            {job.id.slice(0, 8)}
                          </span>

                          {/* Status label */}
                          <span className={`text-[10px] font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>

                          {/* Spacer */}
                          <div className="flex-1" />

                          {/* Duration */}
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            {formatDuration(duration)}
                          </span>

                          {/* Created time */}
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            {formatTime(job.created_at)}
                          </span>
                        </div>

                        {/* Expanded error details */}
                        {isExpanded && job.error && (
                          <div className="mt-2 rounded-md border border-red-500/20 bg-red-500/5 p-2.5">
                            <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-red-400/80">
                              {job.error}
                            </pre>
                          </div>
                        )}

                        {isExpanded && !job.error && (
                          <div className="mt-2 space-y-1 text-[10px] text-[var(--muted-foreground)]">
                            <div>
                              <span className="font-medium">ID:</span> {job.id}
                            </div>
                            {job.started_at && (
                              <div>
                                <span className="font-medium">Started:</span>{" "}
                                {formatTime(job.started_at)}
                              </div>
                            )}
                            {job.completed_at && (
                              <div>
                                <span className="font-medium">Completed:</span>{" "}
                                {formatTime(job.completed_at)}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
