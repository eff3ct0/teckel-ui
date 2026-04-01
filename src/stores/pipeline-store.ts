"use client";

import { create } from "zustand";
import { nanoid } from "@/lib/utils/id";
import type { TeckelNode, TeckelEdge, TeckelNodeType, NodeValidationError, ResolvedTags } from "@/types/pipeline";
import { NODE_REGISTRY } from "@/lib/nodes/registry";
import type { XYPosition, Connection } from "@xyflow/react";

interface HistoryEntry {
  nodes: TeckelNode[];
  edges: TeckelEdge[];
}

export interface PipelineMetadata {
  namespace: string;
  version: string;
  description: string;
  owner: string;
  tags: string[];
  meta: Record<string, string>;
  schedule: string;
}

/**
 * Extra top-level YAML sections from teckel-spec v3.0.
 * Stored as raw objects for roundtrip fidelity.
 */
export interface PipelineExtraSections {
  config: Record<string, unknown> | null;
  secrets: Record<string, unknown> | null;
  hooks: Record<string, unknown> | null;
  quality: unknown[] | null;
  streamingInput: unknown[] | null;
  streamingOutput: unknown[] | null;
  exposures: unknown[] | null;
  templates: unknown[] | null;
}

interface PipelineState {
  id: string;
  name: string;
  metadata: PipelineMetadata;
  extraSections: PipelineExtraSections;
  nodes: TeckelNode[];
  edges: TeckelEdge[];
  selectedNodeId: string | null;
  yaml: string;
  isDirty: boolean;

  history: HistoryEntry[];
  future: HistoryEntry[];

  // Save a snapshot to history (call before a destructive/meaningful change)
  saveSnapshot: () => void;

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
  setMetadata: (metadata: Partial<PipelineMetadata>) => void;
  setExtraSections: (sections: Partial<PipelineExtraSections>) => void;
  setYaml: (yaml: string) => void;
  setNodeValidationErrors: (errorMap: Record<string, NodeValidationError[]>) => void;
  setNodeResolvedTags: (tagMap: Record<string, ResolvedTags>) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

const DEFAULT_EXTRA_SECTIONS: PipelineExtraSections = {
  config: null,
  secrets: null,
  hooks: null,
  quality: null,
  streamingInput: null,
  streamingOutput: null,
  exposures: null,
  templates: null,
};

const DEFAULT_METADATA: PipelineMetadata = {
  namespace: "",
  version: "",
  description: "",
  owner: "",
  tags: [],
  meta: {},
  schedule: "",
};

export const usePipelineStore = create<PipelineState>((set, get) => ({
  id: nanoid(),
  name: "Untitled Pipeline",
  metadata: { ...DEFAULT_METADATA },
  extraSections: { ...DEFAULT_EXTRA_SECTIONS },
  nodes: [],
  edges: [],
  selectedNodeId: null,
  yaml: "",
  isDirty: false,
  history: [],
  future: [],

  // Explicitly save a snapshot — call this before a change you want to be undoable
  saveSnapshot: () => {
    const { nodes, edges, history } = get();
    set({
      history: [...history.slice(-49), { nodes, edges }],
      future: [],
    });
  },

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
    const { nodes, edges, history } = get();
    set({
      history: [...history.slice(-49), { nodes, edges }],
      future: [],
      isDirty: true,
      nodes: [...nodes, newNode],
    });
  },

  removeNodes: (nodeIds) => {
    const { nodes, edges, history, selectedNodeId } = get();
    set({
      history: [...history.slice(-49), { nodes, edges }],
      future: [],
      isDirty: true,
      nodes: nodes.filter((n) => !nodeIds.includes(n.id)),
      edges: edges.filter(
        (e) => !nodeIds.includes(e.source) && !nodeIds.includes(e.target),
      ),
      selectedNodeId:
        selectedNodeId && nodeIds.includes(selectedNodeId) ? null : selectedNodeId,
    });
  },

  // Config/ref updates don't push history — the caller should saveSnapshot once before a batch
  updateNodeConfig: (nodeId, config) => {
    set((state) => ({
      isDirty: true,
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } }
          : n,
      ),
    }));
  },

  updateNodeRef: (nodeId, ref) => {
    set((state) => ({
      isDirty: true,
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
    const { nodes, edges, history } = get();
    set({
      history: [...history.slice(-49), { nodes, edges }],
      future: [],
      isDirty: true,
      edges: [...edges, newEdge],
    });
  },

  removeEdges: (edgeIds) => {
    const { nodes, edges, history } = get();
    set({
      history: [...history.slice(-49), { nodes, edges }],
      future: [],
      isDirty: true,
      edges: edges.filter((e) => !edgeIds.includes(e.id)),
    });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  // setNodes/setEdges: no history push — used for continuous updates (drag, React Flow internals)
  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),

  setName: (name) => set({ name, isDirty: true }),
  setMetadata: (partial) => set((state) => ({
    metadata: { ...state.metadata, ...partial },
    isDirty: true,
  })),
  setExtraSections: (partial) => set((state) => ({
    extraSections: { ...state.extraSections, ...partial },
    isDirty: true,
  })),
  setYaml: (yaml) => set({ yaml }),

  setNodeValidationErrors: (errorMap) => {
    const { nodes } = get();
    // Check if anything actually changed to avoid infinite update loops
    let changed = false;
    for (const n of nodes) {
      const next = errorMap[n.id] ?? [];
      const prev = n.data.validationErrors;
      if (prev.length !== next.length || prev.some((e, i) => e.message !== next[i]?.message || e.severity !== next[i]?.severity)) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    set({
      nodes: nodes.map((n) => ({
        ...n,
        data: { ...n.data, validationErrors: errorMap[n.id] ?? [] },
      })),
    });
  },

  setNodeResolvedTags: (tagMap) => {
    const { nodes } = get();
    // Check if anything actually changed to avoid infinite update loops
    let changed = false;
    for (const n of nodes) {
      const next = tagMap[n.id];
      const prev = n.data.resolvedTags;
      if (!prev && !next) continue;
      if (!prev || !next || prev.effective.join(",") !== next.effective.join(",")) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    set({
      nodes: nodes.map((n) => ({
        ...n,
        data: { ...n.data, resolvedTags: tagMap[n.id] },
      })),
    });
  },

  undo: () => {
    const { history, nodes, edges, future } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      history: history.slice(0, -1),
      future: [{ nodes, edges }, ...future.slice(0, 49)],
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
      metadata: { ...DEFAULT_METADATA },
      extraSections: { ...DEFAULT_EXTRA_SECTIONS },
      nodes: [],
      edges: [],
      selectedNodeId: null,
      yaml: "",
      isDirty: false,
      history: [],
      future: [],
    }),
}));
