"use client";

import { useCallback, useMemo } from "react";
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
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { usePipelineStore } from "@/stores/pipeline-store";
import { useUIStore } from "@/stores/ui-store";
import { TeckelNodeRenderer } from "@/components/nodes/teckel-node";
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
      addEdge(connection);
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
  }, [selectNode]);

  const miniMapNodeColor = useCallback((node: TeckelNode) => {
    const data = node.data as TeckelNodeData;
    return NODE_REGISTRY[data.teckelType]?.color ?? "#52525b";
  }, []);

  return (
    <ReactFlow<TeckelNode, TeckelEdge>
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      snapToGrid
      snapGrid={[20, 20]}
      fitView
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{
        type: "smoothstep",
        animated: true,
        style: { stroke: "var(--muted-foreground)", strokeWidth: 1.5 },
      }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#27272a" />
      <Controls position="bottom-right" showInteractive={false} />
      <MiniMap
        position="bottom-left"
        nodeColor={miniMapNodeColor}
        maskColor="rgba(0, 0, 0, 0.6)"
        style={{ backgroundColor: "#18181b" }}
      />
    </ReactFlow>
  );
}
