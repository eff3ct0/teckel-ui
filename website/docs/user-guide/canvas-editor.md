---
sidebar_position: 1
title: Canvas Editor
---

# Canvas Editor

The canvas editor is the main interface for building Teckel pipelines visually. It consists of three panels: the **node palette** on the left, the **canvas** in the center, and the **configuration panel** on the right.

## Node palette

The left sidebar displays all available node types organized by category. Drag a node from the palette onto the canvas to add it to the pipeline.

### Node categories

| Category | Nodes | Count |
|---|---|---|
| **Sources** | `input` | 1 |
| **Sinks** | `output` | 1 |
| **Columns** | `addColumns`, `castColumns`, `dropColumns`, `fillNa`, `parse`, `renameColumns`, `replace`, `select` | 8 |
| **Filtering** | `conditional`, `distinct`, `dropNa`, `limit`, `offset`, `sample`, `split`, `tail`, `where` | 9 |
| **Aggregation & Sorting** | `crosstab`, `cube`, `describe`, `groupBy`, `groupingSets`, `orderBy`, `rollup`, `window` | 8 |
| **Joins & Sets** | `asOfJoin`, `except`, `intersect`, `join`, `lateralJoin`, `union` | 6 |
| **Reshaping** | `flatten`, `pivot`, `transpose`, `unpivot` | 4 |
| **Quality** | `assertion`, `schemaEnforce` | 2 |
| **Advanced** | `coalesce`, `custom`, `enrich`, `hint`, `merge`, `repartition`, `scd2`, `sql` | 8 |

**Total: 49 node types** (1 input + 1 output + 47 transformations)

## Canvas

The center area is a React Flow canvas where you build the pipeline graph:

- **Pan** — Click and drag on empty space
- **Zoom** — Scroll wheel or pinch
- **Select** — Click a node to select it and open its configuration
- **Multi-select** — Shift+click or drag a selection box
- **Move** — Drag selected nodes to reposition

## Connecting nodes

Edges represent data flow between nodes. To connect two nodes:

1. Hover over the **source handle** (bottom of a node) until the cursor changes
2. Click and drag to the **target handle** (top of another node)
3. Release to create the connection

Connections follow data flow direction: outputs of one node feed into inputs of the next. The YAML generator uses edges to determine `from` references and topological ordering.

## Configuration panel

Click a node to open its configuration in the right panel. Each node type has a specific form:

- **Input nodes** — Format (parquet, csv, json, etc.), path, read options, metadata (description, tags, owner)
- **Output nodes** — Format, write mode (overwrite, append, etc.), path, partition columns, metadata
- **Transformation nodes** — Type-specific configuration (columns, expressions, join conditions, etc.)

The **ref** field (node reference name) is auto-generated but editable. It determines the name used in `from` references in the generated YAML.

## Context menu

Right-click a node or the canvas to access:

- **Duplicate** — Clone a node with its configuration
- **Delete** — Remove selected nodes and their edges

## Auto-layout

Click the layout button in the toolbar to automatically arrange nodes using the **Dagre** graph layout algorithm. This produces a clean top-to-bottom layout following the data flow direction.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | Redo |
| `Delete` / `Backspace` | Delete selected nodes |
| `Escape` | Deselect all |
| `Ctrl+E` / `Cmd+E` | Toggle YAML editor |
