# Teckel UI — Product Requirements Document

> Visual pipeline builder and monitoring console for the [Teckel](https://github.com/eff3ct0/teckel) ETL framework.

---

## 1. Vision

Teckel UI is a **drag-and-drop visual editor** that lets data engineers design Spark ETL pipelines as connected node diagrams. Each node represents a Teckel asset (input, transformation, output), and the connections between them define the data flow. The editor produces valid Teckel YAML that can be executed directly by the Teckel CLI or API.

The interface follows the **Vercel / shadcn** design language: minimal, monochrome zinc palette, sharp typography, subtle borders, and micro-interactions that feel precise and intentional.

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 15 (App Router) | RSC, streaming, layouts, API routes |
| **Language** | TypeScript 5.x (strict) | Type safety across the entire stack |
| **UI Library** | React 19 | Concurrent features, `use()`, Server Components |
| **Styling** | Tailwind CSS v4 | Utility-first, native CSS variables, `@theme` |
| **Components** | shadcn/ui (Radix primitives) | Accessible, composable, unstyled base |
| **Diagram Engine** | React Flow v12 | Node-based editor, handles, edges, minimap, controls |
| **State** | Zustand | Lightweight, no boilerplate, middleware support |
| **Forms** | React Hook Form + Zod | Performant forms with schema validation |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) | YAML preview/edit with syntax highlighting |
| **DnD Sidebar** | `@dnd-kit/core` | Drag from palette → drop onto canvas |
| **Icons** | Lucide React | Consistent, tree-shakeable icon set |
| **Animations** | Framer Motion | Layout animations, panel transitions |
| **Testing** | Vitest + Testing Library + Playwright | Unit, component, and E2E |
| **Linting** | ESLint + Prettier + `eslint-config-next` | Consistent code style |
| **Package Manager** | pnpm | Fast, disk-efficient, strict |

---

## 3. Design System

### 3.1 Color Palette (Tailwind Zinc)

```
--background:    #09090b   (zinc-950)
--surface:       #18181b   (zinc-900)
--surface-alt:   #27272a   (zinc-800)
--border:        #3f3f46   (zinc-700)
--muted:         #52525b   (zinc-600)
--text-secondary:#a1a1aa   (zinc-400)
--text-primary:  #fafafa   (zinc-50)
--accent:        #3b82f6   (blue-500)
--accent-hover:  #2563eb   (blue-600)
--success:       #22c55e   (green-500)
--warning:       #f59e0b   (amber-500)
--error:         #ef4444   (red-500)
```

Light mode inverts the scale (zinc-50 background, zinc-950 text). The accent blue is used sparingly for interactive elements: selected nodes, active edges, CTA buttons.

### 3.2 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Headings | Inter | 20-32px | 600 |
| Body | Inter | 14px | 400 |
| Code / YAML | JetBrains Mono | 13px | 400 |
| Node labels | Inter | 13px | 500 |
| Badges | Inter | 11px | 500 |

### 3.3 Component Tokens

| Token | Value |
|-------|-------|
| Border radius (cards) | `rounded-xl` (12px) |
| Border radius (buttons) | `rounded-lg` (8px) |
| Border radius (inputs) | `rounded-md` (6px) |
| Shadow (panels) | `shadow-xl shadow-black/20` |
| Shadow (dropdowns) | `shadow-lg shadow-black/15` |
| Transition | `transition-all duration-150 ease-out` |
| Focus ring | `ring-2 ring-blue-500/40 ring-offset-2 ring-offset-zinc-950` |

### 3.4 Node Design

Each node on the canvas is a card with:

```
┌─────────────────────────────┐
│  [icon]  Node Label    [⋯]  │  ← header (colored left border by type)
│─────────────────────────────│
│  format: parquet             │  ← summary (2-3 key fields)
│  path: /data/events          │
│─────────────────────────────│
│  ● input    ○ output         │  ← handles (React Flow)
└─────────────────────────────┘
```

**Node type colors** (left border accent):

