"use client";

import { useState, useCallback, useRef } from "react";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useConnectionStore } from "@/stores/connection-store";
import { createTeckelClient, type JobResponse, type JobStatus } from "@/lib/api/teckel-client";

export interface JobState {
  jobId: string | null;
  status: JobStatus | null;
  error: string | null;
  loading: boolean;
  createdAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export function useJob() {
  const yaml = usePipelineStore((s) => s.yaml);
  const serverUrl = useConnectionStore((s) => s.serverUrl);

  const [job, setJob] = useState<JobState>({
    jobId: null,
    status: null,
    error: null,
    loading: false,
    createdAt: null,
    startedAt: null,
    completedAt: null,
  });

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (jobId: string) => {
      stopPolling();
      const client = createTeckelClient(serverUrl);

      pollingRef.current = setInterval(async () => {
        try {
          const resp: JobResponse = await client.getJob(jobId);
          setJob((prev) => ({
            ...prev,
            status: resp.status,
            error: resp.error || null,
            createdAt: resp.created_at,
            startedAt: resp.started_at || null,
            completedAt: resp.completed_at || null,
          }));

          if (resp.status === "completed" || resp.status === "failed" || resp.status === "cancelled") {
            stopPolling();
            setJob((prev) => ({ ...prev, loading: false }));
          }
        } catch {
          stopPolling();
          setJob((prev) => ({
            ...prev,
            loading: false,
            error: "Lost connection to server",
          }));
        }
      }, 1000);
    },
    [serverUrl, stopPolling],
  );

  const submitJob = useCallback(async () => {
    if (!yaml.trim()) return;

    stopPolling();
    setJob({
      jobId: null,
      status: null,
      error: null,
      loading: true,
      createdAt: null,
      startedAt: null,
      completedAt: null,
    });

    try {
      const client = createTeckelClient(serverUrl);
      const resp = await client.submitJob(yaml);
      setJob({
        jobId: resp.job_id,
        status: "queued",
        error: null,
        loading: true,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
      });
      startPolling(resp.job_id);
    } catch (e) {
      setJob({
        jobId: null,
        status: "failed",
        error: e instanceof Error ? e.message : "Unknown error",
        loading: false,
        createdAt: null,
        startedAt: null,
        completedAt: null,
      });
    }
  }, [yaml, serverUrl, stopPolling, startPolling]);

  const cancelJob = useCallback(async () => {
    if (!job.jobId) return;
    try {
      const client = createTeckelClient(serverUrl);
      await client.cancelJob(job.jobId);
    } catch {
      // best effort
    }
  }, [job.jobId, serverUrl]);

  const reset = useCallback(() => {
    stopPolling();
    setJob({
      jobId: null,
      status: null,
      error: null,
      loading: false,
      createdAt: null,
      startedAt: null,
      completedAt: null,
    });
  }, [stopPolling]);

  return { job, submitJob, cancelJob, reset };
}
