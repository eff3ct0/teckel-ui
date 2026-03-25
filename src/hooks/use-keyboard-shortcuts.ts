"use client";

import { useEffect } from "react";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useUIStore } from "@/stores/ui-store";

export function useKeyboardShortcuts() {
  const undo = usePipelineStore((s) => s.undo);
  const redo = usePipelineStore((s) => s.redo);
  const removeNodes = usePipelineStore((s) => s.removeNodes);
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const selectNode = usePipelineStore((s) => s.selectNode);
  const toggleYamlPanel = useUIStore((s) => s.toggleYamlPanel);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.getAttribute?.("role") === "textbox";

      // Undo: Ctrl+Z
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (isInput) return;
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if (
        (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
        (e.key === "y" && (e.ctrlKey || e.metaKey))
      ) {
        if (isInput) return;
        e.preventDefault();
        redo();
        return;
      }

      // Delete/Backspace: remove selected node
      if ((e.key === "Delete" || e.key === "Backspace") && !isInput) {
        if (selectedNodeId) {
          e.preventDefault();
          removeNodes([selectedNodeId]);
        }
        return;
      }

      // Escape: deselect
      if (e.key === "Escape") {
        selectNode(null);
        return;
      }

      // Ctrl+E: toggle YAML panel
      if (e.key === "e" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleYamlPanel();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, removeNodes, selectedNodeId, selectNode, toggleYamlPanel]);
}
