"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { AlertCircle, AlertTriangle } from "lucide-react";
import type { TeckelNodeData } from "@/types/pipeline";
import { NODE_REGISTRY } from "@/lib/nodes/registry";
import { usePipelineStore } from "@/stores/pipeline-store";
import { cn } from "@/lib/utils";

type TeckelFlowNode = Node<TeckelNodeData, "teckelNode">;

/** Map well-known tag names to Tailwind color classes. */
const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pii: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40" },
  sensitive: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/40" },
  processed: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/40" },
};

const DEFAULT_TAG_COLOR = { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" };

function getTagColor(tag: string) {
  return TAG_COLORS[tag.toLowerCase()] ?? DEFAULT_TAG_COLOR;
}

function TeckelNodeComponent({ id, data, selected }: NodeProps<TeckelFlowNode>) {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const def = NODE_REGISTRY[data.teckelType];
  const Icon = def.icon;
  const isSelected = selected || selectedNodeId === id;

  // --- Validation indicators ---
  const errors = data.validationErrors?.filter((e) => e.severity === "error") ?? [];
  const warnings = data.validationErrors?.filter((e) => e.severity === "warning") ?? [];
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const [showTooltip, setShowTooltip] = useState(false);

  // --- Tag badges ---
  const resolved = data.resolvedTags;
  const ownTags = resolved?.own ?? [];
  const inheritedTags = resolved?.inherited ?? [];
  const allEffective = resolved?.effective ?? [];
  const MAX_VISIBLE_TAGS = 3;
  const visibleTags = allEffective.slice(0, MAX_VISIBLE_TAGS);
  const extraTagCount = allEffective.length - visibleTags.length;

  return (
    <div
      className={cn(
        "group relative min-w-[180px] rounded-xl border bg-[var(--card)] shadow-md transition-all",
        isSelected
          ? "border-[var(--primary)] ring-1 ring-[var(--primary)]/30"
          : "border-[var(--border)]",
        hasErrors && "border-red-500/60",
        !hasErrors && hasWarnings && "border-amber-500/50",
      )}
    >
      {/* Colored left accent */}
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: def.color }}
      />

      {/* Validation indicator — top-right corner */}
      {(hasErrors || hasWarnings) && (
        <div
          className="absolute -right-1.5 -top-1.5 z-10"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="relative">
            {hasErrors ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 shadow-sm">
                <AlertCircle className="h-3 w-3 text-white" />
              </div>
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 shadow-sm">
                <AlertTriangle className="h-3 w-3 text-white" />
              </div>
            )}
            {/* Count badge */}
            {(errors.length + warnings.length) > 1 && (
              <span className="absolute -bottom-1 -right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[var(--card)] px-0.5 text-[8px] font-bold leading-none text-[var(--foreground)] shadow-sm ring-1 ring-[var(--border)]">
                {errors.length + warnings.length}
              </span>
            )}

            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 shadow-lg">
                {errors.map((e, i) => (
                  <p key={`e-${i}`} className="flex items-start gap-1 text-[10px] text-red-400">
                    <AlertCircle className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                    <span>{e.message}</span>
                  </p>
                ))}
                {warnings.map((w, i) => (
                  <p key={`w-${i}`} className="flex items-start gap-1 text-[10px] text-amber-400">
                    <AlertTriangle className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                    <span>{w.message}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Tag badges */}
      {allEffective.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-2 pl-4">
          {visibleTags.map((tag) => {
            const isOwn = ownTags.includes(tag);
            const isInherited = inheritedTags.includes(tag);
            const colors = getTagColor(tag);
            return (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center rounded-full px-1.5 py-0 text-[10px] leading-4",
                  colors.text,
                  isOwn && !isInherited && cn(colors.bg, "font-medium"),
                  isInherited && !isOwn && cn("border bg-transparent", colors.border, "opacity-70"),
                  isOwn && isInherited && cn(colors.bg, "font-medium"),
                )}
                title={isInherited && !isOwn ? `inherited` : `own`}
              >
                {tag}
              </span>
            );
          })}
          {extraTagCount > 0 && (
            <span
              className="inline-flex items-center rounded-full bg-[var(--muted)]/50 px-1.5 py-0 text-[10px] leading-4 text-[var(--muted-foreground)]"
              title={allEffective.slice(MAX_VISIBLE_TAGS).join(", ")}
            >
              +{extraTagCount}
            </span>
          )}
        </div>
      )}

      {/* Target handle (left) — all nodes except Input */}
      {data.teckelType !== "input" && (
        <Handle
          type="target"
          position={Position.Left}
          isConnectable
          style={{
            width: 12,
            height: 12,
            background: "var(--muted-foreground)",
            border: "2.5px solid var(--card)",
            borderRadius: "50%",
          }}
          className="teckel-handle"
        />
      )}
      {/* Source handle (right) — all nodes except Output */}
      {data.teckelType !== "output" && (
        <Handle
          type="source"
          position={Position.Right}
          isConnectable
          style={{
            width: 12,
            height: 12,
            background: "var(--muted-foreground)",
            border: "2.5px solid var(--card)",
            borderRadius: "50%",
          }}
          className="teckel-handle"
        />
      )}
    </div>
  );
}

export const TeckelNodeRenderer = memo(TeckelNodeComponent);
