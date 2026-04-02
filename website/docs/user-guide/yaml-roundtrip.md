---
sidebar_position: 2
title: YAML Round-Trip
---

# YAML Round-Trip

Teckel Editor supports **bidirectional conversion** between the visual graph and Teckel YAML. You can build a pipeline on the canvas and export it as YAML, or paste existing YAML and see it rendered as a graph.

## Visual to YAML

The YAML generator (`src/lib/yaml/generator.ts`) converts the current graph state into valid Teckel YAML:

1. **Topological sort** — Nodes are sorted using Kahn's algorithm so that inputs come first, then transformations in dependency order, then outputs.
2. **Reference resolution** — Each node's `from` field is populated from incoming edges. For multi-input nodes (join, union, etc.), all source references are collected.
3. **Transformation mapping** — Each node type is mapped to its corresponding YAML structure (e.g., a `groupBy` node becomes a `group:` block with `from`, `by`, and `agg` fields).
4. **Metadata** — Pipeline-level metadata (name, namespace, version, description, owner, tags, schedule) is included when set.

The generated YAML always uses `version: "3.0"` and follows the [Teckel Spec](https://teckel.rafaelfernandez.dev/docs/intro).

### Top-level sections preserved

The generator preserves all top-level YAML sections during round-trip:

- `pipeline` — Name, namespace, version, description, owner, tags, meta, schedule
- `config` — Pipeline configuration (including backend selection)
- `secrets` — Secret declarations
- `hooks` — Pre/post execution hooks
- `quality` — Quality rules
- `templates` — Reusable transformation templates
- `streaming` — Streaming input/output sections
- `exposures` — Data exposure declarations
- `input` — Input sources
- `transformation` — Transformation steps
- `output` — Output sinks

## YAML to visual

Paste or import YAML into the Monaco editor, and the parser converts it back into a visual graph:

1. **Input/output extraction** — `input` and `output` blocks become source and sink nodes.
2. **Transformation parsing** — Each transformation block is matched to a node type based on its operation key (e.g., `select:`, `join:`, `group:`).
3. **Edge creation** — `from` references are resolved to create edges between nodes.
4. **Auto-layout** — Nodes are arranged using the Dagre layout algorithm.

## Monaco editor

The YAML panel uses the **Monaco Editor** (the same editor that powers VS Code) with:

- YAML syntax highlighting
- Auto-indentation
- Error markers from validation
- Full-size editing mode (toggle with `Ctrl+E`)

## Export and import

- **Export** — Download the generated YAML as a `.yaml` file
- **Import** — Load a `.yaml` file into the editor; the graph is rebuilt from the parsed YAML

### Example output

```yaml
version: '3.0'
pipeline:
  name: my_pipeline
  description: Example pipeline
input:
  - name: raw_events
    format: parquet
    path: s3://bucket/events/
transformation:
  - name: filtered
    where:
      from: raw_events
      filter: status = 'active'
  - name: aggregated
    group:
      from: filtered
      by:
        - category
      agg:
        - count(*) as event_count
        - sum(amount) as total_amount
output:
  - name: aggregated
    format: parquet
    mode: overwrite
    path: s3://bucket/output/
```
