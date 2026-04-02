---
sidebar_position: 2
title: Connecting to the Backend
---

# Connecting to the Backend

Teckel Editor communicates with the [Teckel Engine](https://teckel.rafaelfernandez.dev/api/docs/intro) (teckel-api) via **gRPC-Web** using ConnectRPC. The backend is required for:

- Pipeline validation (server-side)
- Execution plan explanation
- Job submission and monitoring
- Source inspection (schema discovery)

## Settings panel

Open the **Settings** panel in the editor to configure the backend connection. The connection URL points to the gRPC server endpoint.

**Default**: `http://localhost:50051`

## Health check indicator

The topbar displays a connection status indicator:

- **Green** — Connected and healthy
- **Red** — Disconnected or unreachable

The editor calls the `Health` RPC method to verify connectivity. You can still edit pipelines and export YAML without a backend connection; only validation and execution require it.

## Environment variables

You can configure the backend connection via environment variables:

| Variable | Default | Description |
|---|---|---|
| `TECKEL_HOST` | `localhost` | Backend server hostname |
| `TECKEL_PORT` | `50051` | Backend server port |

These are read at build time. For development, you can set them in a `.env.local` file:

```bash
TECKEL_HOST=localhost
TECKEL_PORT=50051
```

## gRPC service

The backend exposes the `teckel.v1.TeckelService` gRPC service with these methods:

| Method | Description |
|---|---|
| `Health` | Health check |
| `ValidatePipeline` | Synchronous pipeline validation |
| `ExplainPipeline` | Generate execution plan |
| `SubmitJob` | Submit pipeline for async execution |
| `GetJob` | Poll job status |
| `WaitForJob` | Long-poll for job completion |
| `CancelJob` | Cancel a running job |
| `ListJobs` | List all jobs |
| `InspectSource` | Inspect data source schema |

See [gRPC Client](../development/grpc-client.md) for implementation details.
