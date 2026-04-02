---
sidebar_position: 4
title: Execution
---

# Execution

Teckel Editor can submit pipelines directly to the [Teckel Engine](https://teckel.rafaelfernandez.dev/api/docs/intro) for execution via gRPC.

## Submitting a pipeline

Click the **Run** button in the topbar to submit the current pipeline. The editor:

1. Generates YAML from the current graph state
2. Collects pipeline variables and their values
3. Calls the `SubmitJob` gRPC method
4. Receives a `job_id` and initial status of `queued`

## Job lifecycle

Jobs progress through the following statuses:

| Status | Description |
|---|---|
| `queued` | Job accepted, waiting for execution |
| `running` | Job is actively executing |
| `completed` | Job finished successfully |
| `failed` | Job encountered an error |
| `cancelled` | Job was cancelled by the user |

## Polling for status

After submission, the editor polls for status updates using the `GetJob` RPC method. The job response includes:

- `id` — Job identifier
- `status` — Current status
- `error` — Error message (if failed)
- `created_at` — Timestamp when the job was queued
- `started_at` — Timestamp when execution began
- `completed_at` — Timestamp when the job finished
- `duration_ms` — Execution duration in milliseconds

The editor also supports `WaitForJob` for long-polling with a configurable timeout.

## Cancelling jobs

Running jobs can be cancelled by clicking the **Cancel** button. This calls the `CancelJob` RPC method, which transitions the job to `cancelled` status.

## Execution plan

Before running a pipeline, you can view the **execution plan** using the Explain feature. This calls `ExplainPipeline` and displays the plan that the engine will use, which is useful for understanding how the pipeline will be executed.

## Job history

The **Jobs** panel shows the history of submitted jobs with their status, timestamps, and duration. You can:

- View details of any past job
- Re-run a previous pipeline configuration
- Filter jobs by status
