"use client";

import { useCallback, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useUIStore } from "@/stores/ui-store";
import { Copy, Check, Pencil, Eye, GripHorizontal } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-[var(--muted-foreground)]">
      Loading editor...
    </div>
  ),
});

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 800;
const DEFAULT_HEIGHT = 240;

export function YamlPanel() {
  const yaml = usePipelineStore((s) => s.yaml);
  const isOpen = useUIStore((s) => s.isYamlPanelOpen);
  const isEditable = useUIStore((s) => s.isYamlEditable);
  const setYamlEditable = useUIStore((s) => s.setYamlEditable);
  const [copied, setCopied] = useState(false);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [yaml]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startY.current = e.clientY;
      startHeight.current = height;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = startY.current - moveEvent.clientY;
        const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight.current + delta));
        setHeight(newHeight);
      };

      const onMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    },
    [height],
  );

  if (!isOpen) return null;

  return (
    <div
      className="flex shrink-0 flex-col border-t border-[var(--border)] bg-[var(--card)]"
      style={{ height }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        className="group flex h-2 w-full cursor-row-resize items-center justify-center hover:bg-[var(--primary)]/10"
      >
        <GripHorizontal className="h-3 w-3 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-1.5">
        <span className="text-xs font-semibold text-[var(--muted-foreground)]">YAML Preview</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYamlEditable(!isEditable)}
            className={`flex h-6 items-center gap-1 rounded px-2 text-[10px] transition-colors ${
              isEditable
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            }`}
          >
            {isEditable ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {isEditable ? "Edit" : "Read-only"}
          </button>
          <button
            onClick={copyToClipboard}
            className="flex h-6 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          language="yaml"
          value={yaml || "# Pipeline YAML will appear here as you build your pipeline"}
          theme="vs-dark"
          options={{
            readOnly: !isEditable,
            minimap: { enabled: false },
            fontSize: 12,
            fontFamily: "var(--font-jetbrains-mono), monospace",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 8 },
            renderLineHighlight: "none",
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              vertical: "auto",
              horizontal: "hidden",
              verticalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </div>
  );
}
