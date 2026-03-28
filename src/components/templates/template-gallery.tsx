"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LayoutTemplate, FileCode2, ArrowRight, Search } from "lucide-react";
import { PIPELINE_TEMPLATES, type PipelineTemplate } from "@/lib/templates";
import { useYamlImport } from "@/hooks/use-yaml-import";
import { usePipelineStore } from "@/stores/pipeline-store";

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Basic: "bg-blue-500/10 text-blue-400",
  ETL: "bg-emerald-500/10 text-emerald-400",
  Quality: "bg-amber-500/10 text-amber-400",
  Analytics: "bg-violet-500/10 text-violet-400",
  Routing: "bg-rose-500/10 text-rose-400",
};

export function TemplateGallery({ isOpen, onClose }: TemplateGalleryProps) {
  const [search, setSearch] = useState("");
  const [confirmTemplate, setConfirmTemplate] = useState<PipelineTemplate | null>(null);
  const { importFromString } = useYamlImport();
  const nodeCount = usePipelineStore((s) => s.nodes.length);
  const saveSnapshot = usePipelineStore((s) => s.saveSnapshot);

  const filtered = useMemo(() => {
    if (!search.trim()) return PIPELINE_TEMPLATES;
    const q = search.toLowerCase();
    return PIPELINE_TEMPLATES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q),
    );
  }, [search]);

  const handleSelect = (template: PipelineTemplate) => {
    if (nodeCount > 0) {
      setConfirmTemplate(template);
    } else {
      loadTemplate(template);
    }
  };

  const loadTemplate = (template: PipelineTemplate) => {
    saveSnapshot();
    importFromString(template.yaml);
    setConfirmTemplate(null);
    setSearch("");
    onClose();
  };

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
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => {
              setConfirmTemplate(null);
              setSearch("");
              onClose();
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]/10">
                    <LayoutTemplate className="h-4 w-4 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--foreground)]">
                      Pipeline Templates
                    </h2>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      Choose a starting point for your pipeline
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setConfirmTemplate(null);
                    setSearch("");
                    onClose();
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Search */}
              <div className="border-b border-[var(--border)] px-5 py-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-8 pr-3 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-5">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-[var(--muted-foreground)]">
                    <FileCode2 className="h-8 w-8 opacity-30" />
                    <span className="text-xs">No templates match your search</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filtered.map((template) => (
                      <motion.button
                        key={template.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelect(template)}
                        className="group flex flex-col gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-left transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--secondary)]"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--secondary)]">
                            <FileCode2 className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)]" />
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[template.category] || "bg-gray-500/10 text-gray-400"}`}
                          >
                            {template.category}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-[var(--foreground)]">
                            {template.name}
                          </h3>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
                            {template.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            {template.nodeCount} {template.nodeCount === 1 ? "node" : "nodes"}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Confirmation dialog */}
          <AnimatePresence>
            {confirmTemplate && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] bg-black/30"
                  onClick={() => setConfirmTemplate(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      Replace current pipeline?
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
                      Your current pipeline has {nodeCount}{" "}
                      {nodeCount === 1 ? "node" : "nodes"}. Loading the{" "}
                      <span className="font-medium text-[var(--foreground)]">
                        {confirmTemplate.name}
                      </span>{" "}
                      template will replace it. This action can be undone.
                    </p>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setConfirmTemplate(null)}
                        className="h-8 rounded-lg border border-[var(--border)] px-3 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => loadTemplate(confirmTemplate)}
                        className="h-8 rounded-lg bg-[var(--primary)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
                      >
                        Load Template
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
