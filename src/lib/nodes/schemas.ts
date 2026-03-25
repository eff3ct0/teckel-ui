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
  condition: z.string().min(1, "Condition is required"),
});

export const joinSchema = z.object({
  ref: z.string().min(1, "Join reference is required"),
  on: z.string().min(1, "Join condition is required"),
  joinType: z.enum(["inner", "left", "right", "full", "cross", "semi", "anti"]),
});

export const groupBySchema = z.object({
  columns: z.array(z.string()).min(1, "At least one column required"),
  agg: z.array(
    z.object({
      column: z.string().min(1),
      function: z.string().min(1),
    }),
  ),
});

export const orderBySchema = z.object({
  columns: z.array(
    z.object({
      column: z.string().min(1),
      direction: z.enum(["asc", "desc"]).default("asc"),
    }),
  ),
});

export const sqlSchema = z.object({
  query: z.string().min(1, "SQL query is required"),
});

export const windowSchema = z.object({
  partitionBy: z.array(z.string()).default([]),
  orderBy: z.array(z.string()).default([]),
  frame: z.record(z.unknown()).default({}),
});

export const unionSchema = z.object({
  refs: z.array(z.string()),
});

export const intersectSchema = z.object({
  refs: z.array(z.string()),
});

export const exceptSchema = z.object({
  refs: z.array(z.string()),
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
  mapping: z.record(z.string()),
});

export const castColumnsSchema = z.object({
  mapping: z.record(z.string()),
});

export const distinctSchema = z.object({});

export const limitSchema = z.object({
  count: z.number().int().positive("Count must be positive"),
});

export const sampleSchema = z.object({
  fraction: z.number().min(0).max(1),
  seed: z.number().nullable().default(null),
});

export const pivotSchema = z.object({
  pivotColumn: z.string().min(1, "Pivot column is required"),
  values: z.array(z.string()),
  agg: z.record(z.string()),
});

export const unpivotSchema = z.object({
  idColumns: z.array(z.string()),
  valueColumns: z.array(z.string()),
});

export const repartitionSchema = z.object({
  numPartitions: z.number().int().positive(),
});

export const coalesceSchema = z.object({
  numPartitions: z.number().int().positive(),
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
};
