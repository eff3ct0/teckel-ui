"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Backend = "datafusion" | "polars";

interface ConnectionState {
  serverUrl: string;
  autoValidate: boolean;
  connected: boolean;
  lastHealthCheck: string | null;
  backend: Backend;

  setServerUrl: (url: string) => void;
  setAutoValidate: (enabled: boolean) => void;
  setConnected: (connected: boolean) => void;
  setLastHealthCheck: (time: string | null) => void;
  setBackend: (backend: Backend) => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      serverUrl: process.env.NEXT_PUBLIC_TECKEL_SERVER_URL ?? "http://localhost:50051",
      autoValidate: true,
      connected: false,
      lastHealthCheck: null,
      backend: "datafusion",

      setServerUrl: (url) => set({ serverUrl: url, connected: false, lastHealthCheck: null }),
      setAutoValidate: (enabled) => set({ autoValidate: enabled }),
      setConnected: (connected) => set({ connected }),
      setLastHealthCheck: (time) => set({ lastHealthCheck: time }),
      setBackend: (backend) => set({ backend }),
    }),
    {
      name: "teckel-connection",
      partialize: (state) => ({
        serverUrl: state.serverUrl,
        autoValidate: state.autoValidate,
        backend: state.backend,
      }),
    },
  ),
);
