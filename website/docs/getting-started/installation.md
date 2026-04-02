---
sidebar_position: 1
title: Installation
---

# Installation

## Prerequisites

- **Node.js 22+** (LTS recommended)
- **pnpm** (package manager)

## Clone and install

```bash
git clone https://github.com/eff3ct0/teckel-ui.git
cd teckel-ui
pnpm install
```

## Development server

```bash
pnpm dev
```

This starts Next.js with Turbopack on `http://localhost:3000`. The editor loads immediately; the backend connection is optional for editing but required for validation and execution.

## Available scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |
| `pnpm format:check` | Check formatting |
| `pnpm type-check` | TypeScript type checking (`tsc --noEmit`) |

## Docker alternative

If you have Docker, you can run the editor alongside the Teckel Engine backend using Docker Compose:

```yaml
services:
  teckel-api:
    image: ghcr.io/eff3ct0/teckel-api:latest
    ports:
      - "50051:50051"

  teckel-ui:
    build: .
    ports:
      - "3000:3000"
    environment:
      - TECKEL_HOST=teckel-api
      - TECKEL_PORT=50051
    depends_on:
      - teckel-api
```

```bash
docker compose up
```

The editor will be available at `http://localhost:3000` with the backend connected automatically.