| Type | Color | Icon |
|------|-------|------|
| Input | `blue-500` | `DatabaseIcon` |
| Output | `green-500` | `DownloadIcon` |
| Select | `violet-500` | `ColumnsIcon` |
| Where | `amber-500` | `FilterIcon` |
| Join | `cyan-500` | `MergeIcon` |
| GroupBy | `pink-500` | `LayersIcon` |
| OrderBy | `orange-500` | `ArrowUpDownIcon` |
| SQL | `emerald-500` | `CodeIcon` |
| Window | `indigo-500` | `TableIcon` |
| Union/Intersect/Except | `teal-500` | `CopyIcon` |
| AddColumns | `lime-500` | `PlusCircleIcon` |
| DropColumns | `red-400` | `MinusCircleIcon` |
| RenameColumns | `sky-500` | `PencilIcon` |
| CastColumns | `fuchsia-500` | `WandIcon` |
| Distinct | `rose-500` | `FingerprintIcon` |
| Limit | `yellow-500` | `HashIcon` |
| Sample | `slate-400` | `DiceIcon` |
| Pivot/Unpivot | `purple-500` | `RotateIcon` |
| Repartition/Coalesce | `zinc-400` | `GridIcon` |

---

## 4. Application Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  ● Teckel UI          Pipeline: my-etl ▾     [▶ Run] [💾 Save] [⋯] │  ← Top Bar
├────────┬─────────────────────────────────────────────┬───────────────┤
│        │                                             │               │
│  Node  │                                             │  Config Panel │
│ Palette│            Canvas (React Flow)              │  (right side) │
│        │                                             │               │
│ ┌────┐ │     ┌───────┐       ┌───────┐              │  Node: Where  │
│ │ In │ │     │ Input │──────▶│ Where │──────▶...    │  ──────────── │
│ ├────┤ │     └───────┘       └───────┘              │  condition:   │
│ │ Out│ │                                             │  [           ]│
│ ├────┤ │                                             │               │
│ │Where│ │                                             │  [Apply]      │
│ ├────┤ │                                             │               │
│ │Join │ │                                             │               │
│ │ ...│ │                                             │               │
│        │                                             │               │
├────────┼─────────────────────────────────────────────┴───────────────┤
│        │  YAML Preview (Monaco Editor, read-only live sync)          │
│        │  ```yaml                                                    │
│        │  assets:                                                    │
│        │    - ref: events_input ...                                  │
│        │  ```                                                        │
└────────┴─────────────────────────────────────────────────────────────┘
```

### 4.1 Regions

| Region | Behavior |
|--------|----------|
| **Top Bar** | Pipeline name (editable), action buttons (Run, Save, Export YAML, Import YAML), dark/light toggle |
| **Node Palette** (left, 200px) | Categorized list of draggable node types. Drag a node type onto the canvas to create an instance. Collapsible. |
| **Canvas** (center, flex) | React Flow diagram area. Zoom, pan, minimap, selection, multi-select, copy/paste, undo/redo. Grid background with dot pattern. |
| **Config Panel** (right, 360px) | Opens when a node is selected. Shows a form specific to the node type. Closes when clicking empty canvas. Slides in with `framer-motion`. |
| **YAML Preview** (bottom, 240px) | Live-generated YAML from the current diagram. Read-only by default, toggle to editable (bi-directional sync). Collapsible. |

---

## 5. Core Features

### 5.1 Drag & Drop Pipeline Building

**Flow:**
1. User drags a node type (e.g., "Input") from the left palette onto the canvas
2. A new node instance appears at the drop position with default values
3. User connects nodes by dragging from an output handle (●) to an input handle (○)
4. Connections represent data flow (asset references in Teckel YAML)

**Implementation:**
- `@dnd-kit/core` for palette → canvas drag
- React Flow's built-in connection system for node → node edges
- Custom `onDrop` handler creates a new React Flow node at drop coordinates
- Each node stores its Teckel config in `node.data`

### 5.2 Node Configuration Panel

**Flow:**
1. User clicks a node on the canvas
2. The right panel slides open with a form specific to that node type
3. User edits fields (validated with Zod schemas)
4. Changes reflect immediately on the node summary and YAML preview
5. User clicks "Apply" or changes auto-save on blur

**Forms by node type:**

| Node Type | Config Fields |
|-----------|---------------|
| **Input** | `ref` (string), `format` (select: csv/json/parquet/delta/orc), `path` (string), `options` (key-value pairs) |
| **Output** | `ref` (string), `format` (select), `mode` (select: overwrite/append/ignore/error), `path` (string), `partition_by` (string[]), `options` (kv) |
| **Select** | `columns` (string[], tag input) |
| **Where** | `condition` (SQL expression, code input) |
| **Join** | `ref` (select from existing assets), `on` (SQL expression), `join_type` (select: inner/left/right/full/cross/left_semi/left_anti) |
| **GroupBy** | `columns` (string[]), `agg` (array of {column, function}) |
| **OrderBy** | `columns` (array of {column, order: asc/desc}) |
| **SQL** | `query` (multiline code editor) |
| **Window** | `partition_by` (string[]), `order_by` (string[]), `functions` (array of {name, column, alias, frame?}) |
| **Union/Intersect/Except** | `ref` (select), `all` (boolean toggle) |
| **AddColumns** | `columns` (array of {name, expression}) |
| **DropColumns** | `columns` (string[], tag input) |
| **RenameColumns** | `columns` (array of {from, to}) |
| **CastColumns** | `columns` (array of {column, to_type}) |
| **Distinct** | `columns` (string[], optional) |
| **Limit** | `rows` (number) |
| **Sample** | `fraction` (number 0-1), `seed` (number, optional), `with_replacement` (boolean) |
| **Repartition** | `num_partitions` (number), `columns` (string[], optional) |
| **Coalesce** | `num_partitions` (number) |
| **Pivot** | `group_by` (string[]), `pivot_column` (string), `values` (string[], optional), `agg` (array) |
| **Unpivot** | `ids` (string[]), `values` (string[]), `variable_column` (string), `value_column` (string) |

### 5.3 Live YAML Generation

The bottom panel shows the Teckel YAML generated in real-time from the diagram:

- **Unidirectional (default):** Diagram → YAML (read-only Monaco editor)
- **Bidirectional (toggle):** User can edit YAML directly, and the diagram updates to reflect changes
- **Validation:** Invalid YAML shows inline errors; invalid references highlight nodes in red

**YAML generation logic:**
1. Topological sort of React Flow nodes/edges
2. Map each node to its Teckel YAML representation
3. Resolve edge connections to `ref` fields
4. Serialize with proper indentation (2 spaces)

### 5.4 YAML Import

Users can import an existing Teckel YAML file:

1. Click "Import YAML" in the top bar (or drag-drop a `.yaml` file onto the canvas)
2. Parser reads the YAML and creates React Flow nodes + edges
3. Auto-layout algorithm (dagre or elk) positions nodes in a readable DAG layout

### 5.5 Pipeline Execution (Future)

> Depends on Teckel REST API (#48)

- **Run button** sends the generated YAML to the Teckel API
- **Live status** updates node borders: running (blue pulse), success (green), error (red)
- **Logs panel** streams execution output below the YAML preview

### 5.6 Undo / Redo

- Full undo/redo stack for all canvas operations (add, move, delete, connect, configure)
- `Ctrl+Z` / `Ctrl+Shift+Z` keyboard shortcuts
- Zustand middleware with history tracking

### 5.7 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Save pipeline |
| `Ctrl+E` | Export YAML |
| `Ctrl+I` | Import YAML |
| `Delete` / `Backspace` | Delete selected nodes/edges |
| `Ctrl+A` | Select all |
| `Ctrl+C` / `Ctrl+V` | Copy / paste nodes |
| `Ctrl+D` | Duplicate selected |
| `Space` (hold) | Pan mode |
| `Escape` | Deselect / close panel |

---

## 6. Data Model

### 6.1 React Flow Node

```typescript
interface TeckelNode extends Node {
  type: TeckelNodeType;
  data: {
    label: string;
    ref: string;             // asset ref name
    config: NodeConfig;      // type-specific config
    validationErrors: string[];
  };
}

