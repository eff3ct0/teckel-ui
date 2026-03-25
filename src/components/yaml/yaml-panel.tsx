"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useUIStore } from "@/stores/ui-store";
import { Copy, Check, Pencil, Eye } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-[var(--muted-foreground)]">
      Loading editor...
    </div>
  ),
});

export function YamlPanel() {
  const yaml = usePipelineStore((s) => s.yaml);
  const isOpen = useUIStore((s) => s.isYamlPanelOpen);
  const isEditable = useUIStore((s) => s.isYamlEditable);
  const setYamlEditable = useUIStore((s) => s.setYamlEditable);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [yaml]);

  if (!isOpen) return null;

  return (
    <div className="flex h-[240px] shrink-0 flex-col border-t border-[var(--border)] bg-[var(--card)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
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
