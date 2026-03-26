"use client";

import { useMemo } from "react";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useUIStore } from "@/stores/ui-store";
import { NODE_REGISTRY } from "@/lib/nodes/registry";
import { NODE_SCHEMAS } from "@/lib/nodes/schemas";
import { NodeConfigForm } from "@/components/config/node-forms";
import { X, AlertCircle } from "lucide-react";

export function ConfigPanel() {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const nodes = usePipelineStore((s) => s.nodes);
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);
  const updateNodeRef = usePipelineStore((s) => s.updateNodeRef);
  const removeNodes = usePipelineStore((s) => s.removeNodes);
  const saveSnapshot = usePipelineStore((s) => s.saveSnapshot);
  const isOpen = useUIStore((s) => s.isConfigPanelOpen);
  const close = useUIStore((s) => s.closeConfigPanel);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const validationErrors = useMemo(() => {
    if (!selectedNode) return [];
    const schema = NODE_SCHEMAS[selectedNode.data.teckelType];
    const result = schema.safeParse(selectedNode.data.config);
    if (result.success) return [];
    return result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
  }, [selectedNode]);

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
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              removeNodes([selectedNode.id]);
              close();
            }}
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-[10px] text-red-400 transition-colors hover:bg-red-500/10"
          >
            Delete
          </button>
          <button
            onClick={close}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Ref field */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
            Reference
          </label>
          <input
            value={selectedNode.data.ref}
            onFocus={saveSnapshot}
            onChange={(e) => updateNodeRef(selectedNode.id, e.target.value)}
            className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 font-mono text-xs text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30"
            placeholder="asset_ref"
          />
        </div>

        <div className="mb-4 h-px bg-[var(--border)]" />

        {/* Type-specific form */}
        <NodeConfigForm
          nodeType={selectedNode.data.teckelType}
          config={selectedNode.data.config}
          onChange={(config) => updateNodeConfig(selectedNode.id, config)}
          nodeId={selectedNode.id}
          onBeforeChange={saveSnapshot}
        />

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              Validation Issues
            </div>
            <ul className="space-y-1">
              {validationErrors.map((err, i) => (
                <li key={i} className="text-[10px] text-red-400/80">
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
