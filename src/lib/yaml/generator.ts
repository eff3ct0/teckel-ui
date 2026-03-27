import * as yaml from "js-yaml";
import type { TeckelNode, TeckelEdge, TeckelNodeType } from "@/types/pipeline";
import type { PipelineMetadata } from "@/stores/pipeline-store";

interface TeckelInput {
  name: string;
  format: string;
  path: string;
  options?: Record<string, string>;
  description?: string;
  tags?: string[];
  meta?: Record<string, string>;
  owner?: string;
}

interface TeckelOutput {
  name: string;
  format: string;
  mode: string;
  path: string;
  partitionBy?: string[];
  options?: Record<string, string>;
  description?: string;
  tags?: string[];
  meta?: Record<string, string>;
  freshness?: string;
  maturity?: string;
}

interface TeckelTransformation {
  name: string;
  [operation: string]: unknown;
}

interface TeckelPipelineSection {
  name?: string;
  namespace?: string;
  version?: string;
  description?: string;
  owner?: string;
  tags?: string[];
  meta?: Record<string, string>;
  schedule?: string;
}

interface TeckelPipelineDoc {
  version: string;
  pipeline?: TeckelPipelineSection;
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
 */
function buildTransformation(
  node: TeckelNode,
  fromRef: string | undefined,
  allFromRefs: string[],
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
        filter: (config.filter as string) || "",
      },
    }),
    join: () => {
      // Spec: left is first edge, right is array of JoinTarget
      const rightRefs = allFromRefs.slice(1);
      const joinType = (config.joinType as string) || "inner";
      const on = (config.on as string) || "";
      return {
        name: node.data.ref,
        join: {
          left: fromRef,
          right: rightRefs.map((ref) => ({
            name: ref,
            type: joinType,
            on: on ? [on] : [],
          })),
        },
      };
    },
    groupBy: () => ({
      name: node.data.ref,
      group: {
        from: fromRef,
        by: (config.by as string[]) || [],
        agg: (config.agg as string[]) || [],
      },
    }),
    orderBy: () => {
      const columns = (config.columns as Array<{ column: string; direction: string; nulls: string }>) || [];
      return {
        name: node.data.ref,
        orderBy: {
          from: fromRef,
          columns: columns.map((c) => {
            const entry: Record<string, string> = { column: c.column };
            if (c.direction !== "asc") entry.direction = c.direction;
            if (c.nulls !== "last") entry.nulls = c.nulls;
            return entry;
          }),
        },
      };
    },
    sql: () => {
      const views = (config.views as string[]) || [];
      // If no explicit views, use incoming edges as views
      const effectiveViews = views.length > 0 ? views : allFromRefs;
      return {
        name: node.data.ref,
        sql: {
          query: (config.query as string) || "",
          views: effectiveViews,
        },
      };
    },
    window: () => {
      const orderBy = (config.orderBy as Array<{ column: string; direction: string; nulls: string }>) || [];
      const frame = (config.frame as { type: string; start: string; end: string }) || {};
      const functions = (config.functions as Array<{ expression: string; alias: string }>) || [];
      const result: Record<string, unknown> = {
        from: fromRef,
        partitionBy: (config.partitionBy as string[]) || [],
        functions: functions,
      };
      if (orderBy.length > 0) {
        result.orderBy = orderBy.map((c) => {
          const entry: Record<string, string> = { column: c.column };
          if (c.direction !== "asc") entry.direction = c.direction;
          if (c.nulls !== "last") entry.nulls = c.nulls;
          return entry;
        });
      }
      if (frame.type && (frame.type !== "range" || frame.start !== "unbounded preceding" || frame.end !== "current row")) {
        result.frame = frame;
      }
      return { name: node.data.ref, window: result };
    },
    union: () => {
      const sources = allFromRefs.length > 0 ? allFromRefs : (config.sources as string[]) || [];
      const all = config.all !== false;
      return {
        name: node.data.ref,
        union: { sources, ...(all ? {} : { all: false }) },
      };
    },
    intersect: () => {
      const sources = allFromRefs.length > 0 ? allFromRefs : (config.sources as string[]) || [];
      const all = config.all === true;
      return {
        name: node.data.ref,
        intersect: { sources, ...(all ? { all: true } : {}) },
      };
    },
    except: () => {
      const left = allFromRefs[0] || (config.left as string) || "";
      const right = allFromRefs[1] || (config.right as string) || "";
      const all = config.all === true;
      return {
        name: node.data.ref,
        except: { left, right, ...(all ? { all: true } : {}) },
      };
    },
    addColumns: () => ({
      name: node.data.ref,
      addColumns: {
        from: fromRef,
        columns: (config.columns as Array<{ name: string; expression: string }>) || [],
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
        mappings: (config.mappings as Record<string, string>) || {},
      },
    }),
    castColumns: () => ({
      name: node.data.ref,
      castColumns: {
        from: fromRef,
        columns: (config.columns as Array<{ name: string; targetType: string }>) || [],
      },
    }),
    distinct: () => {
      const columns = (config.columns as string[]) || [];
      return {
        name: node.data.ref,
        distinct: {
          from: fromRef,
          ...(columns.length > 0 ? { columns } : {}),
        },
      };
    },
    limit: () => ({
      name: node.data.ref,
      limit: {
        from: fromRef,
        count: (config.count as number) || 100,
      },
    }),
    sample: () => {
      const withReplacement = config.withReplacement === true;
      return {
        name: node.data.ref,
        sample: {
          from: fromRef,
          fraction: (config.fraction as number) || 0.1,
          ...(withReplacement ? { withReplacement: true } : {}),
          ...(config.seed != null ? { seed: config.seed } : {}),
        },
      };
    },
    pivot: () => ({
      name: node.data.ref,
      pivot: {
        from: fromRef,
        groupBy: (config.groupBy as string[]) || [],
        pivotColumn: (config.pivotColumn as string) || "",
        values: (config.values as string[]) || [],
        agg: (config.agg as string[]) || [],
      },
    }),
    unpivot: () => ({
      name: node.data.ref,
      unpivot: {
        from: fromRef,
        ids: (config.ids as string[]) || [],
        values: (config.values as string[]) || [],
        variableColumn: (config.variableColumn as string) || "",
        valueColumn: (config.valueColumn as string) || "",
      },
    }),
    repartition: () => {
      const columns = (config.columns as string[]) || [];
      return {
        name: node.data.ref,
        repartition: {
          from: fromRef,
          numPartitions: (config.numPartitions as number) || 200,
          ...(columns.length > 0 ? { columns } : {}),
        },
      };
    },
    coalesce: () => ({
      name: node.data.ref,
      coalesce: {
        from: fromRef,
        numPartitions: (config.numPartitions as number) || 1,
      },
    }),
    flatten: () => {
      const separator = (config.separator as string) || "_";
      const explodeArrays = config.explodeArrays === true;
      return {
        name: node.data.ref,
        flatten: {
          from: fromRef,
          ...(separator !== "_" ? { separator } : {}),
          ...(explodeArrays ? { explodeArrays: true } : {}),
        },
      };
    },
    conditional: () => ({
      name: node.data.ref,
      conditional: {
        from: fromRef,
        outputColumn: (config.outputColumn as string) || "",
        branches: (config.branches as Array<{ condition: string; value: string }>) || [],
        ...((config.otherwise as string) ? { otherwise: config.otherwise } : {}),
      },
    }),
    split: () => ({
      name: node.data.ref,
      split: {
        from: fromRef,
        condition: (config.condition as string) || "",
        pass: (config.pass as string) || "",
        fail: (config.fail as string) || "",
      },
    }),
    rollup: () => ({
      name: node.data.ref,
      rollup: {
        from: fromRef,
        by: (config.by as string[]) || [],
        agg: (config.agg as string[]) || [],
      },
    }),
    cube: () => ({
      name: node.data.ref,
      cube: {
        from: fromRef,
        by: (config.by as string[]) || [],
        agg: (config.agg as string[]) || [],
      },
    }),
    scd2: () => ({
      name: node.data.ref,
      scd2: {
        current: allFromRefs[0] || "",
        incoming: allFromRefs[1] || "",
        keyColumns: (config.keyColumns as string[]) || [],
        trackColumns: (config.trackColumns as string[]) || [],
        startDateColumn: (config.startDateColumn as string) || "",
        endDateColumn: (config.endDateColumn as string) || "",
        currentFlagColumn: (config.currentFlagColumn as string) || "",
      },
    }),
    enrich: () => {
      const headers = (config.headers as Record<string, string>) || {};
      return {
        name: node.data.ref,
        enrich: {
          from: fromRef,
          url: (config.url as string) || "",
          method: (config.method as string) || "GET",
          keyColumn: (config.keyColumn as string) || "",
          responseColumn: (config.responseColumn as string) || "",
          ...(Object.keys(headers).length > 0 ? { headers } : {}),
          onError: (config.onError as string) || "null",
          timeout: (config.timeout as number) || 30000,
          maxRetries: (config.maxRetries as number) || 3,
        },
      };
    },
    schemaEnforce: () => ({
      name: node.data.ref,
      schemaEnforce: {
        from: fromRef,
        mode: (config.mode as string) || "strict",
        columns: (config.columns as Array<{ name: string; dataType: string; nullable: boolean; default?: string }>) || [],
      },
    }),
    assertion: () => ({
      name: node.data.ref,
      assertion: {
        from: fromRef,
        checks: (config.checks as Array<{ column: string; rule: string; description: string }>) || [],
        onFailure: (config.onFailure as string) || "fail",
      },
    }),
    custom: () => {
      const options = (config.options as Record<string, string>) || {};
      return {
        name: node.data.ref,
        custom: {
          from: fromRef,
          component: (config.component as string) || "",
          ...(Object.keys(options).length > 0 ? { options } : {}),
        },
      };
    },
  };

  const builder = TRANSFORM_MAP[type];
  return builder ? builder() : null;
}

