"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConnectionState {
  serverUrl: string;
  autoValidate: boolean;
  connected: boolean;
  lastHealthCheck: string | null;

  setServerUrl: (url: string) => void;
  setAutoValidate: (enabled: boolean) => void;
  setConnected: (connected: boolean) => void;
  setLastHealthCheck: (time: string | null) => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      serverUrl: "http://localhost:8080",
      autoValidate: true,
      connected: false,
      lastHealthCheck: null,

      setServerUrl: (url) => set({ serverUrl: url, connected: false, lastHealthCheck: null }),
      setAutoValidate: (enabled) => set({ autoValidate: enabled }),
      setConnected: (connected) => set({ connected }),
      setLastHealthCheck: (time) => set({ lastHealthCheck: time }),
    }),
    {
      name: "teckel-connection",
      partialize: (state) => ({
        serverUrl: state.serverUrl,
        autoValidate: state.autoValidate,
      }),
    },
  ),
);
