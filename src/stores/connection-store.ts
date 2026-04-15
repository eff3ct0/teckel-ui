"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Backend = "datafusion" | "polars" | "spark";

interface ConnectionState {
  serverUrl: string;
  autoValidate: boolean;
  connected: boolean;
  lastHealthCheck: string | null;
  backend: Backend;
  sparkConnectUrl: string;

  setServerUrl: (url: string) => void;
  setAutoValidate: (enabled: boolean) => void;
  setConnected: (connected: boolean) => void;
  setLastHealthCheck: (time: string | null) => void;
  setBackend: (backend: Backend) => void;
  setSparkConnectUrl: (url: string) => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      serverUrl: process.env.NEXT_PUBLIC_TECKEL_SERVER_URL ?? "http://localhost:50051",
      autoValidate: true,
      connected: false,
      lastHealthCheck: null,
      backend: "datafusion",
      sparkConnectUrl: "",

      setServerUrl: (url) => set({ serverUrl: url, connected: false, lastHealthCheck: null }),
      setAutoValidate: (enabled) => set({ autoValidate: enabled }),
      setConnected: (connected) => set({ connected }),
      setLastHealthCheck: (time) => set({ lastHealthCheck: time }),
      setBackend: (backend) => set({ backend }),
      setSparkConnectUrl: (url) => set({ sparkConnectUrl: url }),
    }),
    {
      name: "teckel-connection",
      partialize: (state) => ({
        serverUrl: state.serverUrl,
        autoValidate: state.autoValidate,
        backend: state.backend,
        sparkConnectUrl: state.sparkConnectUrl,
      }),
    },
  ),
);

/**
 * Build the backend_options map to send with each request.
 * Only non-empty values are included; the server falls back to
 * its own defaults (env vars) when a key is missing.
 */
export function buildBackendOptions(state: ConnectionState): Record<string, string> {
  const opts: Record<string, string> = {};
  if (state.backend === "spark" && state.sparkConnectUrl.trim()) {
    opts.spark_connect_url = state.sparkConnectUrl.trim();
  }
  return opts;
}
