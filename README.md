# Teckel UI

Visual drag-and-drop pipeline editor for the [Teckel](https://github.com/eff3ct0/teckel) ETL framework. Design Spark data pipelines as node diagrams and export valid Teckel YAML — no code required.

## Quick Start

### Prerequisites

- **Node.js** 18.17 or later
- **pnpm** 9+ (`npm install -g pnpm`)

### Install and run

```bash
git clone https://github.com/eff3ct0/teckel-ui.git
cd teckel-ui
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production build

```bash
pnpm build
pnpm start
```

The app runs on port 3000 by default. Use `PORT=8081 pnpm start` to change it.

## Connecting to Teckel Backend

To use validation, dry-run, and graph features, run the Teckel API server:

```bash
# From the teckel project
spark-submit --class com.eff3ct.teckel.app.Main teckel-etl_2.13.jar --server 8080
```

The UI connects to `http://localhost:8080` by default. To change the API URL, open your browser's developer console and run:

```js
localStorage.setItem("teckel-api-url", "http://your-host:port");
```

Then reload the page.

## How to Use

### Building a pipeline

1. **Add nodes** — Drag node types from the left palette onto the canvas, or click them to add at a random position.
2. **Connect nodes** — Drag from a node's right handle (source) to another node's left handle (target) to define data flow.
3. **Configure nodes** — Click any node to open the config panel on the right. Fill in the type-specific form (format, path, columns, conditions, etc.).
4. **Set references** — Each node has a unique `ref` name used to identify it in the generated YAML. Edit it in the config panel.

### Node types

| Category | Types |
|----------|-------|
| **Sources** | Input |
| **Sinks** | Output |
| **Transforms** | Select, Where, Join, Group By, Order By, SQL, Window, Union, Intersect, Except, Add Columns, Drop Columns, Rename Columns, Cast Columns, Distinct, Limit, Sample, Pivot, Unpivot, Repartition, Coalesce |

### YAML preview

- Click the **YAML** button in the top bar (or press `Ctrl+E`) to toggle the YAML panel at the bottom.
- YAML is generated live as you edit the diagram.
- Toggle between **read-only** and **editable** mode with the button inside the panel.
- Click **Copy** to copy the YAML to clipboard.

### Import / Export

- **Import** — Click the upload icon in the top bar to load an existing `.yaml` file. The editor parses the Teckel YAML and recreates the node diagram.
- **Export** — Click the download icon to save the current pipeline as a `.yaml` file.

### Validation

The editor validates the pipeline in real time:

- Unique references across all nodes
- At least one Input and one Output node
- No disconnected transform/output nodes
- No cycles in the graph
- Join references point to existing nodes
- Required fields filled per Zod schemas

Validation status shows in the top bar: green (valid), amber (warnings), or red (errors). Click a node to see specific validation errors in the config panel.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Delete` / `Backspace` | Remove selected node |
| `Escape` | Deselect |
| `Ctrl+E` | Toggle YAML panel |

### Context menu

Right-click a node on the canvas to access:

- **Duplicate** — Creates a copy of the node
- **Delete** — Removes the node and its edges

### Auto-save

The editor automatically saves your work to the browser's `localStorage` every second. Your pipeline is restored when you reopen the page.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS v4, Radix UI |
| Diagram | React Flow v12 |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Code Editor | Monaco Editor |
| YAML | js-yaml |
| Icons | Lucide React |

## Project Structure

```
src/
├── app/                     Next.js layout and page
├── components/
│   ├── canvas/              React Flow canvas + context menu
│   ├── config/              Config panel + node-specific forms
│   ├── nodes/               Custom node renderer
│   ├── palette/             Left sidebar with draggable node types
│   ├── shared/              TagInput, KeyValueEditor, CodeInput, RefSelector
│   ├── topbar/              Header bar with actions and validation
│   └── yaml/                Monaco YAML preview panel
├── hooks/                   useYamlSync, useAutoSave, useKeyboardShortcuts, ...
├── lib/
│   ├── api/                 Teckel REST API client
│   ├── nodes/               Node registry, Zod schemas, pipeline validator
│   ├── utils/               cn(), nanoid()
│   └── yaml/                YAML generator + parser
├── stores/                  Zustand stores (pipeline, UI)
└── types/                   TypeScript type definitions
```

## Development

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript compiler checks
pnpm format       # Format code with Prettier
```

## License

See [LICENSE](LICENSE) for details.
