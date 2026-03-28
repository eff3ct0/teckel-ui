"use client";

import { usePipelineStore } from "@/stores/pipeline-store";
import { useUIStore } from "@/stores/ui-store";
import { useYamlImport } from "@/hooks/use-yaml-import";
import { useYamlExport } from "@/hooks/use-yaml-export";
import { useValidation } from "@/hooks/use-validation";
import { useThemeStore } from "@/stores/theme-store";
import { autoLayout } from "@/lib/layout/auto-layout";
import { useConnectionStore } from "@/stores/connection-store";
import { useJob } from "@/hooks/use-job";
import { useServerValidation } from "@/hooks/use-server-validation";
import { useHealthCheck } from "@/hooks/use-health-check";
import { useExplain } from "@/hooks/use-explain";
import { useJobHistory } from "@/hooks/use-job-history";
import { ExplainPanel } from "@/components/explain/explain-panel";
import { JobHistoryPanel } from "@/components/jobs/job-history-panel";
import {
  Play,
  Square,
  Save,
  FileDown,
  FileUp,
  Code,
  Undo2,
  Redo2,
  PanelLeft,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Sun,
  Moon,
  LayoutDashboard,
  Settings2,
  Wifi,
  WifiOff,
  Loader2,
  ServerCrash,
  Brain,
  Clock,
  LayoutTemplate,
} from "lucide-react";
import { TemplateGallery } from "@/components/templates/template-gallery";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

