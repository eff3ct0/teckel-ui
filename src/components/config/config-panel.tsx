"use client";

import { useMemo, useState } from "react";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useUIStore } from "@/stores/ui-store";
import { useResize } from "@/hooks/use-resize";
import { NODE_REGISTRY } from "@/lib/nodes/registry";
import { NODE_SCHEMAS } from "@/lib/nodes/schemas";
import { NodeConfigForm } from "@/components/config/node-forms";
import { PipelineMetadataForm } from "@/components/config/pipeline-metadata-form";
import { ConnectionPanel } from "@/components/config/connection-panel";
import { X, AlertCircle, GripVertical, Settings2 } from "lucide-react";

type SettingsTab = "pipeline" | "connection";

export function ConfigPanel() {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const nodes = usePipelineStore((s) => s.nodes);
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);
  const updateNodeRef = usePipelineStore((s) => s.updateNodeRef);
  const removeNodes = usePipelineStore((s) => s.removeNodes);
  const saveSnapshot = usePipelineStore((s) => s.saveSnapshot);
  const isOpen = useUIStore((s) => s.isConfigPanelOpen);
  const close = useUIStore((s) => s.closeConfigPanel);
  const { width, onResizeStart } = useResize({
    initialWidth: 360,
    minWidth: 260,
    maxWidth: 600,
    direction: "right",
  });

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const validationErrors = useMemo(() => {
    if (!selectedNode) return [];
    const schema = NODE_SCHEMAS[selectedNode.data.teckelType];
    const result = schema.safeParse(selectedNode.data.config);
    if (result.success) return [];
    return result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
  }, [selectedNode]);

  if (!isOpen) return null;

  // Show settings panel (pipeline metadata + connection) when no node is selected
  if (!selectedNode) {
    return <SettingsPanel width={width} onResizeStart={onResizeStart} onClose={close} />;
  }

  const def = NODE_REGISTRY[selectedNode.data.teckelType];
  const Icon = def.icon;

  return (
    <aside className="flex h-full shrink-0" style={{ width }}>
      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        className="group flex w-2 cursor-col-resize items-center justify-center hover:bg-[var(--primary)]/10"
      >
        <GripVertical className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col border-l border-[var(--border)] bg-[var(--card)]">
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
      </div>
    </aside>
  );
}

function SettingsPanel({
  width,
  onResizeStart,
  onClose,
}: {
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<SettingsTab>("pipeline");

  return (
    <aside className="flex h-full shrink-0" style={{ width }}>
      <div
        onMouseDown={onResizeStart}
        className="group flex w-2 cursor-col-resize items-center justify-center hover:bg-[var(--primary)]/10"
      >
        <GripVertical className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col border-l border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--primary)]/10">
              <Settings2 className="h-3.5 w-3.5 text-[var(--primary)]" />
            </div>
            <span className="text-sm font-semibold text-[var(--foreground)]">Settings</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          {(["pipeline", "connection"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                tab === t
                  ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {t === "pipeline" ? "Pipeline" : "Connection"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "pipeline" ? <PipelineMetadataForm /> : <ConnectionPanel />}
        </div>
      </div>
    </aside>
  );
}
