# Teckel UI - Claude Code Instructions

## Teckel Spec (Expressions & YAML Model)

The official Teckel specification lives in a separate repository: **eff3ct0/teckel-spec**

When working on anything related to Teckel expressions, transformations, YAML structure, or the pipeline data model, you MUST consult the spec before making changes:

- **Spec document**: `spec/v2.0/teckel-spec.md` in `eff3ct0/teckel-spec`
- **JSON Schema**: `spec/v2.0/teckel-schema.json` in `eff3ct0/teckel-spec`

Use the GitHub MCP tool (`mcp__github-eff3ct__get_file_contents`) to read these files directly from the repo. This ensures you always work with the latest version of the specification.

## Teckel API Server (Pipeline Execution)

The backend server lives in **eff3ct0/teckel-api** (crate `teckel-server`). Local path: `/home/p3rkins/git/eff3ct/teckel-api`

When working on API integration, use these endpoints:

- `POST /api/validate` — Sync. Body: `{yaml, variables}` → `{valid, error?}`
- `POST /api/explain` — Sync. Body: `{yaml, variables}` → `{plan}`
- `POST /api/jobs` — Async submit. Body: `{yaml, variables}` → `{job_id, status:"queued"}`
- `GET  /api/jobs/:id` — Poll status → `{id, status, error?, created_at, started_at?, completed_at?}`
- `DELETE /api/jobs/:id` — Cancel job
- `GET  /api/jobs` — List all jobs
- `GET  /api/health` — Health check

Job statuses: `queued` → `running` → `completed` | `failed` | `cancelled`

Default server: `http://localhost:8080`. Configurable via TECKEL_HOST/TECKEL_PORT.