type TeckelNodeType =
  | 'input' | 'output'
  | 'select' | 'where' | 'join' | 'groupBy' | 'orderBy'
  | 'distinct' | 'limit' | 'sample'
  | 'sql' | 'window'
  | 'union' | 'intersect' | 'except'
  | 'addColumns' | 'dropColumns' | 'renameColumns' | 'castColumns'
  | 'pivot' | 'unpivot'
  | 'repartition' | 'coalesce';
```

### 6.2 Pipeline State (Zustand Store)

```typescript
interface PipelineStore {
  // State
  id: string;
  name: string;
  nodes: TeckelNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  yaml: string;
  isDirty: boolean;
  history: HistoryEntry[];
  historyIndex: number;

  // Actions
  addNode: (type: TeckelNodeType, position: XYPosition) => void;
  removeNode: (id: string) => void;
  updateNodeConfig: (id: string, config: Partial<NodeConfig>) => void;
  addEdge: (connection: Connection) => void;
  removeEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  generateYaml: () => string;
  importYaml: (yaml: string) => void;
  undo: () => void;
  redo: () => void;
  save: () => Promise<void>;
}
```

### 6.3 Persistence

| Storage | Use Case |
|---------|----------|
| **localStorage** | Auto-save current pipeline (crash recovery) |
| **File export** | Download `.yaml` file |
| **File import** | Upload `.yaml` file |
| **REST API** (future) | Save/load pipelines to backend, execute |

---

## 7. Directory Structure

```
teckel-ui/
├── public/
│   ├── favicon.ico
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (theme provider, fonts)
│   │   ├── page.tsx                # Main editor page
│   │   └── globals.css             # Tailwind v4 @theme + base styles
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components (button, input, select, sheet, etc.)
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx          # React Flow wrapper
│   │   │   ├── CanvasControls.tsx  # Zoom, minimap, fit view
│   │   │   └── Background.tsx      # Dot grid background
│   │   ├── nodes/
│   │   │   ├── BaseNode.tsx        # Shared node shell (border, header, handles)
│   │   │   ├── InputNode.tsx       # Input-specific rendering
│   │   │   ├── OutputNode.tsx
│   │   │   ├── TransformNode.tsx   # Generic transform node
│   │   │   └── index.ts            # nodeTypes registry for React Flow
│   │   ├── edges/
│   │   │   └── DataFlowEdge.tsx    # Custom animated edge
│   │   ├── palette/
│   │   │   ├── NodePalette.tsx     # Left sidebar with draggable items
│   │   │   └── PaletteItem.tsx     # Single draggable node type
│   │   ├── config/
│   │   │   ├── ConfigPanel.tsx     # Right sidebar container
│   │   │   ├── InputConfig.tsx     # Input node form
│   │   │   ├── OutputConfig.tsx    # Output node form
│   │   │   ├── WhereConfig.tsx     # Where node form
│   │   │   ├── JoinConfig.tsx      # Join node form
│   │   │   ├── GroupByConfig.tsx
│   │   │   ├── SqlConfig.tsx
│   │   │   ├── WindowConfig.tsx
│   │   │   └── ...                 # One per node type
│   │   ├── yaml/
│   │   │   ├── YamlPreview.tsx     # Bottom panel with Monaco
│   │   │   └── YamlImport.tsx      # Import dialog
│   │   ├── topbar/
│   │   │   ├── TopBar.tsx          # Pipeline name, actions
│   │   │   └── ThemeToggle.tsx     # Dark/light switch
│   │   └── shared/
│   │       ├── KeyValueEditor.tsx  # Reusable key-value pair editor
│   │       ├── TagInput.tsx        # Multi-value tag input
│   │       ├── CodeInput.tsx       # Inline code/SQL input
│   │       └── ColumnArrayEditor.tsx
│   ├── stores/
│   │   ├── pipeline.ts            # Zustand pipeline store
│   │   └── ui.ts                  # UI state (panel visibility, theme)
│   ├── lib/
│   │   ├── yaml/
│   │   │   ├── generator.ts       # Nodes/edges → YAML string
│   │   │   ├── parser.ts          # YAML string → nodes/edges
│   │   │   └── validator.ts       # YAML validation with error messages
│   │   ├── layout/
│   │   │   └── dagre.ts           # Auto-layout algorithm for imported YAML
│   │   ├── nodes/
│   │   │   ├── registry.ts        # Node type metadata (icon, color, default config)
│   │   │   ├── schemas.ts         # Zod schemas per node type
│   │   │   └── defaults.ts        # Default config values per node type
│   │   └── utils.ts               # Shared utilities
│   ├── hooks/
│   │   ├── useAutoSave.ts         # localStorage auto-save
│   │   ├── useDragDrop.ts         # Palette → canvas drop handler
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useYamlSync.ts         # Bidirectional YAML ↔ diagram sync
│   └── types/
│       ├── nodes.ts               # TeckelNode, NodeConfig types
│       ├── pipeline.ts            # Pipeline, Edge types
│       └── yaml.ts                # YAML AST types
├── tests/
│   ├── unit/
│   │   ├── generator.test.ts      # YAML generation
│   │   ├── parser.test.ts         # YAML parsing
│   │   └── validator.test.ts      # Validation rules
│   ├── components/
│   │   ├── NodePalette.test.tsx
│   │   ├── ConfigPanel.test.tsx
│   │   └── Canvas.test.tsx
│   └── e2e/
│       ├── drag-drop.spec.ts      # Drag node from palette to canvas
│       ├── connect-nodes.spec.ts  # Connect two nodes via handles
│       ├── config-panel.spec.ts   # Open panel, edit config, verify YAML
│       └── import-export.spec.ts  # Import YAML → diagram → export YAML roundtrip
├── .eslintrc.json
├── .prettierrc
├── components.json                # shadcn/ui config
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## 8. Validation Rules

