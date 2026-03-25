"use client";

import { usePipelineStore } from "@/stores/pipeline-store";
import { useUIStore } from "@/stores/ui-store";
import {
  Play,
  Save,
  FileDown,
  FileUp,
  Code,
  Undo2,
  Redo2,
  PanelLeft,
} from "lucide-react";

export function TopBar() {
  const name = usePipelineStore((s) => s.name);
  const setName = usePipelineStore((s) => s.setName);
  const isDirty = usePipelineStore((s) => s.isDirty);
  const undo = usePipelineStore((s) => s.undo);
  const redo = usePipelineStore((s) => s.redo);
  const history = usePipelineStore((s) => s.history);
  const future = usePipelineStore((s) => s.future);
  const toggleYamlPanel = useUIStore((s) => s.toggleYamlPanel);
  const isYamlPanelOpen = useUIStore((s) => s.isYamlPanelOpen);
  const togglePalette = useUIStore((s) => s.togglePalette);
  const isPaletteOpen = useUIStore((s) => s.isPaletteOpen);

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
      </div>

      {/* Center section - undo/redo */}
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
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          title="Import YAML"
        >
          <FileUp className="h-4 w-4" />
        </button>
        <button
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
