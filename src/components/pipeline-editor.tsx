"use client";

import { useCallback, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { TopBar } from "@/components/topbar/topbar";
import { NodePalette } from "@/components/palette/node-palette";
import { PipelineCanvas } from "@/components/canvas/pipeline-canvas";
import { ConfigPanel } from "@/components/config/config-panel";
import { YamlPanel } from "@/components/yaml/yaml-panel";
import { useUIStore } from "@/stores/ui-store";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useYamlSync } from "@/hooks/use-yaml-sync";
import type { TeckelNodeType } from "@/types/pipeline";

export function PipelineEditor() {
  useYamlSync();
  const isPaletteOpen = useUIStore((s) => s.isPaletteOpen);
  const canvasRef = useRef<HTMLDivElement>(null);
  const addNode = usePipelineStore((s) => s.addNode);

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
      </div>
    </ReactFlowProvider>
  );
}
