# Teckel UI - Claude Code Instructions

## Teckel Spec (Expressions & YAML Model)

The official Teckel specification lives in a separate repository: **eff3ct0/teckel-spec**

When working on anything related to Teckel expressions, transformations, YAML structure, or the pipeline data model, you MUST consult the spec before making changes:

- **Spec document**: `spec/v3.0/teckel-spec.md` in `eff3ct0/teckel-spec`
- **JSON Schema**: `spec/v3.0/teckel-schema.json` in `eff3ct0/teckel-spec`

Use the GitHub MCP tool (`mcp__github-eff3ct__get_file_contents`) to read these files directly from the repo. This ensures you always work with the latest version of the specification.

## Teckel gRPC Server (Pipeline Execution)

The backend server lives in **eff3ct0/teckel-api** (crate `teckel-worker`). Local path: `/home/p3rkins/git/eff3ct/teckel-api`

Communication uses **gRPC-Web** via ConnectRPC. Proto definition: `../teckel-api/proto/teckel.proto`

### gRPC Service: `teckel.v1.TeckelService`

- `Health` — Health check
- `ValidatePipeline` — Sync validation. `{yaml, variables}` → `{valid, error}`
- `ExplainPipeline` — Execution plan. `{yaml, variables}` → `{plan}`
- `SubmitJob` — Async submit. `{yaml, variables}` → `{job_id, status:"queued"}`
- `GetJob` — Poll status. `{job_id}` → `{id, status, error, created_at, started_at, completed_at, duration_ms}`
- `WaitForJob` — Long-poll. `{job_id, timeout_seconds}` → `JobResponse`
- `CancelJob` — Cancel. `{job_id}` → `{cancelled, status}`
- `ListJobs` — List all. `{}` → `{jobs[]}`

Job statuses: `queued` → `running` → `completed` | `failed` | `cancelled`

Default server: `http://localhost:50051`. Configurable via TECKEL_HOST/TECKEL_PORT.

### Codegen

```bash
npx buf generate   # Regenerates src/lib/api/gen/ from ../teckel-api/proto/teckel.proto
```

Client: `src/lib/api/teckel-client.ts` wraps the generated ConnectRPC client with the same interface used by hooks.
