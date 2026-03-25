"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { TeckelNodeData } from "@/types/pipeline";
import { NODE_REGISTRY } from "@/lib/nodes/registry";
import { usePipelineStore } from "@/stores/pipeline-store";
import { cn } from "@/lib/utils";

type TeckelFlowNode = Node<TeckelNodeData, "teckelNode">;

function TeckelNodeComponent({ id, data, selected }: NodeProps<TeckelFlowNode>) {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const def = NODE_REGISTRY[data.teckelType];
  const Icon = def.icon;
  const hasErrors = data.validationErrors.length > 0;
  const isSelected = selected || selectedNodeId === id;

  return (
    <div
      className={cn(
        "group relative min-w-[180px] rounded-xl border bg-[var(--card)] shadow-md transition-all",
        isSelected
          ? "border-[var(--primary)] ring-1 ring-[var(--primary)]/30"
          : "border-[var(--border)]",
        hasErrors && "border-red-500/60",
      )}
    >
      {/* Colored left accent */}
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: def.color }}
      />

      <div className="flex items-center gap-2.5 px-3 py-2.5 pl-4">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${def.color}20` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: def.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[var(--foreground)]">{data.label}</p>
          <p className="truncate font-mono text-[10px] text-[var(--muted-foreground)]">
            {data.ref}
          </p>
        </div>
      </div>

      {/* Handles */}
      {data.teckelType !== "input" && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-[var(--card)] !bg-[var(--muted-foreground)]"
        />
      )}
      {data.teckelType !== "output" && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-[var(--card)] !bg-[var(--muted-foreground)]"
        />
      )}
    </div>
  );
}

export const TeckelNodeRenderer = memo(TeckelNodeComponent);
