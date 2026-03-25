"use client";

import { usePipelineStore } from "@/stores/pipeline-store";
import { useUIStore } from "@/stores/ui-store";
import { NODE_REGISTRY } from "@/lib/nodes/registry";
import { X } from "lucide-react";

export function ConfigPanel() {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const nodes = usePipelineStore((s) => s.nodes);
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);
  const updateNodeRef = usePipelineStore((s) => s.updateNodeRef);
  const isOpen = useUIStore((s) => s.isConfigPanelOpen);
  const close = useUIStore((s) => s.closeConfigPanel);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!isOpen || !selectedNode) return null;

  const def = NODE_REGISTRY[selectedNode.data.teckelType];
  const Icon = def.icon;

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--card)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${def.color}20` }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: def.color }} />
          </div>
          <span className="text-sm font-semibold text-[var(--foreground)]">{def.label}</span>
        </div>
        <button
          onClick={close}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Ref field - common to all nodes */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
            Reference
          </label>
          <input
            value={selectedNode.data.ref}
            onChange={(e) => updateNodeRef(selectedNode.id, e.target.value)}
            className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 font-mono text-xs text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30"
            placeholder="asset_ref"
          />
        </div>

        {/* Type-specific config fields */}
        <GenericConfigForm
          config={selectedNode.data.config}
          onChange={(config) => updateNodeConfig(selectedNode.id, config)}
        />
      </div>
    </aside>
  );
}

function GenericConfigForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      {Object.entries(config).map(([key, value]) => (
        <div key={key}>
          <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
            {key}
          </label>
          {typeof value === "string" ? (
            <input
              value={value}
              onChange={(e) => onChange({ [key]: e.target.value })}
              className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30"
            />
          ) : typeof value === "number" ? (
            <input
              type="number"
              value={value}
              onChange={(e) => onChange({ [key]: Number(e.target.value) })}
              className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30"
            />
          ) : (
            <div className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-2 font-mono text-[10px] text-[var(--muted-foreground)]">
              {JSON.stringify(value, null, 2)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
