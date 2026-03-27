import { z } from "zod";
import type { TeckelNodeType } from "@/types/pipeline";

export const inputSchema = z.object({
  format: z.enum(["csv", "json", "parquet", "delta", "orc", "avro", "text", "jdbc"]),
  path: z.string().min(1, "Path is required"),
  options: z.record(z.string()).default({}),
});

export const outputSchema = z.object({
  format: z.enum(["csv", "json", "parquet", "delta", "orc", "avro", "text", "jdbc"]),
  mode: z.enum(["overwrite", "append", "ignore", "error"]),
  path: z.string().min(1, "Path is required"),
  partitionBy: z.array(z.string()).default([]),
  options: z.record(z.string()).default({}),
});

export const selectSchema = z.object({
  columns: z.array(z.string()).min(1, "At least one column required"),
});

export const whereSchema = z.object({
  filter: z.string().min(1, "Filter is required"),
});

export const joinSchema = z.object({
  joinType: z.enum(["inner", "left", "right", "outer", "cross", "left_semi", "left_anti"]),
  on: z.string().min(1, "Join condition is required"),
});

export const groupBySchema = z.object({
  by: z.array(z.string()).min(1, "At least one column required"),
  agg: z.array(z.string()).default([]),
});

export const orderBySchema = z.object({
  columns: z.array(
    z.object({
      column: z.string().min(1),
      direction: z.enum(["asc", "desc"]).default("asc"),
      nulls: z.enum(["first", "last"]).default("last"),
    }),
  ),
});

export const sqlSchema = z.object({
  query: z.string().min(1, "SQL query is required"),
  views: z.array(z.string()).default([]),
});

export const windowSchema = z.object({
  partitionBy: z.array(z.string()).min(1, "At least one partition column required"),
  orderBy: z.array(
    z.object({
      column: z.string().min(1),
      direction: z.enum(["asc", "desc"]).default("asc"),
      nulls: z.enum(["first", "last"]).default("last"),
    }),
  ).default([]),
  frame: z.object({
    type: z.enum(["rows", "range"]).default("range"),
    start: z.string().default("unbounded preceding"),
    end: z.string().default("current row"),
  }).default({ type: "range", start: "unbounded preceding", end: "current row" }),
  functions: z.array(
    z.object({
      expression: z.string().min(1),
      alias: z.string().min(1),
    }),
  ).min(1, "At least one window function required"),
});

export const unionSchema = z.object({
  sources: z.array(z.string()),
  all: z.boolean().default(true),
});

export const intersectSchema = z.object({
  sources: z.array(z.string()),
  all: z.boolean().default(false),
});

export const exceptSchema = z.object({
  left: z.string().default(""),
  right: z.string().default(""),
  all: z.boolean().default(false),
});

export const addColumnsSchema = z.object({
  columns: z.array(
    z.object({
      name: z.string().min(1),
      expression: z.string().min(1),
    }),
  ),
});

export const dropColumnsSchema = z.object({
  columns: z.array(z.string()).min(1, "At least one column required"),
});

export const renameColumnsSchema = z.object({
  mappings: z.record(z.string()),
});

export const castColumnsSchema = z.object({
  columns: z.array(
    z.object({
      name: z.string().min(1),
      targetType: z.string().min(1),
    }),
  ),
});

export const distinctSchema = z.object({
  columns: z.array(z.string()).default([]),
});

export const limitSchema = z.object({
  count: z.number().int().min(0, "Count must be >= 0"),
});

export const sampleSchema = z.object({
  fraction: z.number().gt(0).lte(1),
  withReplacement: z.boolean().default(false),
  seed: z.number().nullable().default(null),
});

export const pivotSchema = z.object({
  groupBy: z.array(z.string()).min(1, "At least one group column required"),
  pivotColumn: z.string().min(1, "Pivot column is required"),
  values: z.array(z.string()).default([]),
  agg: z.array(z.string()).min(1, "At least one aggregation required"),
});

export const unpivotSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID column required"),
  values: z.array(z.string()).min(1, "At least one value column required"),
  variableColumn: z.string().min(1, "Variable column name is required"),
  valueColumn: z.string().min(1, "Value column name is required"),
});