/**
 * Generate Teckel YAML from nodes and edges.
 */
/**
 * Helper to add optional metadata fields to an input/output object.
 */
function addMetadataFields(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  config: Record<string, unknown>,
  fields: string[],
) {
  for (const field of fields) {
    const value = config[field];
    if (typeof value === "string" && value) {
      obj[field] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      obj[field] = value;
    } else if (value && typeof value === "object" && Object.keys(value as object).length > 0) {
      obj[field] = value;
    }
  }
}

export function generateYaml(
  nodes: TeckelNode[],
  edges: TeckelEdge[],
  pipelineName?: string,
  metadata?: PipelineMetadata,
): string {
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
      addMetadataFields(input, config, ["description", "tags", "meta", "owner"]);
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
      addMetadataFields(output, config, ["description", "tags", "meta", "freshness", "maturity"]);
      outputs.push(output);
    } else {
      const allFromRefs = getAllFromRefs(node.id, edges, nodeMap);
      const fromRef = allFromRefs[0];
      const transformation = buildTransformation(node, fromRef, allFromRefs);
      if (transformation) {
        transformations.push(transformation);
      }
    }
  }

  // Build pipeline metadata section
  let pipelineSection: TeckelPipelineSection | undefined;
  if (metadata || pipelineName) {
    const section: TeckelPipelineSection = {};
    if (pipelineName) section.name = pipelineName;
    if (metadata) {
      if (metadata.namespace) section.namespace = metadata.namespace;
      if (metadata.version) section.version = metadata.version;
      if (metadata.description) section.description = metadata.description;
      if (metadata.owner) section.owner = metadata.owner;
      if (metadata.tags.length > 0) section.tags = metadata.tags;
      if (Object.keys(metadata.meta).length > 0) section.meta = metadata.meta;
      if (metadata.schedule) section.schedule = metadata.schedule;
    }
    if (Object.keys(section).length > 0) {
      pipelineSection = section;
    }
  }

  const doc: TeckelPipelineDoc = {
    version: "2.0",
    ...(pipelineSection ? { pipeline: pipelineSection } : {}),
    input: inputs,
    ...(transformations.length > 0 ? { transformation: transformations } : {}),
    output: outputs,
  };

  return yaml.dump(doc, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    quotingType: "'",
    forceQuotes: false,
  });
}
