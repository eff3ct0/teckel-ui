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
    group:
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

export const sqlAnalytics: PipelineTemplate = {
  id: "sql-analytics",
  name: "SQL Analytics",
  description: "Cross-table analytics using raw SQL with multiple input views.",
  nodeCount: 4,
  category: "Analytics",
  yaml: `pipeline:
  name: sql-analytics
  version: "1.0"
  description: Revenue report joining sales with product catalog

input:
  - name: sales
    format: parquet
    path: "/data/sales.parquet"
  - name: products
    format: parquet
    path: "/data/products.parquet"

transformation:
  - name: report
    sql:
      query: >
        SELECT
          p.category,
          COUNT(*) as total_sales,
          SUM(s.amount) as revenue,
          AVG(s.amount) as avg_order,
          MAX(s.created_at) as last_sale
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.status = 'completed'
        GROUP BY p.category
        ORDER BY revenue DESC
      views: [sales, products]

output:
  - name: report
    format: parquet
    path: "/data/sales_report.parquet"
`,
};

export const featureEngineering: PipelineTemplate = {
  id: "feature-engineering",
  name: "Feature Engineering",
  description: "Column operations pipeline: add, cast, rename, and drop columns.",
  nodeCount: 6,
  category: "ETL",
  yaml: `pipeline:
  name: feature-engineering
  version: "1.0"
  description: Prepare user features for ML training

input:
  - name: raw_users
    format: csv
    path: "/data/users.csv"

transformation:
  - name: with_features
    addColumns:
      from: raw_users
      columns:
        - name: full_name
          expression: "CONCAT(first_name, ' ', last_name)"
        - name: age
          expression: "EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))"
        - name: is_premium
          expression: "CASE WHEN total_spent > 1000 THEN true ELSE false END"
  - name: typed
    castColumns:
      from: with_features
      columns:
        - name: age
          targetType: integer
        - name: is_premium
          targetType: boolean
        - name: total_spent
          targetType: double
  - name: renamed
    renameColumns:
      from: typed
      mappings:
        total_spent: lifetime_value
        signup_date: registered_at
  - name: final
    dropColumns:
      from: renamed
      columns: [first_name, last_name, birth_date]

output:
  - name: final
    format: parquet
    path: "/data/user_features.parquet"
`,
};

export const pivotReport: PipelineTemplate = {
  id: "pivot-report",
  name: "Pivot Report",
  description: "Cross-tabulation of sales by region and quarter using pivot.",
  nodeCount: 4,
  category: "Analytics",
  yaml: `pipeline:
  name: pivot-report
  version: "1.0"
  description: Quarterly revenue breakdown by region

input:
  - name: sales
    format: csv
    path: "/data/quarterly_sales.csv"

transformation:
  - name: pivoted
    pivot:
      from: sales
      groupBy: [region, product_line]
      pivotColumn: quarter
      values: [Q1, Q2, Q3, Q4]
      agg: ["sum(revenue)"]
  - name: sorted
    orderBy:
      from: pivoted
      columns:
        - column: region
          direction: asc

output:
  - name: sorted
    format: parquet
    path: "/data/sales_pivot.parquet"
`,
};

export const apiEnrichment: PipelineTemplate = {
  id: "api-enrichment",
  name: "API Enrichment",
  description: "Enrich records with data from an external HTTP API.",
  nodeCount: 5,
  category: "ETL",
  yaml: `pipeline:
  name: api-enrichment
  version: "1.0"
  description: Geocode addresses via external API

input:
  - name: addresses
    format: csv
    path: "/data/addresses.csv"

transformation:
  - name: geocoded
    enrich:
      from: addresses
      url: "https://api.geocoding.example.com/v1/search"
      method: GET
      keyColumn: address
      responseColumn: geo_data
      headers:
        Authorization: "Bearer \${API_KEY}"
      onError: "null"
      timeout: 5000
      maxRetries: 2
  - name: validated
    assertion:
      from: geocoded
      checks:
        - column: geo_data
          rule: "IS NOT NULL"
          description: "Geocoding response must exist"
      onFailure: warn
  - name: selected
    select:
      from: validated
      columns: [id, address, city, state, geo_data]

output:
  - name: selected
    format: parquet
    path: "/data/enriched_addresses.parquet"
`,
};

