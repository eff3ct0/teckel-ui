"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { TopBar } from "@/components/topbar/topbar";
import { NodePalette } from "@/components/palette/node-palette";
import { PipelineCanvas } from "@/components/canvas/pipeline-canvas";
import { ConfigPanel } from "@/components/config/config-panel";
import { YamlPanel } from "@/components/yaml/yaml-panel";
import { TutorialOverlay } from "@/components/tutorial/tutorial-overlay";
import { useUIStore } from "@/stores/ui-store";
import { useTutorialStore } from "@/stores/tutorial-store";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useYamlSync } from "@/hooks/use-yaml-sync";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useValidation } from "@/hooks/use-validation";
import { resolveAllTags } from "@/lib/nodes/tag-propagation";
import type { TeckelNodeType, NodeValidationError } from "@/types/pipeline";

export function PipelineEditor() {
  useYamlSync();
  useKeyboardShortcuts();
  useAutoSave();
  const isPaletteOpen = useUIStore((s) => s.isPaletteOpen);
  const canvasRef = useRef<HTMLDivElement>(null);
  const addNode = usePipelineStore((s) => s.addNode);
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const setNodeValidationErrors = usePipelineStore((s) => s.setNodeValidationErrors);
  const setNodeResolvedTags = usePipelineStore((s) => s.setNodeResolvedTags);

  useEffect(() => {
    const s = useTutorialStore.getState();
    if (!s.hasSeenTutorial && !s.isOpen) s.open();
  }, []);

  // Push per-node validation errors into node data
  const { nodeErrors } = useValidation();
  useEffect(() => {
    const errorMap: Record<string, NodeValidationError[]> = {};
    for (const [nodeId, errs] of nodeErrors) {
      errorMap[nodeId] = errs;
    }
    setNodeValidationErrors(errorMap);
  }, [nodeErrors, setNodeValidationErrors]);

  // Resolve and push tag data into node data
  const resolvedTags = useMemo(() => resolveAllTags(nodes, edges), [nodes, edges]);
  useEffect(() => {
    setNodeResolvedTags(resolvedTags);
  }, [resolvedTags, setNodeResolvedTags]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/teckel-node-type") as TeckelNodeType;
      if (!type) return;

      const bounds = canvasRef.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = {
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      };

      addNode(type, position);
    },
    [addNode],
  );

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--background)]">
        <TopBar />

        <div className="flex flex-1 overflow-hidden">
          {/* Node Palette - Left sidebar */}
          {isPaletteOpen && <NodePalette />}

          {/* Canvas + YAML panel */}
          <main className="flex flex-1 flex-col overflow-hidden">
            <div
              ref={canvasRef}
              className="flex-1"
              onDragOver={onDragOver}
              onDrop={onDrop}
            >
              <PipelineCanvas />
            </div>

            {/* YAML Preview - Bottom */}
            <YamlPanel />
          </main>

          {/* Config Panel - Right sidebar */}
          <ConfigPanel />
        </div>

        <TutorialOverlay />
      </div>
    </ReactFlowProvider>
  );
}
