/**
 * Teckel server gRPC client.
 *
 * Uses ConnectRPC (gRPC-Web) to communicate with the teckel gRPC server.
 * Drop-in replacement for the previous REST client — same interface.
 */

import { createPromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { TeckelService } from "./gen/teckel_connect.js";

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
    ): Promise<ValidateResponse> {
      const res = await client.validatePipeline({
        yaml,
        variables: variables || {},
      });
      return {
        valid: res.valid,
        error: res.error || undefined,
      };
    },

    async explain(
      yaml: string,
      variables?: Record<string, string>,
    ): Promise<ExplainResponse> {
      const res = await client.explainPipeline({
        yaml,
        variables: variables || {},
      });
      return { plan: res.plan };
    },

    async submitJob(
      yaml: string,
      variables?: Record<string, string>,
    ): Promise<SubmitJobResponse> {
      const res = await client.submitJob({
        yaml,
        variables: variables || {},
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
    ): Promise<JobResponse> {
      const res = await client.waitForJob({
        jobId,
        timeoutSeconds: timeout,
      });
      return mapJobResponse(res);
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
