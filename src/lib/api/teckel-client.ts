const DEFAULT_BASE_URL = "http://localhost:8080";

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("teckel-api-url") || DEFAULT_BASE_URL;
  }
  return DEFAULT_BASE_URL;
}

export interface HealthResponse {
  status: string;
  version: string;
}

export interface ValidateResponse {
  valid: boolean;
  errors: string[];
}

export interface DryRunResponse {
  status: string;
  plan: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "text/plain",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json();
}

export const teckelApi = {
  health: () => request<HealthResponse>("/api/health"),

  validate: (yaml: string) =>
    request<ValidateResponse>("/api/pipelines/validate", {
      method: "POST",
      body: yaml,
    }),

  dryRun: (yaml: string) =>
    request<DryRunResponse>("/api/pipelines/dry-run", {
      method: "POST",
      body: yaml,
    }),

  graph: (yaml: string, format: "mermaid" | "dot" | "ascii" = "mermaid") =>
    request<string>(`/api/pipelines/graph?format=${format}`, {
      method: "POST",
      body: yaml,
    }),

  setBaseUrl: (url: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("teckel-api-url", url);
    }
  },
};
