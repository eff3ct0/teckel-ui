import * as yaml from "js-yaml";
import type { TeckelNode, TeckelEdge, TeckelNodeType } from "@/types/pipeline";
import { NODE_REGISTRY } from "@/lib/nodes/registry";
import { nanoid } from "@/lib/utils/id";

interface ParsedPipeline {
  nodes: TeckelNode[];
  edges: TeckelEdge[];
}

interface RawInput {
  name: string;
  format?: string;
  path?: string;
  options?: Record<string, string>;
}

interface RawOutput {
  name: string;
  format?: string;
  mode?: string;
  path?: string;
  partitionBy?: string[];
  options?: Record<string, string>;
}

interface RawTransformation {
  name: string;
  [key: string]: unknown;
}

/**
 * Detect the teckel node type from a transformation's keys.
 */
function detectTransformType(transform: RawTransformation): TeckelNodeType | null {
  const keys = Object.keys(transform).filter((k) => k !== "name");
  const typeMap: Record<string, TeckelNodeType> = {
    select: "select",
    where: "where",
    join: "join",
    group: "groupBy",
    orderBy: "orderBy",
    sql: "sql",
    window: "window",
    union: "union",
    intersect: "intersect",
    except: "except",
    addColumns: "addColumns",
    dropColumns: "dropColumns",
    renameColumns: "renameColumns",
    castColumns: "castColumns",
    distinct: "distinct",
    limit: "limit",
    sample: "sample",
    pivot: "pivot",
    unpivot: "unpivot",
    repartition: "repartition",
    coalesce: "coalesce",
  };

  for (const key of keys) {
    if (typeMap[key]) return typeMap[key];
  }
  return null;
}

/**
 * Extract config from a raw transformation, mapping spec field names to internal model.
 */
function extractConfig(
  type: TeckelNodeType,
  transform: RawTransformation,
): Record<string, unknown> {
  const opKey = Object.keys(transform).find((k) => k !== "name")!;
  const op = transform[opKey] as Record<string, unknown>;

  switch (type) {
    case "select":
      return { columns: op.columns || [] };
    case "where":
      return { filter: (op.filter as string) || "" };
    case "join": {
      // Spec: right is array of JoinTarget {name, type, on}
      const right = op.right as Array<Record<string, unknown>> | undefined;
      const firstRight = Array.isArray(right) ? right[0] : undefined;
      return {
        joinType: firstRight?.type || "inner",
        on: Array.isArray(firstRight?.on) ? (firstRight.on as string[]).join(" AND ") : (firstRight?.on || ""),
      };
    }
    case "groupBy":
      return {
        by: op.by || [],
        agg: ((op.agg as string[]) || []),
      };
    case "orderBy": {
      const cols = op.columns as Array<string | Record<string, unknown>> || [];
      return {
        columns: cols.map((c) => {
          if (typeof c === "string") return { column: c, direction: "asc", nulls: "last" };
          return {
            column: (c.column as string) || "",
            direction: (c.direction as string) || "asc",
            nulls: (c.nulls as string) || "last",
          };
        }),
      };
    }
    case "sql":
      return { query: (op.query as string) || "", views: (op.views as string[]) || [] };
    case "window": {
      const orderBy = (op.orderBy as Array<string | Record<string, unknown>>) || [];
      const frame = (op.frame as Record<string, unknown>) || {};
      const functions = (op.functions as Array<Record<string, unknown>>) || [];
      return {
        partitionBy: op.partitionBy || [],
        orderBy: orderBy.map((c) => {
          if (typeof c === "string") return { column: c, direction: "asc", nulls: "last" };
          return {
            column: (c.column as string) || "",
            direction: (c.direction as string) || "asc",
            nulls: (c.nulls as string) || "last",
          };
        }),
        frame: {
          type: (frame.type as string) || "range",
          start: (frame.start as string) || "unbounded preceding",
          end: (frame.end as string) || "current row",
        },
        functions: functions.map((f) => ({
          expression: (f.expression as string) || "",
          alias: (f.alias as string) || "",
        })),
      };
    }
    case "union":
      return { sources: op.sources || [], all: op.all !== false };
    case "intersect":
      return { sources: op.sources || [], all: op.all === true };
    case "except":
      return { left: op.left || "", right: op.right || "", all: op.all === true };
    case "addColumns": {
      const cols = op.columns as Array<Record<string, unknown>> | undefined;
      return {
        columns: Array.isArray(cols)
          ? cols.map((c) => ({ name: (c.name as string) || "", expression: (c.expression as string) || "" }))
          : [],
      };
    }
    case "dropColumns":
      return { columns: op.columns || [] };
    case "renameColumns":
      return { mappings: op.mappings || {} };
    case "castColumns": {
      const cols = op.columns as Array<Record<string, unknown>> | undefined;
      return {
        columns: Array.isArray(cols)
          ? cols.map((c) => ({ name: (c.name as string) || "", targetType: (c.targetType as string) || "" }))
          : [],
      };
    }
    case "distinct":
      return { columns: op.columns || [] };
    case "limit":
      return { count: op.count || 100 };
    case "sample":
      return {
        fraction: op.fraction || 0.1,
        withReplacement: op.withReplacement === true,
        seed: op.seed ?? null,
      };
    case "pivot":
      return {
        groupBy: op.groupBy || [],
        pivotColumn: op.pivotColumn || "",
        values: op.values || [],
        agg: op.agg || [],
      };
    case "unpivot":
      return {
        ids: op.ids || [],
        values: op.values || [],
        variableColumn: op.variableColumn || "",
        valueColumn: op.valueColumn || "",
      };
    case "repartition":
      return { numPartitions: op.numPartitions || 1, columns: op.columns || [] };
    case "coalesce":
      return { numPartitions: op.numPartitions || 1 };
    default:
      return {};
  }
}

