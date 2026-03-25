"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { usePipelineStore } from "@/stores/pipeline-store";
import { useUIStore } from "@/stores/ui-store";
import { useThemeStore } from "@/stores/theme-store";
import { TeckelNodeRenderer } from "@/components/nodes/teckel-node";
import { ContextMenu } from "@/components/canvas/context-menu";
import { NODE_REGISTRY } from "@/lib/nodes/registry";
import type { TeckelNode, TeckelEdge, TeckelNodeData } from "@/types/pipeline";

const nodeTypes = {
  teckelNode: TeckelNodeRenderer,
} as const;

export function PipelineCanvas() {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const setNodes = usePipelineStore((s) => s.setNodes);
  const setEdges = usePipelineStore((s) => s.setEdges);
  const addEdge = usePipelineStore((s) => s.addEdge);
  const selectNode = usePipelineStore((s) => s.selectNode);
  const openConfigPanel = useUIStore((s) => s.openConfigPanel);
  const theme = useThemeStore((s) => s.theme);

  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number } | null;
    nodeId: string | null;
  }>({ position: null, nodeId: null });

  const onNodesChange: OnNodesChange<TeckelNode> = useCallback(
    (changes) => {
      setNodes(applyNodeChanges(changes, nodes));
    },
    [nodes, setNodes],
  );

  const onEdgesChange: OnEdgesChange<TeckelEdge> = useCallback(
    (changes) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      // Prevent duplicate edges between the same source-target pair
      const exists = usePipelineStore
        .getState()
        .edges.some(
          (e) => e.source === connection.source && e.target === connection.target,
        );
      if (!exists) {
        addEdge(connection);
      }
    },
    [addEdge],
  );

  const onNodeClick: NodeMouseHandler<TeckelNode> = useCallback(
    (_event, node) => {
      selectNode(node.id);
      openConfigPanel();
    },
    [selectNode, openConfigPanel],
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
    setContextMenu({ position: null, nodeId: null });
  }, [selectNode]);

  const onNodeContextMenu: NodeMouseHandler<TeckelNode> = useCallback(
    (event, node) => {
      event.preventDefault();
      selectNode(node.id);
      setContextMenu({
        position: { x: event.clientX, y: event.clientY },
        nodeId: node.id,
      });
    },
    [selectNode],
  );

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      setContextMenu({
        position: { x: event.clientX, y: event.clientY },
        nodeId: null,
      });
    },
    [],
  );

  const miniMapNodeColor = useCallback((node: TeckelNode) => {
    const data = node.data as TeckelNodeData;
    return NODE_REGISTRY[data.teckelType]?.color ?? "#52525b";
  }, []);

  return (
    <>
      <ReactFlow<TeckelNode, TeckelEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        snapToGrid
        snapGrid={[20, 20]}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          interactionWidth: 20,
          style: { stroke: "var(--muted-foreground)", strokeWidth: 1.5 },
        }}
        edgesFocusable
        edgesReconnectable
        style={{ backgroundColor: "var(--background)" }}
        colorMode={theme}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--canvas-dot)" />
        <Controls position="bottom-right" showInteractive={false} />
        <MiniMap
          position="bottom-left"
          nodeColor={miniMapNodeColor}
          maskColor="var(--minimap-mask)"
          style={{ backgroundColor: "var(--minimap-bg)" }}
        />
      </ReactFlow>
      <ContextMenu
        position={contextMenu.position}
        nodeId={contextMenu.nodeId}
        onClose={() => setContextMenu({ position: null, nodeId: null })}
      />
    </>
  );
}
