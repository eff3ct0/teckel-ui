"use client";

import { create } from "zustand";
import { nanoid } from "@/lib/utils/id";
import type { TeckelNode, TeckelEdge, TeckelNodeType, TeckelNodeData } from "@/types/pipeline";
import { NODE_REGISTRY } from "@/lib/nodes/registry";
import type { XYPosition, Connection } from "@xyflow/react";

interface HistoryEntry {
  nodes: TeckelNode[];
  edges: TeckelEdge[];
}

interface PipelineState {
  // Pipeline data
  id: string;
  name: string;
  nodes: TeckelNode[];
  edges: TeckelEdge[];
  selectedNodeId: string | null;
  yaml: string;
  isDirty: boolean;

  // History
  history: HistoryEntry[];
  future: HistoryEntry[];

  // Actions
  addNode: (type: TeckelNodeType, position: XYPosition) => void;
  removeNodes: (nodeIds: string[]) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  updateNodeRef: (nodeId: string, ref: string) => void;
  addEdge: (connection: Connection) => void;
  removeEdges: (edgeIds: string[]) => void;
  selectNode: (nodeId: string | null) => void;
  setNodes: (nodes: TeckelNode[]) => void;
  setEdges: (edges: TeckelEdge[]) => void;
  setName: (name: string) => void;
  setYaml: (yaml: string) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

function pushHistory(state: PipelineState): Pick<PipelineState, "history" | "future" | "isDirty"> {
  return {
    history: [
      ...state.history.slice(-49),
      { nodes: state.nodes, edges: state.edges },
    ],
    future: [],
    isDirty: true,
  };
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  id: nanoid(),
  name: "Untitled Pipeline",
  nodes: [],
  edges: [],
  selectedNodeId: null,
  yaml: "",
  isDirty: false,
  history: [],
  future: [],

  addNode: (type, position) => {
    const def = NODE_REGISTRY[type];
    const id = nanoid();
    const ref = `${def.label.toLowerCase().replace(/\s+/g, "_")}_${id.slice(0, 4)}`;
    const newNode: TeckelNode = {
      id,
      type: "teckelNode",
      position,
      data: {
        label: def.label,
        ref,
        teckelType: type,
        config: { ...def.defaultConfig },
        validationErrors: [],
      },
    };
    set((state) => ({
      ...pushHistory(state),
      nodes: [...state.nodes, newNode],
    }));
  },

  removeNodes: (nodeIds) => {
    set((state) => ({
      ...pushHistory(state),
      nodes: state.nodes.filter((n) => !nodeIds.includes(n.id)),
      edges: state.edges.filter(
        (e) => !nodeIds.includes(e.source) && !nodeIds.includes(e.target),
      ),
      selectedNodeId:
        state.selectedNodeId && nodeIds.includes(state.selectedNodeId)
          ? null
          : state.selectedNodeId,
    }));
  },

  updateNodeConfig: (nodeId, config) => {
    set((state) => ({
      ...pushHistory(state),
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } }
          : n,
      ),
    }));
  },

  updateNodeRef: (nodeId, ref) => {
    set((state) => ({
      ...pushHistory(state),
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ref } } : n,
      ),
    }));
  },

  addEdge: (connection) => {
    const id = nanoid();
    const newEdge: TeckelEdge = {
      id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
    };
    set((state) => ({
      ...pushHistory(state),
      edges: [...state.edges, newEdge],
    }));
  },

  removeEdges: (edgeIds) => {
    set((state) => ({
      ...pushHistory(state),
      edges: state.edges.filter((e) => !edgeIds.includes(e.id)),
    }));
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setNodes: (nodes) => set({ nodes, isDirty: true }),

  setEdges: (edges) => set({ edges, isDirty: true }),

  setName: (name) => set({ name, isDirty: true }),

  setYaml: (yaml) => set({ yaml }),

  undo: () => {
    const { history, nodes, edges, future } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      history: history.slice(0, -1),
      future: [{ nodes, edges }, ...future],
      isDirty: true,
    });
  },

  redo: () => {
    const { future, nodes, edges, history } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      nodes: next.nodes,
      edges: next.edges,
      future: future.slice(1),
      history: [...history, { nodes, edges }],
      isDirty: true,
    });
  },

  reset: () =>
    set({
      id: nanoid(),
      name: "Untitled Pipeline",
      nodes: [],
      edges: [],
      selectedNodeId: null,
      yaml: "",
      isDirty: false,
      history: [],
      future: [],
    }),
}));