### 8.1 Structural Validation (Real-time)

| Rule | Severity | Description |
|------|----------|-------------|
| Unique refs | Error | No two nodes can have the same `ref` name |
| Connected graph | Warning | All nodes should be reachable from at least one input |
| Input required | Error | Pipeline must have at least one Input node |
| Output required | Warning | Pipeline should have at least one Output node |
| Dangling edges | Error | Edges must connect to existing nodes |
| Join ref exists | Error | Join's `ref` field must reference an existing asset |
| Union/Intersect ref exists | Error | Set operation's `ref` must reference an existing asset |
| Required fields | Error | Format, path (for I/O), condition (for Where), etc. |
| Cycle detection | Error | DAG must be acyclic |

### 8.2 Visual Feedback

- **Error nodes**: Red border + error icon in header
- **Warning nodes**: Amber border + warning icon
- **Valid nodes**: Default border (zinc)
- **Error tooltip**: Hover over error icon shows validation message
- **Edge errors**: Dashed red line for invalid connections

---

## 9. YAML Generation Rules

### 9.1 Mapping: Diagram → YAML

```
React Flow Graph                    Teckel YAML
─────────────────                   ───────────
Input node A ──────┐
                   ├──▶ Select B    assets:
Input node C ──────┘                  - ref: A
                   │                    source:
                   ▼                      type: input
              Where D ──▶ Output E        format: csv
                                          path: /data/a.csv

                                      - ref: B
                                        source:
                                          ref: A         # ← from edge
                                        transformations:
                                          - type: select
                                            columns: [...]

                                      - ref: D
                                        source:
                                          ref: B         # ← from edge
                                        transformations:
                                          - type: where
                                            condition: "..."

                                      - ref: E
                                        source:
                                          ref: D         # ← from edge
                                          type: output
                                          format: parquet
                                          path: /data/output
```

