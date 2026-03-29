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
  "flatten",
  "conditional",
  "split",
  "rollup",
  "cube",
  "scd2",
  "enrich",
  "schemaEnforce",
  "assertion",
  "custom",
  "offset",
  "tail",
  "fillNa",
  "dropNa",
  "replace",
  "merge",
  "parse",
  "asOfJoin",
  "lateralJoin",
  "transpose",
  "groupingSets",
  "describe",
  "crosstab",
  "hint",
] as const;

export type TeckelNodeType = (typeof TECKEL_NODE_TYPES)[number];

export type NodeCategory =
  | "sources"
  | "sinks"
  | "columns"
  | "filtering"
  | "aggregation"
  | "joins-sets"
  | "reshaping"
  | "quality"
  | "advanced";

export interface NodeValidationError {
  nodeId: string;
  severity: "error" | "warning";
  message: string;
}

export interface ResolvedTags {
  own: string[];
  inherited: string[];
  removed: string[];
  effective: string[];
}

export interface TeckelNodeData extends Record<string, unknown> {
  label: string;
  ref: string;
  teckelType: TeckelNodeType;
  config: Record<string, unknown>;
  validationErrors: NodeValidationError[];
  resolvedTags?: ResolvedTags;
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
