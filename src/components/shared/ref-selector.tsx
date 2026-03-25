"use client";

import { usePipelineStore } from "@/stores/pipeline-store";

interface RefSelectorProps {
  value: string;
  onChange: (value: string) => void;
  excludeNodeId?: string;
  placeholder?: string;
}

export function RefSelector({
  value,
  onChange,
  excludeNodeId,
  placeholder = "Select reference...",
}: RefSelectorProps) {
  const nodes = usePipelineStore((s) => s.nodes);
  const availableNodes = nodes.filter((n) => n.id !== excludeNodeId);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30"
    >
      <option value="">{placeholder}</option>
      {availableNodes.map((node) => (
        <option key={node.id} value={node.data.ref}>
          {node.data.ref} ({node.data.label})
        </option>
      ))}
    </select>
  );
}
