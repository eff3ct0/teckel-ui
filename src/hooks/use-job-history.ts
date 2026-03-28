"use client";

import { useState, useEffect, useCallback } from "react";
import { createTeckelClient } from "@/lib/api/teckel-client";
import { useConnectionStore } from "@/stores/connection-store";
import type { JobResponse } from "@/lib/api/teckel-client";

export function useJobHistory(enabled: boolean = false) {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serverUrl = useConnectionStore((s) => s.serverUrl);
  const connected = useConnectionStore((s) => s.connected);

  const refresh = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const client = createTeckelClient(serverUrl);
      const result = await client.listJobs();
      setJobs(result.jobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [serverUrl, connected]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  return { jobs, loading, error, refresh };
}
