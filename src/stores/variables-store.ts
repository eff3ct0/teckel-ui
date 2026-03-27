"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SecretEntry {
  alias: string;
  key: string;
  scope?: string;
}

interface VariablesState {
  /** Variable substitution: ${VAR_NAME} in YAML resolved at parse time */
  variables: Record<string, string>;
  /** Secret declarations: {{secrets.alias}} resolved at runtime */
  secrets: SecretEntry[];

  setVariable: (key: string, value: string) => void;
  removeVariable: (key: string) => void;
  setVariables: (variables: Record<string, string>) => void;
  addSecret: (entry: SecretEntry) => void;
  updateSecret: (index: number, entry: SecretEntry) => void;
  removeSecret: (index: number) => void;
  setSecrets: (secrets: SecretEntry[]) => void;
}

export const useVariablesStore = create<VariablesState>()(
  persist(
    (set) => ({
      variables: {},
      secrets: [],

      setVariable: (key, value) =>
        set((s) => ({ variables: { ...s.variables, [key]: value } })),
      removeVariable: (key) =>
        set((s) => {
          const { [key]: _, ...rest } = s.variables;
          return { variables: rest };
        }),
      setVariables: (variables) => set({ variables }),

      addSecret: (entry) =>
        set((s) => ({ secrets: [...s.secrets, entry] })),
      updateSecret: (index, entry) =>
        set((s) => ({
          secrets: s.secrets.map((e, i) => (i === index ? entry : e)),
        })),
      removeSecret: (index) =>
        set((s) => ({
          secrets: s.secrets.filter((_, i) => i !== index),
        })),
      setSecrets: (secrets) => set({ secrets }),
    }),
    {
      name: "teckel-variables",
    },
  ),
);