### 9.2 Transformation Chain Collapsing

When multiple transform nodes are connected linearly (A → Select → Where → OrderBy → Output), collapse them into a single asset with a `transformations` array:

```yaml
assets:
  - ref: result
    source:
      ref: input_data
    transformations:
      - type: select
        columns: [id, name]
      - type: where
        condition: "age > 18"
      - type: order_by
        columns:
          - column: name
            order: asc
```

---

## 10. Milestones

### M0 — Foundation (Week 1-2)

- [ ] Next.js 15 project scaffold with Tailwind v4 + shadcn/ui
- [ ] React Flow canvas with zoom, pan, minimap
- [ ] Base node component with type-colored borders
- [ ] Node palette (left sidebar) with all node types
- [ ] Drag from palette → drop on canvas creates node
- [ ] Edge connections between nodes
- [ ] Dark/light theme toggle

### M1 — Configuration (Week 3-4)

- [ ] Config panel (right sidebar) opens on node click
- [ ] Config forms for: Input, Output, Select, Where, Join, GroupBy, OrderBy
- [ ] Zod validation on all forms
- [ ] Node summary updates when config changes
- [ ] Delete nodes and edges (keyboard + context menu)
- [ ] Undo / Redo

### M2 — YAML (Week 5-6)

- [ ] YAML generator: diagram → valid Teckel YAML
- [ ] Monaco editor bottom panel with live YAML preview
- [ ] Transformation chain collapsing
- [ ] YAML export (download file)
- [ ] YAML import (upload file → auto-layout diagram)
- [ ] Bidirectional YAML ↔ diagram sync (toggle)

