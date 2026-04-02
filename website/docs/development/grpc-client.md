---
sidebar_position: 3
title: gRPC Client
---

# gRPC Client

Teckel Editor uses [ConnectRPC](https://connectrpc.com/) for gRPC-Web communication with the Teckel Engine backend.

![gRPC integration](/img/diagrams/grpc-integration.svg)

## Proto definition

The gRPC service is defined in the proto file at:

```
../teckel-api/proto/teckel.proto
```

This defines the `teckel.v1.TeckelService` with all available RPC methods.

## Code generation

Generated TypeScript files are produced by Buf:

```bash
npx buf generate
```

This reads the proto definition and generates:

- `src/lib/api/gen/teckel_pb.ts` — Protobuf message types
- `src/lib/api/gen/teckel_connect.ts` — ConnectRPC service client

## Client wrapper

The generated client is wrapped in `src/lib/api/teckel-client.ts` for a cleaner interface. The `createTeckelClient(baseUrl)` factory function returns an object with all available methods:

```typescript
const client = createTeckelClient('http://localhost:50051');
```

### Available methods

#### `health()`

Health check. Returns `{status, version}`.

```typescript
const health = await client.health();
// { status: "serving", version: "1.0.0" }
```

#### `validate(yaml, variables?)`

Synchronous pipeline validation. Returns `{valid, error?}`.

```typescript
const result = await client.validate(yamlString, { INPUT_PATH: 's3://bucket' });
// { valid: true } or { valid: false, error: "..." }
```

#### `explain(yaml, variables?)`

Generate an execution plan. Returns `{plan}`.

```typescript
const result = await client.explain(yamlString, variables);
// { plan: "Step 1: Read parquet from s3://..." }
```

#### `submitJob(yaml, variables?)`

Submit a pipeline for asynchronous execution. Returns `{job_id, status}`.

```typescript
const result = await client.submitJob(yamlString, variables);
// { job_id: "abc123", status: "queued" }
```

#### `getJob(jobId)`

Poll the status of a submitted job. Returns the full `JobResponse`.

```typescript
const job = await client.getJob('abc123');
// { id, status, error?, created_at, started_at?, completed_at?, duration_ms? }
```

#### `waitJob(jobId, timeout?, signal?)`

Long-poll for job completion. Blocks until the job finishes or the timeout expires.

```typescript
const job = await client.waitJob('abc123', 30);
```

#### `cancelJob(jobId)`

Cancel a running job.

```typescript
await client.cancelJob('abc123');
```

#### `listJobs()`

List all submitted jobs.

```typescript
const { jobs } = await client.listJobs();
```

#### `inspectSource(format, path, options?)`

Inspect a data source to discover its schema (field names, types, row count).

```typescript
const schema = await client.inspectSource('parquet', 's3://bucket/data/');
// { fields: [{ name: "id", data_type: "Int64", nullable: false }, ...], row_count: 1000000 }
```

## Transport

The client uses `createGrpcWebTransport` from `@connectrpc/connect-web`:

```typescript
import { createPromiseClient } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { TeckelService } from './gen/teckel_connect';

const transport = createGrpcWebTransport({ baseUrl });
const client = createPromiseClient(TeckelService, transport);
```

This enables communication with the gRPC server from the browser using the gRPC-Web protocol.

## Type exports

The client module exports several TypeScript types:

| Type | Description |
|---|---|
| `TeckelClient` | Return type of `createTeckelClient` |
| `JobStatus` | `'queued' \| 'running' \| 'completed' \| 'failed' \| 'cancelled'` |
| `ValidateResponse` | `{ valid: boolean; error?: string }` |
| `ExplainResponse` | `{ plan: string }` |
| `SubmitJobResponse` | `{ job_id: string; status: string }` |
| `JobResponse` | Full job state with timestamps |
| `HealthResponse` | `{ status: string; version: string }` |
| `FieldInfo` | `{ name: string; data_type: string; nullable: boolean }` |
| `InspectSourceResponse` | `{ fields: FieldInfo[]; row_count: number }` |
