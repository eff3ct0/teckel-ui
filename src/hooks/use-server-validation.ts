"use client";

import { useEffect, useRef, useState } from "react";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useConnectionStore } from "@/stores/connection-store";
import { createTeckelClient } from "@/lib/api/teckel-client";

export interface ServerValidation {
  valid: boolean | null;
  error: string | null;
  loading: boolean;
}

/**
 * Hook that auto-validates YAML against the server when connected.
 * Debounces requests to avoid flooding the server on every keystroke.
 */
export function useServerValidation(): ServerValidation {
  const yaml = usePipelineStore((s) => s.yaml);
  const serverUrl = useConnectionStore((s) => s.serverUrl);
  const autoValidate = useConnectionStore((s) => s.autoValidate);
  const connected = useConnectionStore((s) => s.connected);

  const [valid, setValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!autoValidate || !connected || !yaml.trim()) {
      setValid(null);
      setError(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const client = createTeckelClient(serverUrl);
        const result = await client.validate(yaml);
        setValid(result.valid);
        setError(result.error || null);
      } catch {
        setValid(null);
        setError(null);
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [yaml, serverUrl, autoValidate, connected]);

  return { valid, error, loading };
}