export const repartitionSchema = z.object({
  numPartitions: z.number().int().positive(),
  columns: z.array(z.string()).default([]),
});

export const coalesceSchema = z.object({
  numPartitions: z.number().int().positive(),
});

export const flattenSchema = z.object({
  separator: z.string().default("_"),
  explodeArrays: z.boolean().default(false),
});

export const conditionalSchema = z.object({
  outputColumn: z.string().min(1, "Output column is required"),
  branches: z.array(
    z.object({
      condition: z.string().min(1),
      value: z.string().min(1),
    }),
  ).min(1, "At least one branch required"),
  otherwise: z.string().default(""),
});

export const splitSchema = z.object({
  condition: z.string().min(1, "Condition is required"),
  pass: z.string().min(1, "Pass ref is required"),
  fail: z.string().min(1, "Fail ref is required"),
});

export const rollupSchema = z.object({
  by: z.array(z.string()).min(1, "At least one column required"),
  agg: z.array(z.string()).min(1, "At least one aggregation required"),
});

export const cubeSchema = z.object({
  by: z.array(z.string()).min(1, "At least one column required"),
  agg: z.array(z.string()).min(1, "At least one aggregation required"),
});

export const scd2Schema = z.object({
  keyColumns: z.array(z.string()).min(1, "At least one key column required"),
  trackColumns: z.array(z.string()).min(1, "At least one track column required"),
  startDateColumn: z.string().min(1, "Start date column is required"),
  endDateColumn: z.string().min(1, "End date column is required"),
  currentFlagColumn: z.string().min(1, "Current flag column is required"),
});

export const enrichSchema = z.object({
  url: z.string().min(1, "URL is required"),
  method: z.string().default("GET"),
  keyColumn: z.string().min(1, "Key column is required"),
  responseColumn: z.string().min(1, "Response column is required"),
  headers: z.record(z.string()).default({}),
  onError: z.enum(["null", "fail", "skip"]).default("null"),
  timeout: z.number().int().default(30000),
  maxRetries: z.number().int().default(3),
});

export const schemaEnforceSchema = z.object({
  mode: z.enum(["strict", "evolve"]).default("strict"),
  columns: z.array(
    z.object({
      name: z.string().min(1),
      dataType: z.string().min(1),
      nullable: z.boolean().default(true),
      default: z.string().optional(),
    }),
  ).min(1, "At least one column required"),
});

export const assertionSchema = z.object({
  checks: z.array(
    z.object({
      column: z.string().default(""),
      rule: z.string().min(1),
      description: z.string().default(""),
    }),
  ).min(1, "At least one check required"),
  onFailure: z.enum(["fail", "warn", "drop"]).default("fail"),
});

export const customSchema = z.object({
  component: z.string().min(1, "Component identifier is required"),
  options: z.record(z.string()).default({}),
});

export const NODE_SCHEMAS: Record<TeckelNodeType, z.ZodType> = {
  input: inputSchema,
  output: outputSchema,
  select: selectSchema,
  where: whereSchema,
  join: joinSchema,
  groupBy: groupBySchema,
  orderBy: orderBySchema,
  sql: sqlSchema,
  window: windowSchema,
  union: unionSchema,
  intersect: intersectSchema,
  except: exceptSchema,
  addColumns: addColumnsSchema,
  dropColumns: dropColumnsSchema,
  renameColumns: renameColumnsSchema,
  castColumns: castColumnsSchema,
  distinct: distinctSchema,
  limit: limitSchema,
  sample: sampleSchema,
  pivot: pivotSchema,
  unpivot: unpivotSchema,
  repartition: repartitionSchema,
  coalesce: coalesceSchema,
  flatten: flattenSchema,
  conditional: conditionalSchema,
  split: splitSchema,
  rollup: rollupSchema,
  cube: cubeSchema,
  scd2: scd2Schema,
  enrich: enrichSchema,
  schemaEnforce: schemaEnforceSchema,
  assertion: assertionSchema,
  custom: customSchema,
};