/**
 * Extract all source references from a transformation operation.
 */
function extractSourceRefs(
  type: TeckelNodeType,
  op: Record<string, unknown>,
): string[] {
  const refs: string[] = [];

  // Primary "from" — most transforms
  if (typeof op.from === "string") refs.push(op.from);

  // Join: spec uses "left" + "right" array of {name, type, on}
  if (type === "join") {
    if (typeof op.left === "string") refs.push(op.left);
    const right = op.right;
    if (Array.isArray(right)) {
      for (const r of right) {
        if (typeof r === "string") refs.push(r);
        else if (r && typeof r === "object") {
          const name = (r as Record<string, unknown>).name;
          if (typeof name === "string") refs.push(name);
        }
      }
    }
    // Legacy: "with" field
    if (typeof op.with === "string") refs.push(op.with);
    else if (Array.isArray(op.with)) {
      for (const r of op.with) {
        if (typeof r === "string") refs.push(r);
        else if (r && typeof r === "object" && typeof (r as Record<string, unknown>).ref === "string") {
          refs.push((r as Record<string, unknown>).ref as string);
        }
      }
    }
  }

  // SQL: "views" array
  if (type === "sql" && Array.isArray(op.views)) {
    for (const v of op.views) {
      if (typeof v === "string" && !refs.includes(v)) refs.push(v);
    }
  }

  // Union / Intersect: "sources" array
  if (type === "union" || type === "intersect") {
    if (Array.isArray(op.sources)) {
      for (const s of op.sources) {
        if (typeof s === "string" && !refs.includes(s)) refs.push(s);
      }
    }
  }

  // Except: "left" / "right"
  if (type === "except") {
    if (typeof op.left === "string" && !refs.includes(op.left)) refs.push(op.left);
    if (typeof op.right === "string" && !refs.includes(op.right)) refs.push(op.right);
  }

  return refs;
}

/**
 * Parse Teckel YAML into nodes and edges for the pipeline editor.
 */
export function parseYaml(yamlString: string): ParsedPipeline {
  const doc = yaml.load(yamlString) as {
    version?: string;
    input?: RawInput[];
    transformation?: RawTransformation[];
    output?: RawOutput[];
  };

  if (!doc) return { nodes: [], edges: [] };

  const nodes: TeckelNode[] = [];
  const edges: TeckelEdge[] = [];
  const refToId = new Map<string, string>();
  let yPos = 0;

  // Parse inputs
  for (const input of doc.input || []) {
    const id = nanoid();
    refToId.set(input.name, id);
    nodes.push({
      id,
      type: "teckelNode",
      position: { x: 50, y: yPos },
      data: {
        label: "Input",
        ref: input.name,
        teckelType: "input",
        config: {
          format: input.format || "parquet",
          path: input.path || "",
          options: input.options || {},
        },
        validationErrors: [],
      },
    });
    yPos += 120;
  }

  // Parse transformations
  let xPos = 350;
  yPos = 0;
  for (const transform of doc.transformation || []) {
    const type = detectTransformType(transform);
    if (!type) continue;

    const id = nanoid();
    refToId.set(transform.name, id);
    const def = NODE_REGISTRY[type];
    const config = extractConfig(type, transform);

    nodes.push({
      id,
      type: "teckelNode",
      position: { x: xPos, y: yPos },
      data: {
        label: def.label,
        ref: transform.name,
        teckelType: type,
        config,
        validationErrors: [],
      },
    });

    // Create edges from all referenced sources
    const opKey = Object.keys(transform).find((k) => k !== "name")!;
    const op = transform[opKey] as Record<string, unknown>;
    const sourceRefs = extractSourceRefs(type, op);
    for (const ref of sourceRefs) {
      if (refToId.has(ref)) {
        edges.push({
          id: nanoid(),
          source: refToId.get(ref)!,
          target: id,
        });
      }
    }

    yPos += 120;
    if (yPos > 400) {
      yPos = 0;
      xPos += 300;
    }
  }

  // Parse outputs
  xPos += 300;
  yPos = 0;
  for (const output of doc.output || []) {
    const id = nanoid();
    nodes.push({
      id,
      type: "teckelNode",
      position: { x: xPos, y: yPos },
      data: {
        label: "Output",
        ref: `output_${output.name}`,
        teckelType: "output",
        config: {
          format: output.format || "parquet",
          mode: output.mode || "overwrite",
          path: output.path || "",
          partitionBy: output.partitionBy || [],
          options: output.options || {},
        },
        validationErrors: [],
      },
    });

    // Create edge from the referenced node
    if (refToId.has(output.name)) {
      edges.push({
        id: nanoid(),
        source: refToId.get(output.name)!,
        target: id,
      });
    }

    yPos += 120;
  }

  return { nodes, edges };
}
