"use client";

import { useState, useCallback } from "react";
import { createTeckelClient } from "@/lib/api/teckel-client";
import { useConnectionStore } from "@/stores/connection-store";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useVariablesStore } from "@/stores/variables-store";
import type { ExplainResponse } from "@/lib/api/teckel-client";

export function useExplain() {
  const [plan, setPlan] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serverUrl = useConnectionStore((s) => s.serverUrl);
  const yaml = usePipelineStore((s) => s.yaml);
  const variables = useVariablesStore((s) => s.variables);

  const explain = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client = createTeckelClient(serverUrl);
      const result = await client.explain(yaml, variables);
      setPlan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Explain failed");
    } finally {
      setLoading(false);
    }
  }, [serverUrl, yaml, variables]);

  const reset = useCallback(() => {
    setPlan(null);
    setError(null);
  }, []);

  return { plan, loading, error, explain, reset };
}
