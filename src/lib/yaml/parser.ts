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
    order: "orderBy",
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
 * Extract config from a raw transformation.
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
      return { condition: op.filter || "" };
    case "join":
      return { ref: op.with || "", on: op.on || "", joinType: op.type || "inner" };
    case "groupBy":
      return {
        columns: op.by || [],
        agg: ((op.agg as string[]) || []).map((s) => {
          const match = s.match(/^(\w+)\((.+)\)$/);
          return match ? { function: match[1], column: match[2] } : { function: s, column: "" };
        }),
      };
    case "orderBy":
      return {
        columns: ((op.by as string[]) || []).map((col) => ({
          column: col,
          direction: (op.order as string)?.toLowerCase() === "desc" ? "desc" : "asc",
        })),
      };
    case "sql":
      return { query: op.query || "" };
    case "window":
      return { partitionBy: op.partitionBy || [], orderBy: op.orderBy || [] };
    case "union":
    case "intersect":
    case "except":
      return { refs: op.refs || [] };
    case "addColumns":
      return {
        columns: Object.entries((op.columns as Record<string, string>) || {}).map(
          ([name, expression]) => ({ name, expression }),
        ),
      };
    case "dropColumns":
      return { columns: op.columns || [] };
    case "renameColumns":
    case "castColumns":
      return { mapping: op.mapping || {} };
    case "distinct":
      return {};
    case "limit":
      return { count: op.count || 100 };
    case "sample":
      return { fraction: op.fraction || 0.1, seed: op.seed ?? null };
    case "pivot":
      return {
        pivotColumn: op.pivotColumn || "",
        values: op.values || [],
        agg: op.agg || {},
      };
    case "unpivot":
      return { idColumns: op.idColumns || [], valueColumns: op.valueColumns || [] };
    case "repartition":
    case "coalesce":
      return { numPartitions: op.numPartitions || 1 };
    default:
      return {};
  }
}

/**
 * Parse Teckel YAML into nodes and edges for the pipeline editor.
 */
export function parseYaml(yamlString: string): ParsedPipeline {
  const doc = yaml.load(yamlString) as {
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

    // Create edge from "from" reference
    const opKey = Object.keys(transform).find((k) => k !== "name")!;
    const op = transform[opKey] as Record<string, unknown>;
    const fromRef = op?.from as string | undefined;
    if (fromRef && refToId.has(fromRef)) {
      edges.push({
        id: nanoid(),
        source: refToId.get(fromRef)!,
        target: id,
      });
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