### M3 — Full Node Coverage (Week 7-8)

- [ ] Config forms for remaining nodes: SQL, Window, Union/Intersect/Except, AddColumns, DropColumns, RenameColumns, CastColumns, Distinct, Limit
- [ ] Config forms for new nodes: Sample, Pivot, Unpivot, Repartition, Coalesce
- [ ] Structural validation with visual error feedback
- [ ] Cycle detection
- [ ] Copy/paste nodes
- [ ] Keyboard shortcuts

### M4 — Polish (Week 9-10)

- [ ] Auto-save to localStorage
- [ ] Pipeline management (new, rename, duplicate)
- [ ] Context menu (right-click) on canvas and nodes
- [ ] Minimap styling
- [ ] Responsive layout (collapsible panels)
- [ ] Animations (panel slide-in, node appear, edge draw)
- [ ] E2E tests with Playwright
- [ ] Performance optimization (virtualized node rendering)

### M5 — Execution Integration (Future)

- [ ] Connect to Teckel REST API (#48)
- [ ] Run pipeline from UI
- [ ] Live execution status on nodes
- [ ] Log streaming panel
- [ ] Pipeline history and versioning

---

## 11. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Initial load** | < 2s (Lighthouse Performance > 90) |
| **Canvas with 100 nodes** | 60fps pan/zoom |
| **Canvas with 500 nodes** | 30fps pan/zoom (virtualized) |
| **YAML generation** | < 50ms for 100 nodes |
| **Accessibility** | WCAG 2.1 AA (keyboard navigation, screen reader labels) |
| **Browser support** | Chrome 120+, Firefox 120+, Safari 17+, Edge 120+ |
| **Bundle size** | < 500KB initial JS (gzipped) |
| **Offline** | Full editor functionality without network |

---

## 12. Risk & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| React Flow performance with large graphs | Laggy UX | Virtualization, node grouping, lazy rendering |
| Bidirectional YAML sync complexity | Bugs, data loss | Make bidi optional; default to diagram → YAML only |
| Monaco Editor bundle size (~2MB) | Slow load | Dynamic import, load only on panel open |
| Teckel YAML spec changes | Breaking UI | Abstract YAML generation behind schema-driven config |
| Node type explosion (20+ types) | Config panel maintenance | Schema-driven form generation from Zod schemas |

---

## 13. Open Questions

1. **Multi-pipeline tabs?** Should the editor support multiple pipelines open simultaneously as tabs?
2. **Collaboration?** Real-time multi-user editing (WebSocket/CRDT) — future scope or M5?
3. **Template library?** Pre-built pipeline templates (e.g., "CSV to Parquet", "SCD2 Merge")?
4. **Schema inference?** If connected to a running Spark instance, infer column names/types for autocomplete?
5. **Version control?** Built-in pipeline versioning, or rely on git via YAML export?
