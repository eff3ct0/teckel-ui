import * as yaml from "js-yaml";
import type { TeckelNode, TeckelEdge, TeckelNodeType } from "@/types/pipeline";

interface TeckelInput {
  name: string;
  format: string;
  path: string;
  options?: Record<string, string>;
}

interface TeckelOutput {
  name: string;
  format: string;
  mode: string;
  path: string;
  partitionBy?: string[];
  options?: Record<string, string>;
}

interface TeckelTransformation {
  name: string;
  [operation: string]: unknown;
}

interface TeckelPipeline {
  input: TeckelInput[];
  transformation?: TeckelTransformation[];
  output: TeckelOutput[];
}

/**
 * Topological sort of nodes using Kahn's algorithm.
 * Returns nodes in execution order (inputs first, outputs last).
 */
function topologicalSort(nodes: TeckelNode[], edges: TeckelEdge[]): TeckelNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      adjacency.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: TeckelNode[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) sorted.push(node);

    for (const neighbor of adjacency.get(id) || []) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return sorted;
}

/**
 * Find all "from" references for a node — the refs of all source nodes (incoming edges).
 */
function getAllFromRefs(
  nodeId: string,
  edges: TeckelEdge[],
  nodeMap: Map<string, TeckelNode>,
): string[] {
  return edges
    .filter((e) => e.target === nodeId)
    .map((e) => nodeMap.get(e.source)?.data.ref)
    .filter((ref): ref is string => !!ref);
}

/**
 * Find the primary "from" reference (first incoming edge).
 */
function getFromRef(
  nodeId: string,
  edges: TeckelEdge[],
  nodeMap: Map<string, TeckelNode>,
): string | undefined {
  return getAllFromRefs(nodeId, edges, nodeMap)[0];
}

/**
 * Map a node type and its config to the Teckel YAML transformation format.
 * Receives all incoming refs to support N-input transforms.
 */
function buildTransformation(
  node: TeckelNode,
  fromRef: string | undefined,
  allFromRefs: string[],
  edges: TeckelEdge[],
  nodeMap: Map<string, TeckelNode>,
): TeckelTransformation | null {
  const config = node.data.config;
  const type = node.data.teckelType;

  const TRANSFORM_MAP: Record<string, () => TeckelTransformation | null> = {
    select: () => ({
      name: node.data.ref,
      select: {
        from: fromRef,
        columns: (config.columns as string[]) || [],
      },
    }),
    where: () => ({
      name: node.data.ref,
      where: {
        from: fromRef,
        filter: (config.condition as string) || "",
      },
    }),
    join: () => {
      // Join uses first incoming edge as "from" and remaining as "with"
      const others = allFromRefs.slice(1);
      const configRef = config.ref as string;
      const withRefs = others.length > 0 ? others : configRef ? [configRef] : [];
      return {
        name: node.data.ref,
        join: {
          from: fromRef,
          with: withRefs.length === 1 ? withRefs[0] : withRefs,
          on: (config.on as string) || "",
          type: (config.joinType as string) || "inner",
        },
      };
    },
    groupBy: () => ({
      name: node.data.ref,
      group: {
        from: fromRef,
        by: (config.columns as string[]) || [],
        agg: ((config.agg as Array<{ column: string; function: string }>) || []).map(
          (a) => `${a.function}(${a.column})`,
        ),
      },
    }),
    orderBy: () => {
      const columns = (config.columns as Array<{ column: string; direction: string }>) || [];
      return {
        name: node.data.ref,
        order: {
          from: fromRef,
          by: columns.map((c) => c.column),
          order: columns[0]?.direction === "desc" ? "Desc" : "Asc",
        },
      };
    },
    sql: () => ({
      name: node.data.ref,
      sql: {
        from: fromRef,
        query: (config.query as string) || "",
      },
    }),
    window: () => ({
      name: node.data.ref,
      window: {
        from: fromRef,
        partitionBy: (config.partitionBy as string[]) || [],
        orderBy: (config.orderBy as string[]) || [],
      },
    }),
    union: () => {
      // Union merges all incoming edges as sources
      const sources = allFromRefs.length > 0 ? allFromRefs : (config.refs as string[]) || [];
      return {
        name: node.data.ref,
        union: { sources },
      };
    },
    intersect: () => {
      const sources = allFromRefs.length > 0 ? allFromRefs : (config.refs as string[]) || [];
      return {
        name: node.data.ref,
        intersect: { sources },
      };
    },
    except: () => {
      // Except: first incoming is "left", second is "right"
      const left = allFromRefs[0] || (config.refs as string[])?.[0] || "";
      const right = allFromRefs[1] || (config.refs as string[])?.[1] || "";
      return {
        name: node.data.ref,
        except: { left, right },
      };
    },
    addColumns: () => ({
      name: node.data.ref,
      addColumns: {
        from: fromRef,
        columns: Object.fromEntries(
          ((config.columns as Array<{ name: string; expression: string }>) || []).map((c) => [
            c.name,
            c.expression,
          ]),
        ),
      },
    }),
    dropColumns: () => ({
      name: node.data.ref,
      dropColumns: {
        from: fromRef,
        columns: (config.columns as string[]) || [],
      },
    }),
    renameColumns: () => ({
      name: node.data.ref,
      renameColumns: {
        from: fromRef,
        mapping: (config.mapping as Record<string, string>) || {},
      },
    }),
    castColumns: () => ({
      name: node.data.ref,
      castColumns: {
        from: fromRef,
        mapping: (config.mapping as Record<string, string>) || {},
      },
    }),
    distinct: () => ({
      name: node.data.ref,
      distinct: {
        from: fromRef,
      },
    }),
    limit: () => ({
      name: node.data.ref,
      limit: {
        from: fromRef,
        count: (config.count as number) || 100,
      },
    }),
    sample: () => ({
      name: node.data.ref,
      sample: {
        from: fromRef,
        fraction: (config.fraction as number) || 0.1,
        ...(config.seed != null ? { seed: config.seed } : {}),
      },
    }),
    pivot: () => ({
      name: node.data.ref,
      pivot: {
        from: fromRef,
        pivotColumn: (config.pivotColumn as string) || "",
        values: (config.values as string[]) || [],
        agg: (config.agg as Record<string, string>) || {},
      },
    }),
    unpivot: () => ({
      name: node.data.ref,
      unpivot: {
        from: fromRef,
        idColumns: (config.idColumns as string[]) || [],
        valueColumns: (config.valueColumns as string[]) || [],
      },
    }),
    repartition: () => ({
      name: node.data.ref,
      repartition: {
        from: fromRef,
        numPartitions: (config.numPartitions as number) || 200,
      },
    }),
    coalesce: () => ({
      name: node.data.ref,
      coalesce: {
        from: fromRef,
        numPartitions: (config.numPartitions as number) || 1,
      },
    }),
  };

  const builder = TRANSFORM_MAP[type];
  return builder ? builder() : null;
}

