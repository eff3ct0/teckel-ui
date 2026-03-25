import type { Node, Edge } from "@xyflow/react";

export const TECKEL_NODE_TYPES = [
  "input",
  "output",
  "select",
  "where",
  "join",
  "groupBy",
  "orderBy",
  "sql",
  "window",
  "union",
  "intersect",
  "except",
  "addColumns",
  "dropColumns",
  "renameColumns",
  "castColumns",
  "distinct",
  "limit",
  "sample",
  "pivot",
  "unpivot",
  "repartition",
  "coalesce",
] as const;

export type TeckelNodeType = (typeof TECKEL_NODE_TYPES)[number];

export type NodeCategory = "sources" | "sinks" | "transforms";

export interface TeckelNodeData extends Record<string, unknown> {
  label: string;
  ref: string;
  teckelType: TeckelNodeType;
  config: Record<string, unknown>;
  validationErrors: string[];
}

export type TeckelNode = Node<TeckelNodeData>;
export type TeckelEdge = Edge;

export interface Pipeline {
  id: string;
  name: string;
  nodes: TeckelNode[];
  edges: TeckelEdge[];
  createdAt: string;
  updatedAt: string;
}
