/**
 * Teckel server API client.
 *
 * Connects to teckel-server (eff3ct0/teckel-api) for pipeline
 * validation, explain, and async job execution.
 */

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

export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface JobResponse {
  id: string;
  status: JobStatus;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}

async function request<T>(baseUrl: string, path: string, options?: RequestInit): Promise<T> {
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const body = await res.json();

  if (!res.ok && body.error) {
    throw new Error(body.error);
  }

  return body as T;
}

export function createTeckelClient(baseUrl: string) {
  return {
    async health(): Promise<HealthResponse> {
      return request<HealthResponse>(baseUrl, "/api/health");
    },

    async validate(yaml: string, variables?: Record<string, string>): Promise<ValidateResponse> {
      return request<ValidateResponse>(baseUrl, "/api/validate", {
        method: "POST",
        body: JSON.stringify({ yaml, variables: variables || {} }),
      });
    },

    async explain(yaml: string, variables?: Record<string, string>): Promise<ExplainResponse> {
      return request<ExplainResponse>(baseUrl, "/api/explain", {
        method: "POST",
        body: JSON.stringify({ yaml, variables: variables || {} }),
      });
    },

    async submitJob(yaml: string, variables?: Record<string, string>): Promise<SubmitJobResponse> {
      return request<SubmitJobResponse>(baseUrl, "/api/jobs", {
        method: "POST",
        body: JSON.stringify({ yaml, variables: variables || {} }),
      });
    },

    async getJob(jobId: string): Promise<JobResponse> {
      return request<JobResponse>(baseUrl, `/api/jobs/${jobId}`);
    },

    async cancelJob(jobId: string): Promise<void> {
      await request(baseUrl, `/api/jobs/${jobId}`, { method: "DELETE" });
    },

    async listJobs(): Promise<{ jobs: JobResponse[] }> {
      return request<{ jobs: JobResponse[] }>(baseUrl, "/api/jobs");
    },
  };
}

export type TeckelClient = ReturnType<typeof createTeckelClient>;
