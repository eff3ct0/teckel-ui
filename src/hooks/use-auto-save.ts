"use client";

import { useEffect, useRef } from "react";
import { usePipelineStore } from "@/stores/pipeline-store";

const STORAGE_KEY = "teckel-ui-pipeline";
const SAVE_DEBOUNCE_MS = 1000;

export function useAutoSave() {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const name = usePipelineStore((s) => s.name);
  const id = usePipelineStore((s) => s.id);
  const isDirty = usePipelineStore((s) => s.isDirty);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Save to localStorage on changes
  useEffect(() => {
    if (!isDirty) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const data = { id, name, nodes, edges, savedAt: new Date().toISOString() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // localStorage full or unavailable
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [nodes, edges, name, id, isDirty]);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);
      if (data.nodes && data.edges) {
        usePipelineStore.setState({
          id: data.id || usePipelineStore.getState().id,
          name: data.name || "Untitled Pipeline",
          nodes: data.nodes,
          edges: data.edges,
          isDirty: false,
        });
      }
    } catch {
      // Invalid stored data
    }
  }, []);
}
