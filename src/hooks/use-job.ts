"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useConnectionStore } from "@/stores/connection-store";
import { useVariablesStore } from "@/stores/variables-store";
import { createTeckelClient, type JobStatus } from "@/lib/api/teckel-client";

export interface JobState {
  jobId: string | null;
  status: JobStatus | null;
  error: string | null;
  loading: boolean;
  createdAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  elapsedMs: number;
}

const INITIAL_STATE: JobState = {
  jobId: null,
  status: null,
  error: null,
  loading: false,
  createdAt: null,
  startedAt: null,
  completedAt: null,
  durationMs: null,
  elapsedMs: 0,
};

function isTerminal(status: JobStatus): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}

export function useJob() {
  const yaml = usePipelineStore((s) => s.yaml);
  const serverUrl = useConnectionStore((s) => s.serverUrl);
  const variables = useVariablesStore((s) => s.variables);

  const [job, setJob] = useState<JobState>(INITIAL_STATE);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setJob((prev) => ({
        ...prev,
        elapsedMs: Date.now() - startTimeRef.current,
      }));
    }, 1000);
  }, [stopTimer]);

  const abortWait = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      abortWait();
      stopTimer();
    };
  }, [abortWait, stopTimer]);

  const submitJob = useCallback(async () => {
    if (!yaml.trim()) return;

    abortWait();
    stopTimer();
    setJob({ ...INITIAL_STATE, loading: true });

    try {
      const client = createTeckelClient(serverUrl);
      const resp = await client.submitJob(yaml, variables);

      const controller = new AbortController();
      abortRef.current = controller;

      setJob({
        jobId: resp.job_id,
        status: "queued",
        error: null,
        loading: true,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        durationMs: null,
        elapsedMs: 0,
      });

      startTimer();

      // Wait loop
      try {
        let done = false;
        while (!done) {
          const jobResp = await client.waitJob(resp.job_id, 30, controller.signal);
          setJob((prev) => ({
            ...prev,
            status: jobResp.status,
            error: jobResp.error || null,
            createdAt: jobResp.created_at,
            startedAt: jobResp.started_at || null,
            completedAt: jobResp.completed_at || null,
            durationMs: jobResp.duration_ms ?? null,
            elapsedMs: Date.now() - startTimeRef.current,
          }));

          if (isTerminal(jobResp.status)) {
            done = true;
            stopTimer();
            setJob((prev) => ({ ...prev, loading: false }));
          }
        }
      } catch {
        stopTimer();
        if (controller.signal.aborted) {
          // Cancelled by user — don't overwrite status
          setJob((prev) => ({ ...prev, loading: false }));
        } else {
          setJob((prev) => ({
            ...prev,
            loading: false,
            error: "Lost connection to server",
          }));
        }
      }
    } catch (e) {
      stopTimer();
      setJob({
        ...INITIAL_STATE,
        status: "failed",
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }, [yaml, serverUrl, variables, abortWait, stopTimer, startTimer]);

  const cancelJob = useCallback(async () => {
    if (!job.jobId) return;
    abortWait();
    stopTimer();
    try {
      const client = createTeckelClient(serverUrl);
      await client.cancelJob(job.jobId);
    } catch {
      // best effort
    }
  }, [job.jobId, serverUrl, abortWait, stopTimer]);

  const reset = useCallback(() => {
    abortWait();
    stopTimer();
    setJob(INITIAL_STATE);
  }, [abortWait, stopTimer]);

  return { job, submitJob, cancelJob, reset };
}