export const conditionalTiering: PipelineTemplate = {
  id: "conditional-tiering",
  name: "Conditional Tiering",
  description: "Classify customers into loyalty tiers with multi-branch logic.",
  nodeCount: 4,
  category: "Routing",
  yaml: `pipeline:
  name: conditional-tiering
  version: "1.0"
  description: Assign loyalty tiers based on annual spending

input:
  - name: customers
    format: parquet
    path: "/data/customers.parquet"

transformation:
  - name: tiered
    conditional:
      from: customers
      outputColumn: tier
      branches:
        - condition: "annual_spend >= 10000"
          value: "'platinum'"
        - condition: "annual_spend >= 5000"
          value: "'gold'"
        - condition: "annual_spend >= 1000"
          value: "'silver'"
      otherwise: "'bronze'"
  - name: sorted
    orderBy:
      from: tiered
      columns:
        - column: annual_spend
          direction: desc

output:
  - name: sorted
    format: parquet
    path: "/data/customer_tiers.parquet"
`,
};

export const medallionArchitecture: PipelineTemplate = {
  id: "medallion-architecture",
  name: "Medallion Architecture",
  description: "Bronze \u2192 Silver \u2192 Gold data lake pattern with quality gates.",
  nodeCount: 8,
  category: "ETL",
  yaml: `pipeline:
  name: medallion-architecture
  version: "1.0"
  description: "Three-layer data lake: raw \u2192 cleaned \u2192 aggregated"

input:
  - name: raw_events
    format: json
    path: "/data/raw/events/*.json"

transformation:
  - name: bronze
    addColumns:
      from: raw_events
      columns:
        - name: ingested_at
          expression: "CURRENT_TIMESTAMP"
        - name: source_file
          expression: "'events'"
  - name: bronze_typed
    castColumns:
      from: bronze
      columns:
        - name: event_timestamp
          targetType: timestamp
        - name: user_id
          targetType: integer
        - name: amount
          targetType: double
  - name: silver_filtered
    where:
      from: bronze_typed
      filter: "event_type IS NOT NULL AND user_id > 0"
  - name: silver_clean
    distinct:
      from: silver_filtered
      columns: [event_id]
  - name: gold_summary
    group:
      from: silver_clean
      by: [user_id, event_type]
      agg:
        - "count(*) as event_count"
        - "sum(amount) as total_amount"
        - "min(event_timestamp) as first_event"
        - "max(event_timestamp) as last_event"
  - name: gold_ranked
    orderBy:
      from: gold_summary
      columns:
        - column: total_amount
          direction: desc

output:
  - name: gold_ranked
    format: parquet
    mode: overwrite
    path: "/data/gold/user_summary.parquet"
`,
};

export const dataSampling: PipelineTemplate = {
  id: "data-sampling",
  name: "Data Sampling",
  description: "Create a small dev/test dataset from production data.",
  nodeCount: 4,
  category: "Basic",
  yaml: `pipeline:
  name: data-sampling
  version: "1.0"
  description: Sample 10% of production data capped at 1000 rows

input:
  - name: production_data
    format: parquet
    path: "/data/production/users.parquet"

transformation:
  - name: sampled
    sample:
      from: production_data
      fraction: 0.1
      seed: 42
  - name: capped
    limit:
      from: sampled
      count: 1000

output:
  - name: capped
    format: csv
    mode: overwrite
    path: "/data/dev/users_sample.csv"
`,
};

export const customer360: PipelineTemplate = {
  id: "customer-360",
  name: "Customer 360",
  description: "Unified customer view joining orders, profiles, and interactions.",
  nodeCount: 10,
  category: "ETL",
  yaml: `pipeline:
  name: customer-360
  version: "1.0"
  description: Build a unified customer view with engagement scoring

input:
  - name: orders
    format: parquet
    path: "/data/orders.parquet"
  - name: profiles
    format: parquet
    path: "/data/profiles.parquet"
  - name: interactions
    format: csv
    path: "/data/interactions.csv"

transformation:
  - name: order_summary
    group:
      from: orders
      by: [customer_id]
      agg:
        - "count(*) as order_count"
        - "sum(total) as lifetime_value"
        - "avg(total) as avg_order_value"
        - "max(order_date) as last_order_date"
  - name: interaction_summary
    group:
      from: interactions
      by: [customer_id]
      agg:
        - "count(*) as interaction_count"
        - "max(interaction_date) as last_interaction"
  - name: with_orders
    join:
      left: profiles
      right:
        - name: order_summary
          type: left
          on: "customer_id"
  - name: with_interactions
    join:
      left: with_orders
      right:
        - name: interaction_summary
          type: left
          on: "customer_id"
  - name: enriched
    addColumns:
      from: with_interactions
      columns:
        - name: engagement_score
          expression: "COALESCE(order_count, 0) * 10 + COALESCE(interaction_count, 0)"
        - name: days_since_last_order
          expression: "DATEDIFF(CURRENT_DATE, last_order_date)"
  - name: ranked
    orderBy:
      from: enriched
      columns:
        - column: lifetime_value
          direction: desc
          nulls: last

output:
  - name: ranked
    format: parquet
    mode: overwrite
    path: "/data/customer_360.parquet"
`,
};
