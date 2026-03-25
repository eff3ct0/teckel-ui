"use client";

import { useState } from "react";
import { NODE_CATEGORIES, NODE_REGISTRY } from "@/lib/nodes/registry";
import { usePipelineStore } from "@/stores/pipeline-store";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeckelNodeType } from "@/types/pipeline";

export function NodePalette() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["sources", "sinks", "columns", "filtering", "aggregation", "joins-sets", "reshaping", "advanced"]),
  );

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <aside className="flex h-full w-[200px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] px-3 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Nodes
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {NODE_CATEGORIES.map((cat) => (
          <div key={cat.key} className="mb-1">
            <button
              onClick={() => toggleCategory(cat.key)}
              className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            >
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-transform",
                  expandedCategories.has(cat.key) && "rotate-90",
                )}
              />
              {cat.label}
              <span className="ml-auto text-[10px] opacity-50">{cat.types.length}</span>
            </button>
            {expandedCategories.has(cat.key) && (
              <div className="ml-1 mt-0.5 space-y-0.5">
                {cat.types.map((type) => (
                  <PaletteItem key={type} type={type} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

function PaletteItem({ type }: { type: TeckelNodeType }) {
  const def = NODE_REGISTRY[type];
  const Icon = def.icon;
  const addNode = usePipelineStore((s) => s.addNode);

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/teckel-node-type", type);
    e.dataTransfer.effectAllowed = "move";
  };

  const onClick = () => {
    // Fallback: add at a random position if not dragged
    addNode(type, {
      x: 200 + Math.random() * 400,
      y: 100 + Math.random() * 300,
    });
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="flex cursor-grab items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)] active:cursor-grabbing"
    >
      <div
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
        style={{ backgroundColor: `${def.color}20` }}
      >
        <Icon className="h-3 w-3" style={{ color: def.color }} />
      </div>
      <span className="truncate">{def.label}</span>
    </div>
  );
}
