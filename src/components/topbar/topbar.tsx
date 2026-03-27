"use client";

import { usePipelineStore } from "@/stores/pipeline-store";
import { useUIStore } from "@/stores/ui-store";
import { useYamlImport } from "@/hooks/use-yaml-import";
import { useYamlExport } from "@/hooks/use-yaml-export";
import { useValidation } from "@/hooks/use-validation";
import { useThemeStore } from "@/stores/theme-store";
import { autoLayout } from "@/lib/layout/auto-layout";
import {
  Play,
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
} from "lucide-react";

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
        <button
          className="flex h-8 items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
          title="Run pipeline"
        >
          <Play className="h-3.5 w-3.5" />
          Run
        </button>
      </div>
    </header>
  );
}
