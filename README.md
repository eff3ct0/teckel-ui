# Teckel UI

Visual drag-and-drop pipeline editor for the [Teckel](https://github.com/eff3ct0/teckel-api) ETL framework. Design data pipelines as node diagrams, configure variables and secrets, validate against the server, and execute — all from the browser.

Built against the [Teckel Spec v3.0](https://github.com/eff3ct0/teckel-spec) with full YAML roundtrip fidelity.

## Quick Start

### Prerequisites

- **Node.js** 18.17 or later
- **pnpm** 9+ (`npm install -g pnpm`)
- **Teckel Server** (optional, for validation and execution) — see [Connecting to the Backend](#connecting-to-the-backend)

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

## Connecting to the Backend

Teckel UI connects to [teckel-server](https://github.com/eff3ct0/teckel-api) (Rust/axum) for validation, execution plans, and non-blocking pipeline execution.

### Start the server

```bash
# From the teckel-api repo
cargo run -p teckel-server
```

The server runs on `http://localhost:8080` by default. Configure with environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `TECKEL_HOST` | `0.0.0.0` | Bind address |
| `TECKEL_PORT` | `8080` | Listen port |
| `TECKEL_MAX_CONCURRENCY` | CPU count | Max concurrent pipeline executions |

### Connect from the UI

1. Click the **Settings** button (gear icon) in the top bar
2. Go to the **Connection** tab
3. Enter the server URL and click **Test**
4. A green indicator confirms the connection

### Server API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/validate` | Synchronous YAML validation |
| `POST` | `/api/explain` | Synchronous execution plan |
| `POST` | `/api/jobs` | Submit pipeline for async execution |
| `GET` | `/api/jobs/:id` | Poll job status |
| `DELETE` | `/api/jobs/:id` | Cancel a running/queued job |
| `GET` | `/api/jobs` | List all jobs |

Jobs follow the lifecycle: `queued` → `running` → `completed` | `failed` | `cancelled`.

## How to Use

### Building a pipeline

1. **Add nodes** — Drag node types from the left palette onto the canvas.
2. **Connect nodes** — Drag from a node's right handle to another node's left handle to define data flow.
3. **Configure nodes** — Click any node to open the config panel. Fill in the type-specific form.
4. **Set references** — Each node has a unique `ref` name (must match `^[a-zA-Z][a-zA-Z0-9_-]{0,127}$`).

### Node types (45 transformations)

| Category | Types |
|----------|-------|
| **Sources** | Input |
| **Sinks** | Output |
| **Columns** | Select, Add Columns, Drop Columns, Rename Columns, Cast Columns |
| **Filtering** | Where, Distinct, Limit, Sample, Conditional, Split |
| **Aggregation** | Group By, Order By, Window, Rollup, Cube |
| **Joins & Sets** | Join, Union, Intersect, Except |
| **Reshaping** | Pivot, Unpivot, Flatten |
| **Quality** | Schema Enforce, Assertion |
| **Advanced** | SQL, Repartition, Coalesce, SCD Type 2, Enrich, Custom |

All 45 transformation types from the [Teckel Spec v3.0](https://github.com/eff3ct0/teckel-spec) are supported.

### Variables and Secrets

Configure pipeline variables and secrets from **Settings > Variables**:

**Variables** — Key-value pairs substituted at parse time using `${VAR_NAME}` syntax (supports `${VAR:default}` for defaults). Variables are sent to the server on every validate/explain/execute call.

**Secrets** — Declared as alias/key/scope entries, referenced in YAML as `{{secrets.alias}}`. Resolved at runtime via the secrets provider or `TECKEL_SECRET__ALIAS` env var. Secret declarations are included in the generated YAML under the `secrets` section.

Both are persisted in the browser across sessions.

### Pipeline metadata

Click the **Settings** button and go to the **Pipeline** tab to configure:

- Name, namespace, version, description
- Owner, schedule (cron), tags, meta
- Generated in YAML as the `pipeline:` section

Input nodes support: description, owner, tags, meta.
Output nodes support: description, tags, meta, freshness (ISO 8601), maturity.

### Running a pipeline

1. Connect to the server (Settings > Connection)
2. Click **Run** in the top bar — submits the pipeline as an async job
3. The button shows status: **Queued** → **Cancel** (while running)
4. Result indicator appears: green checkmark (completed) or red error (failed)

Jobs are non-blocking — the server uses a bounded worker pool so you can submit multiple pipelines.

### YAML preview

- Click the **YAML** button in the top bar (or press `Ctrl+E`) to toggle the YAML panel.
- YAML is generated live as you edit, including `version: "3.0"`, pipeline metadata, secrets, and all spec sections.
- Toggle between **read-only** and **editable** mode.
- Click **Copy** to copy to clipboard.

### Import / Export

- **Import** — Click the upload icon to load an existing `.yaml` file. The editor parses Teckel YAML and recreates the node diagram, including metadata, secrets, and all top-level sections.
- **Export** — Click the download icon to save as `.yaml`.

Full roundtrip: `config`, `secrets`, `hooks`, `quality`, `templates`, `streamingInput`, `streamingOutput`, and `exposures` sections are preserved during import/export.

### Validation

The editor validates in real time:

- **Client-side**: AssetRef format, unique references, required fields (Zod), cycle detection, connectivity checks
- **Server-side** (when connected + auto-validate enabled): Full spec validation with variable resolution, debounced at 800ms

Validation status shows in the top bar: green (valid), amber (warnings), or red (errors).

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
| State | Zustand (with persistence) |
| Validation | Zod |
| YAML | js-yaml |
| Icons | Lucide React |
| Backend | [teckel-server](https://github.com/eff3ct0/teckel-api) (Rust, axum, DataFusion) |

## Project Structure

```
src/
├── app/                     Next.js layout and page
├── components/
│   ├── canvas/              React Flow canvas + context menu
│   ├── config/              Config panel, pipeline metadata, connection, variables
│   ├── nodes/               Custom node renderer
│   ├── palette/             Left sidebar with draggable node types
│   ├── shared/              TagInput, KeyValueEditor, CodeInput, RefSelector
│   ├── topbar/              Header bar with actions, validation, and job controls
│   └── yaml/                YAML preview panel
├── hooks/                   useYamlSync, useJob, useServerValidation, useAutoSave, ...
├── lib/
│   ├── api/                 Teckel server API client
│   ├── nodes/               Node registry, Zod schemas, pipeline validator
│   ├── utils/               cn(), nanoid()
│   └── yaml/                YAML generator + parser (spec v3.0 compliant)
├── stores/                  Zustand stores (pipeline, UI, connection, variables)
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
