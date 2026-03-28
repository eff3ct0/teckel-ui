"use client";

import { X, Brain, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ExplainResponse } from "@/lib/api/teckel-client";

interface ExplainPanelProps {
  plan: ExplainResponse | null;
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExplainPanel({ plan, loading, error, isOpen, onClose }: ExplainPanelProps) {
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
            className="fixed right-0 top-0 z-50 flex h-full w-[480px] max-w-[90vw] flex-col border-l border-[var(--border)] bg-[var(--card)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/10">
                  <Brain className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  Execution Plan
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--muted-foreground)]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs">Generating execution plan...</span>
                </div>
              )}

              {error && !loading && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-red-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Explain Failed
                  </div>
                  <p className="mt-2 text-xs text-red-400/80">{error}</p>
                </div>
              )}

              {plan && !loading && (
                <div className="space-y-4">
                  {/* Plan text */}
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--foreground)]">
                      {plan.plan}
                    </pre>
                  </div>
                </div>
              )}

              {!plan && !loading && !error && (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-[var(--muted-foreground)]">
                  <Brain className="h-8 w-8 opacity-30" />
                  <span className="text-xs">
                    Click Explain to generate an execution plan
                  </span>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
