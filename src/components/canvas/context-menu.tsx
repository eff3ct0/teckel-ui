"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { usePipelineStore } from "@/stores/pipeline-store";
import { Copy, Trash2, Clipboard, SquareStack } from "lucide-react";
import { nanoid } from "@/lib/utils/id";
import type { TeckelNode } from "@/types/pipeline";

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  nodeId: string | null;
  onClose: () => void;
}

export function ContextMenu({ position, nodeId, onClose }: ContextMenuProps) {
  const removeNodes = usePipelineStore((s) => s.removeNodes);
  const nodes = usePipelineStore((s) => s.nodes);
  const setNodes = usePipelineStore((s) => s.setNodes);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (position) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [position, onClose]);

  if (!position) return null;

  const selectedNode = nodeId ? nodes.find((n) => n.id === nodeId) : null;

  const duplicateNode = () => {
    if (!selectedNode) return;
    const newId = nanoid();
    const newNode: TeckelNode = {
      ...selectedNode,
      id: newId,
      position: {
        x: selectedNode.position.x + 40,
        y: selectedNode.position.y + 40,
      },
      data: {
        ...selectedNode.data,
        ref: `${selectedNode.data.ref}_copy`,
      },
      selected: false,
    };
    setNodes([...nodes, newNode]);
    onClose();
  };

  const deleteNode = () => {
    if (nodeId) {
      removeNodes([nodeId]);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-xl"
      style={{ left: position.x, top: position.y }}
    >
      {selectedNode && (
        <>
          <button
            onClick={duplicateNode}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]"
          >
            <SquareStack className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            Duplicate
          </button>
          <div className="my-1 h-px bg-[var(--border)]" />
          <button
            onClick={deleteNode}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </>
      )}
      {!selectedNode && (
        <div className="px-3 py-1.5 text-xs text-[var(--muted-foreground)]">
          Right-click a node for options
        </div>
      )}
    </div>
  );
}