export function TopBar() {
  const name = usePipelineStore((s) => s.name);
  const setName = usePipelineStore((s) => s.setName);
  const isDirty = usePipelineStore((s) => s.isDirty);
  const undo = usePipelineStore((s) => s.undo);
  const redo = usePipelineStore((s) => s.redo);
  const history = usePipelineStore((s) => s.history);
  const future = usePipelineStore((s) => s.future);
  const selectNode = usePipelineStore((s) => s.selectNode);
  const toggleYamlPanel = useUIStore((s) => s.toggleYamlPanel);
  const isYamlPanelOpen = useUIStore((s) => s.isYamlPanelOpen);
  const togglePalette = useUIStore((s) => s.togglePalette);
  const openConfigPanel = useUIStore((s) => s.openConfigPanel);
  const { importFromFile } = useYamlImport();
  const { exportToFile } = useYamlExport();
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const setNodes = usePipelineStore((s) => s.setNodes);
  const saveSnapshot = usePipelineStore((s) => s.saveSnapshot);

  const handleAutoLayout = () => {
    if (nodes.length === 0) return;
    saveSnapshot();
    setNodes(autoLayout(nodes, edges));
  };
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const { errorCount, warningCount } = useValidation();
  const nodeCount = usePipelineStore((s) => s.nodes.length);
  const connected = useConnectionStore((s) => s.connected);
  const backend = useConnectionStore((s) => s.backend);
  const { job, submitJob, cancelJob } = useJob();
  const serverValidation = useServerValidation();
  const { status: healthStatus, showReconnected } = useHealthCheck();
  const yaml = usePipelineStore((s) => s.yaml);
  const isExplainPanelOpen = useUIStore((s) => s.isExplainPanelOpen);
  const openExplainPanel = useUIStore((s) => s.openExplainPanel);
  const closeExplainPanel = useUIStore((s) => s.closeExplainPanel);
  const isJobHistoryOpen = useUIStore((s) => s.isJobHistoryOpen);
  const toggleJobHistory = useUIStore((s) => s.toggleJobHistory);
  const closeJobHistory = useUIStore((s) => s.closeJobHistory);
  const isTemplateGalleryOpen = useUIStore((s) => s.isTemplateGalleryOpen);
  const openTemplateGallery = useUIStore((s) => s.openTemplateGallery);
  const closeTemplateGallery = useUIStore((s) => s.closeTemplateGallery);
  const { plan, loading: explainLoading, error: explainError, explain } = useExplain();
  const { jobs, loading: jobsLoading, error: jobsError, refresh: refreshJobs } = useJobHistory(isJobHistoryOpen);

  const runningJobCount = jobs.filter(
    (j) => j.status === "running" || j.status === "queued",
  ).length;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-3">
      {/* Left section */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePalette}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          title="Toggle palette"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-[var(--border)]" />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 rounded-lg border border-transparent bg-transparent px-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-none"
        />
        {isDirty && (
          <span className="h-2 w-2 rounded-full bg-[var(--primary)]" title="Unsaved changes" />
        )}
        <div className="mx-1 h-5 w-px bg-[var(--border)]" />
        <button
          onClick={() => {
            selectNode(null);
            openConfigPanel();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          title="Pipeline settings"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      {/* Center section - undo/redo + validation */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)] disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)] disabled:opacity-30"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleAutoLayout}
            disabled={nodeCount === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)] disabled:opacity-30"
            title="Auto-layout"
          >
            <LayoutDashboard className="h-4 w-4" />
          </button>
        </div>
        {nodeCount > 0 && (
          <>
            <div className="h-5 w-px bg-[var(--border)]" />
            <div className="flex items-center gap-1.5 text-[10px]">
              {errorCount > 0 ? (
                <span className="flex items-center gap-1 text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errorCount} {errorCount === 1 ? "error" : "errors"}
                </span>
              ) : warningCount > 0 ? (
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {warningCount} {warningCount === 1 ? "warning" : "warnings"}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Valid
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleYamlPanel}
          className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${
            isYamlPanelOpen
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          }`}
          title="Toggle YAML panel (Ctrl+E)"
        >
          <Code className="h-3.5 w-3.5" />
          YAML
        </button>
        <button
          onClick={openTemplateGallery}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          title="Pipeline templates"
        >
          <LayoutTemplate className="h-3.5 w-3.5" />
          Templates
        </button>
        <div className="mx-1 h-5 w-px bg-[var(--border)]" />
        <button
          onClick={importFromFile}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          title="Import YAML"
        >
          <FileUp className="h-4 w-4" />
        </button>
        <button
          onClick={exportToFile}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          title="Export YAML"
        >
          <FileDown className="h-4 w-4" />
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          title="Save"
        >
          <Save className="h-4 w-4" />
        </button>
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <div className="mx-1 h-5 w-px bg-[var(--border)]" />
        {/* Connection health indicator */}
        <button
          onClick={() => {
            selectNode(null);
            openConfigPanel();
          }}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          title={
            healthStatus === "connected"
              ? "Server connected — click to configure"
              : healthStatus === "disconnected"
                ? "Server disconnected — click to configure"
                : "Checking connection..."
          }
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              healthStatus === "connected"
                ? "bg-emerald-400"
                : healthStatus === "disconnected"
                  ? "bg-red-400"
                  : "bg-amber-400 animate-pulse"
            }`}
          />
          {healthStatus === "connected" ? (
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
          ) : healthStatus === "disconnected" ? (
            <WifiOff className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <Wifi className="h-3.5 w-3.5 text-amber-400" />
          )}
        </button>
        {showReconnected && (
          <span className="text-[10px] text-emerald-400 font-medium">Reconnected</span>
        )}
        {healthStatus === "disconnected" && !job.loading && (
          <span className="text-[10px] text-red-400">Disconnected</span>
        )}
        {/* Server validation indicator */}
        {serverValidation.loading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--muted-foreground)]" />
        )}
        {serverValidation.valid === false && !serverValidation.loading && (
          <div title={serverValidation.error || "Server validation failed"}>
            <ServerCrash className="h-3.5 w-3.5 text-red-400" />
          </div>
        )}
        {/* Explain button */}
        <button
          onClick={() => {
            explain();
            openExplainPanel();
          }}
          disabled={!connected || !yaml.trim()}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)] disabled:opacity-40"
          title={!connected ? "Connect to server first" : "Explain execution plan"}
        >
          <Brain className="h-3.5 w-3.5" />
          Explain
        </button>
        {/* History button */}
        <button
          onClick={toggleJobHistory}
          disabled={!connected}
          className={`relative flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors disabled:opacity-40 ${
            isJobHistoryOpen
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          }`}
          title="Job history"
        >
          <Clock className="h-3.5 w-3.5" />
          History
          {runningJobCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-medium text-white">
              {runningJobCount}
            </span>
          )}
        </button>
        <div className="mx-1 h-5 w-px bg-[var(--border)]" />
        {/* Run / Cancel button */}
        {job.loading ? (
          <button
            onClick={cancelJob}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-red-500 px-3 text-xs font-medium text-white transition-colors hover:bg-red-600"
            title={`Job ${job.status || "running"} — click to cancel`}
          >
            <Square className="h-3.5 w-3.5" />
            {job.status === "queued" ? "Queued" : "Cancel"}
          </button>
        ) : (
          <button
            onClick={submitJob}
            disabled={!connected || nodeCount === 0}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--primary)]/90 disabled:opacity-40"
            title={!connected ? "Connect to server first" : "Run pipeline"}
          >
            <Play className="h-3.5 w-3.5" />
            Run
          </button>
        )}
        {/* Job status with duration */}
        {job.loading && job.status === "running" && (
          <span className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running on {backend === "polars" ? "Polars" : "DataFusion"}... ({formatDuration(job.elapsedMs)})
          </span>
        )}
        {!job.loading && job.status === "completed" && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400" title="Last job completed">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed in {formatDuration(job.durationMs ?? job.elapsedMs)}
          </span>
        )}
        {!job.loading && job.status === "failed" && (
          <span className="flex items-center gap-1 text-[10px] text-red-400" title={job.error || "Job failed"}>
            <AlertCircle className="h-3.5 w-3.5" />
            Failed after {formatDuration(job.durationMs ?? job.elapsedMs)}
          </span>
        )}
      </div>

      {/* Explain Panel */}
      <ExplainPanel
        plan={plan}
        loading={explainLoading}
        error={explainError}
        isOpen={isExplainPanelOpen}
        onClose={closeExplainPanel}
      />

      {/* Job History Panel */}
      <JobHistoryPanel
        jobs={jobs}
        loading={jobsLoading}
        error={jobsError}
        isOpen={isJobHistoryOpen}
        onClose={closeJobHistory}
        onRefresh={refreshJobs}
      />

      {/* Template Gallery */}
      <TemplateGallery
        isOpen={isTemplateGalleryOpen}
        onClose={closeTemplateGallery}
      />
    </header>
  );
}
