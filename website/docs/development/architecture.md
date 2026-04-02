---
sidebar_position: 1
title: Architecture
---

# Architecture

Teckel Editor is a Next.js application that provides a visual pipeline editor backed by gRPC communication with the Teckel Engine.

## Tech stack

| Component | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.x |
| UI library | React | 19.x |
| Canvas | React Flow (`@xyflow/react`) | 12.x |
| State management | Zustand | 5.x |
| gRPC client | ConnectRPC (`@connectrpc/connect` + `@connectrpc/connect-web`) | 1.7.x |
| YAML editor | Monaco Editor (`@monaco-editor/react`) | 4.x |
| YAML processing | js-yaml | 4.x |
| Form validation | Zod + React Hook Form | 3.x / 7.x |
| UI primitives | Radix UI | various |
| Styling | Tailwind CSS | 4.x |
| Graph layout | Dagre | 0.8.x |
| Drag and drop | dnd-kit (`@dnd-kit/core`) | 6.x |
| Icons | Lucide React | latest |
| Animations | Framer Motion | 12.x |

## State management (Zustand)

The application uses **5 Zustand stores** to manage state:

### `pipeline-store.ts`

The primary store. Manages the pipeline graph (nodes, edges), metadata, undo/redo history, and YAML state.

Key state:
- `nodes: TeckelNode[]` — All nodes in the pipeline graph
- `edges: TeckelEdge[]` — All connections between nodes
- `name: string` — Pipeline name
- `metadata: PipelineMetadata` — Pipeline-level metadata (namespace, version, description, owner, tags, meta, schedule)
- `extraSections: PipelineExtraSections` — Raw YAML sections preserved during round-trip (config, secrets, hooks, quality, templates, streaming, exposures)
- `history / future` — Undo/redo stacks (up to 50 entries)

Key actions:
- `addNode(type, position)` — Create a new node from the registry
- `removeNodes(nodeIds)` — Delete nodes and their edges
- `addEdge(connection)` — Connect two nodes
- `updateNodeConfig(nodeId, config)` — Update a node's configuration
- `undo() / redo()` — Navigate history
- `setNodeValidationErrors(errorMap)` — Apply validation results to nodes

### `ui-store.ts`

UI state: active panel, YAML editor visibility, settings dialog, etc.

### `connection-store.ts`

Backend connection state: URL, health status, client instance.

### `variables-store.ts`

Pipeline variables: key-value pairs passed to the server.

### `theme-store.ts`

Theme preferences: light/dark mode.

## Directory structure

```
src/
  app/                    # Next.js App Router pages
  components/
    canvas/               # React Flow canvas and toolbar
    config/               # Node configuration panel
    edges/                # Custom edge components
    explain/              # Execution plan viewer
    jobs/                 # Job history and status
    nodes/                # Custom node components
    palette/              # Node palette sidebar
    shared/               # Shared/common components
    templates/            # Template management
    topbar/               # Top navigation bar
    ui/                   # Radix UI component wrappers
    yaml/                 # YAML editor panel
    pipeline-editor.tsx   # Main editor layout (combines all panels)
  lib/
    api/
      gen/                # Generated ConnectRPC client code
      teckel-client.ts    # Client wrapper
    nodes/
      registry.ts         # Node type definitions (49 types)
    yaml/
      generator.ts        # Visual graph -> YAML conversion
  stores/                 # Zustand stores
  types/                  # TypeScript type definitions
```
