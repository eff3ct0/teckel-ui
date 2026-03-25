"use client";

import { usePipelineStore } from "@/stores/pipeline-store";
import { useUIStore } from "@/stores/ui-store";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function YamlPanel() {
  const yaml = usePipelineStore((s) => s.yaml);
  const isOpen = useUIStore((s) => s.isYamlPanelOpen);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-[240px] shrink-0 flex-col border-t border-[var(--border)] bg-[var(--card)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
        <span className="text-xs font-semibold text-[var(--muted-foreground)]">YAML Preview</span>
        <button
          onClick={copyToClipboard}
          className="flex h-6 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {/* Content - placeholder for Monaco */}
      <div className="flex-1 overflow-auto p-4">
        <pre className="whitespace-pre-wrap font-mono text-xs text-[var(--muted-foreground)]">
          {yaml || "# Pipeline YAML will appear here as you build your pipeline"}
        </pre>
      </div>
    </div>
  );
}
