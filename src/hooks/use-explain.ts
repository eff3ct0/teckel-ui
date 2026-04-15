"use client";

import { useState, useCallback } from "react";
import { createTeckelClient } from "@/lib/api/teckel-client";
import { buildBackendOptions, useConnectionStore } from "@/stores/connection-store";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useVariablesStore } from "@/stores/variables-store";
import type { ExplainResponse } from "@/lib/api/teckel-client";

export function useExplain() {
  const [plan, setPlan] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serverUrl = useConnectionStore((s) => s.serverUrl);
  const backend = useConnectionStore((s) => s.backend);
  const sparkConnectUrl = useConnectionStore((s) => s.sparkConnectUrl);
  const yaml = usePipelineStore((s) => s.yaml);
  const variables = useVariablesStore((s) => s.variables);

  const explain = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client = createTeckelClient(serverUrl);
      const options = buildBackendOptions(useConnectionStore.getState());
      const result = await client.explain(yaml, variables, backend, options);
      setPlan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Explain failed");
    } finally {
      setLoading(false);
    }
  }, [serverUrl, yaml, variables, backend, sparkConnectUrl]);

  const reset = useCallback(() => {
    setPlan(null);
    setError(null);
  }, []);

  return { plan, loading, error, explain, reset };
}
