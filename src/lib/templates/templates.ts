import type { PipelineTemplate } from "./index";

export const csvToParquet: PipelineTemplate = {
  id: "csv-to-parquet",
  name: "CSV to Parquet",
  description: "Basic format conversion from CSV input to Parquet output.",
  nodeCount: 2,
  category: "Basic",
  yaml: `pipeline:
  name: csv-to-parquet
  version: "1.0"

input:
  - name: source_csv
    format: csv
    path: "/data/input.csv"

output:
  - name: source_csv
    format: parquet
    path: "/data/output.parquet"
`,
};

export const filterAndExport: PipelineTemplate = {
  id: "filter-and-export",
  name: "Filter & Export",
  description: "Read data, apply a filter, and write active records.",
  nodeCount: 3,
  category: "Basic",
  yaml: `pipeline:
  name: filter-and-export
  version: "1.0"

input:
  - name: raw_data
    format: csv
    path: "/data/raw.csv"

transformation:
  - name: filtered
    where:
      from: raw_data
      filter: "status = 'active'"

output:
  - name: filtered
    format: parquet
    path: "/data/active.parquet"
`,
};

export const joinAndAggregate: PipelineTemplate = {
  id: "join-and-aggregate",
  name: "Join & Aggregate",
  description: "Classic ETL pattern: join two sources, group, aggregate, and sort.",
  nodeCount: 6,
  category: "ETL",
  yaml: `pipeline:
  name: join-and-aggregate
  version: "1.0"

input:
  - name: orders
    format: parquet
    path: "/data/orders.parquet"
  - name: customers
    format: parquet
    path: "/data/customers.parquet"

transformation:
  - name: enriched
    join:
      left: orders
      right:
        - name: customers
          type: inner
          on: "customer_id"
  - name: summary
    groupBy:
      from: enriched
      by: ["region"]
      agg:
        - "sum(total_amount) as revenue"
        - "count(order_id) as order_count"
  - name: ranked
    orderBy:
      from: summary
      columns:
        - column: revenue
          direction: desc

output:
  - name: ranked
    format: parquet
    path: "/data/report.parquet"
`,
};

export const scdType2: PipelineTemplate = {
  id: "scd-type-2",
  name: "SCD Type 2",
  description: "Slowly changing dimension merge with tracked columns.",
  nodeCount: 4,
  category: "ETL",
  yaml: `pipeline:
  name: scd-type-2
  version: "1.0"

input:
  - name: current_dim
    format: parquet
    path: "/data/dim_customer.parquet"
  - name: incoming_updates
    format: csv
    path: "/data/updates.csv"

transformation:
  - name: merged
    scd2:
      current: current_dim
      incoming: incoming_updates
      keyColumns: ["customer_id"]
      trackColumns: ["name", "email", "address"]

output:
  - name: merged
    format: parquet
    path: "/data/dim_customer_updated.parquet"
`,
};

export const dataQuality: PipelineTemplate = {
  id: "data-quality-check",
  name: "Data Quality",
  description: "Validate data with assertions and enforce a strict schema.",
  nodeCount: 4,
  category: "Quality",
  yaml: `pipeline:
  name: data-quality-check
  version: "1.0"

input:
  - name: raw_data
    format: csv
    path: "/data/raw.csv"

transformation:
  - name: validated
    assertion:
      from: raw_data
      checks:
        - column: id
          rule: "IS NOT NULL"
          description: "ID must not be null"
        - column: amount
          rule: "> 0"
          description: "Amount must be positive"
        - column: status
          rule: "IN ('active', 'inactive')"
          description: "Status must be active or inactive"
      onFailure: fail
  - name: enforced
    schemaEnforce:
      from: validated
      mode: strict
      columns:
        - name: id
          dataType: integer
          nullable: false
        - name: amount
          dataType: double
          nullable: false
        - name: status
          dataType: string
          nullable: true

output:
  - name: enforced
    format: parquet
    path: "/data/clean.parquet"
`,
};

export const windowAnalytics: PipelineTemplate = {
  id: "window-analytics",
  name: "Window Analytics",
  description: "Ranking and running totals using window functions.",
  nodeCount: 4,
  category: "Analytics",
  yaml: `pipeline:
  name: window-analytics
  version: "1.0"

input:
  - name: transactions
    format: parquet
    path: "/data/transactions.parquet"

transformation:
  - name: ranked
    window:
      from: transactions
      partitionBy: ["customer_id"]
      orderBy:
        - column: created_at
          direction: desc
      functions:
        - expression: "row_number()"
          alias: txn_rank
        - expression: "sum(amount)"
          alias: running_total
  - name: selected
    select:
      from: ranked
      columns: ["customer_id", "amount", "created_at", "txn_rank", "running_total"]

output:
  - name: selected
    format: parquet
    path: "/data/analytics.parquet"
`,
};

export const multiSourceUnion: PipelineTemplate = {
  id: "multi-source-union",
  name: "Multi-source Union",
  description: "Combine multiple datasets and deduplicate.",
  nodeCount: 6,
  category: "ETL",
  yaml: `pipeline:
  name: multi-source-union
  version: "1.0"

input:
  - name: source_a
    format: csv
    path: "/data/source_a.csv"
  - name: source_b
    format: csv
    path: "/data/source_b.csv"
  - name: source_c
    format: csv
    path: "/data/source_c.csv"

transformation:
  - name: combined
    union:
      sources: [source_a, source_b, source_c]
  - name: deduped
    distinct:
      from: combined
      columns: []

output:
  - name: deduped
    format: parquet
    path: "/data/merged.parquet"
`,
};

export const splitAndRoute: PipelineTemplate = {
  id: "split-and-route",
  name: "Split & Route",
  description: "Conditional routing: split events by amount threshold.",
  nodeCount: 3,
  category: "Routing",
  yaml: `pipeline:
  name: split-and-route
  version: "1.0"

input:
  - name: events
    format: parquet
    path: "/data/events.parquet"

transformation:
  - name: routed
    split:
      from: events
      condition: "amount >= 1000"
      pass: high_value
      fail: low_value

output:
  - name: routed
    format: parquet
    path: "/data/routed.parquet"
`,
};