/**
 * Generate Teckel YAML from nodes and edges.
 */
export function generateYaml(nodes: TeckelNode[], edges: TeckelEdge[]): string {
  if (nodes.length === 0) return "";

  const sorted = topologicalSort(nodes, edges);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const inputs: TeckelInput[] = [];
  const transformations: TeckelTransformation[] = [];
  const outputs: TeckelOutput[] = [];

  for (const node of sorted) {
    const type = node.data.teckelType;
    const config = node.data.config;

    if (type === "input") {
      const input: TeckelInput = {
        name: node.data.ref,
        format: (config.format as string) || "parquet",
        path: (config.path as string) || "",
      };
      const options = config.options as Record<string, string> | undefined;
      if (options && Object.keys(options).length > 0) {
        input.options = options;
      }
      inputs.push(input);
    } else if (type === "output") {
      const fromRef = getFromRef(node.id, edges, nodeMap);
      const output: TeckelOutput = {
        name: fromRef || node.data.ref,
        format: (config.format as string) || "parquet",
        mode: (config.mode as string) || "overwrite",
        path: (config.path as string) || "",
      };
      const partitionBy = config.partitionBy as string[] | undefined;
      if (partitionBy && partitionBy.length > 0) {
        output.partitionBy = partitionBy;
      }
      const options = config.options as Record<string, string> | undefined;
      if (options && Object.keys(options).length > 0) {
        output.options = options;
      }
      outputs.push(output);
    } else {
      const allFromRefs = getAllFromRefs(node.id, edges, nodeMap);
      const fromRef = allFromRefs[0];
      const transformation = buildTransformation(node, fromRef, allFromRefs, edges, nodeMap);
      if (transformation) {
        transformations.push(transformation);
      }
    }
  }

  const pipeline: TeckelPipeline = {
    input: inputs,
    ...(transformations.length > 0 ? { transformation: transformations } : {}),
    output: outputs,
  };

  return yaml.dump(pipeline, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    quotingType: "'",
    forceQuotes: false,
  });
}
