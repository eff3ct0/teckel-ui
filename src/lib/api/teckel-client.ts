/**
 * Teckel server gRPC client.
 *
 * Uses ConnectRPC (gRPC-Web) to communicate with the teckel gRPC server.
 * Drop-in replacement for the previous REST client — same interface.
 */

import { createPromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { TeckelService } from "./gen/teckel_connect";

export type JobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface ValidateResponse {
  valid: boolean;
  error?: string;
}

export interface ExplainResponse {
  plan: string;
}

export interface SubmitJobResponse {
  job_id: string;
  status: string;
}

export interface JobResponse {
  id: string;
  status: JobStatus;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
}

export interface HealthResponse {
  status: string;
  version: string;
}

export interface FieldInfo {
  name: string;
  data_type: string;
  nullable: boolean;
}

export interface InspectSourceResponse {
  fields: FieldInfo[];
  row_count: number;
}

export function createTeckelClient(baseUrl: string) {
  const transport = createGrpcWebTransport({
    baseUrl,
  });

  const client = createPromiseClient(TeckelService, transport);

  return {
    async health(): Promise<HealthResponse> {
      const res = await client.health({});
      return { status: res.status, version: res.version };
    },

    async validate(
      yaml: string,
      variables?: Record<string, string>,
      backend?: string,
    ): Promise<ValidateResponse> {
      const res = await client.validatePipeline({
        yaml,
        variables: variables || {},
        backend: backend || "",
      });
      return {
        valid: res.valid,
        error: res.error || undefined,
      };
    },

    async explain(
      yaml: string,
      variables?: Record<string, string>,
      backend?: string,
    ): Promise<ExplainResponse> {
      const res = await client.explainPipeline({
        yaml,
        variables: variables || {},
        backend: backend || "",
      });
      return { plan: res.plan };
    },

    async submitJob(
      yaml: string,
      variables?: Record<string, string>,
      backend?: string,
    ): Promise<SubmitJobResponse> {
      const res = await client.submitJob({
        yaml,
        variables: variables || {},
        backend: backend || "",
      });
      return { job_id: res.jobId, status: res.status };
    },

    async getJob(jobId: string): Promise<JobResponse> {
      const res = await client.getJob({ jobId });
      return mapJobResponse(res);
    },

    async cancelJob(jobId: string): Promise<void> {
      await client.cancelJob({ jobId });
    },

    async waitJob(
      jobId: string,
      timeout: number = 30,
      signal?: AbortSignal,
    ): Promise<JobResponse> {
      const res = await client.waitForJob(
        { jobId, timeoutSeconds: timeout },
        signal ? { signal } : undefined,
      );
      return mapJobResponse(res);
    },

    async inspectSource(
      format: string,
      path: string,
      options?: Record<string, string>,
    ): Promise<InspectSourceResponse> {
      const res = await client.inspectSource({
        format,
        path,
        options: options || {},
      });
      return {
        fields: res.fields.map((f) => ({
          name: f.name,
          data_type: f.dataType,
          nullable: f.nullable,
        })),
        row_count: Number(res.rowCount),
      };
    },

    async listJobs(): Promise<{ jobs: JobResponse[] }> {
      const res = await client.listJobs({});
      return { jobs: res.jobs.map(mapJobResponse) };
    },
  };
}

function mapJobResponse(res: {
  id: string;
  status: string;
  error: string;
  createdAt: string;
  startedAt: string;
  completedAt: string;
  durationMs: bigint;
}): JobResponse {
  return {
    id: res.id,
    status: res.status as JobStatus,
    error: res.error || undefined,
    created_at: res.createdAt,
    started_at: res.startedAt || undefined,
    completed_at: res.completedAt || undefined,
    duration_ms:
      res.durationMs >= 0 ? Number(res.durationMs) : undefined,
  };
}

export type TeckelClient = ReturnType<typeof createTeckelClient>;
