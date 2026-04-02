---
sidebar_position: 1
title: Introduction
---

# Teckel Editor (teckel-ui)

**Teckel Editor** is a visual pipeline editor for [Teckel](https://teckel.rafaelfernandez.dev/docs/intro). It provides a drag-and-drop canvas where you build data pipelines by connecting nodes, then exports valid Teckel YAML for execution by the [Teckel Engine](https://teckel.rafaelfernandez.dev/api/docs/intro).

![Architecture](/img/diagrams/architecture.svg)

## Key features

- **Drag-and-drop canvas** — Build pipelines visually with React Flow. Nodes represent inputs, outputs, and transformations; edges represent data flow.
- **49 node types** — 1 input source, 1 output sink, and 47 transformation types covering column operations, filtering, aggregation, joins, reshaping, quality checks, and advanced operations.
- **YAML round-trip** — Bidirectional conversion between the visual graph and Teckel YAML (`version: "3.0"`). Edit in the canvas or in the Monaco YAML editor; changes sync both ways.
- **Live validation** — Two-tier validation: instant client-side checks (Zod schemas, cycle detection, AssetRef format) plus debounced server-side validation via gRPC.
- **Job execution** — Submit pipelines to the Teckel Engine, monitor job status (queued, running, completed, failed, cancelled), and cancel running jobs.
- **Variables and secrets** — Define pipeline variables (`${VAR_NAME}`) and secrets (`{{secrets.alias}}`) that are passed to the server on validation and execution.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| UI library | [React 19](https://react.dev/) |
| Canvas | [React Flow v12](https://reactflow.dev/) (`@xyflow/react`) |
| State management | [Zustand 5](https://zustand.docs.pmnd.rs/) (5 stores) |
| gRPC client | [ConnectRPC](https://connectrpc.com/) (gRPC-Web) |
| YAML editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| Form validation | [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/) |
| UI primitives | [Radix UI](https://www.radix-ui.com/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Graph layout | [Dagre](https://github.com/dagrejs/dagre) |

## Next steps

- [Installation](./getting-started/installation.md) — Set up the development environment.
- [Connecting to the backend](./getting-started/connecting-backend.md) — Configure the gRPC connection to teckel-api.
- [Canvas editor](./user-guide/canvas-editor.md) — Learn the visual editor interface.
