"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useConnectionStore } from "@/stores/connection-store";
import { createTeckelClient } from "@/lib/api/teckel-client";

export type HealthStatus = "connected" | "disconnected" | "checking";

export function useHealthCheck(intervalMs: number = 15000) {
  const serverUrl = useConnectionStore((s) => s.serverUrl);
  const setConnected = useConnectionStore((s) => s.setConnected);
  const setLastHealthCheck = useConnectionStore((s) => s.setLastHealthCheck);
  const [status, setStatus] = useState<HealthStatus>("checking");
  const [showReconnected, setShowReconnected] = useState(false);
  const wasDisconnectedRef = useRef(false);

  const checkHealth = useCallback(async () => {
    setStatus("checking");
    try {
      const client = createTeckelClient(serverUrl);
      await client.health();
      // If we were disconnected and now connected, show reconnected indicator
      if (wasDisconnectedRef.current) {
        wasDisconnectedRef.current = false;
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
      setConnected(true);
      setLastHealthCheck(new Date().toISOString());
      setStatus("connected");
      return true;
    } catch {
      wasDisconnectedRef.current = true;
      setConnected(false);
      setStatus("disconnected");
      return false;
    }
  }, [serverUrl, setConnected, setLastHealthCheck]);

  useEffect(() => {
    const id = setInterval(checkHealth, intervalMs);
    // Run first check after mount, not synchronously during effect
    const initial = setTimeout(checkHealth, 0);
    return () => {
      clearInterval(id);
      clearTimeout(initial);
    };
  }, [checkHealth, intervalMs]);

  return { status, checkHealth, showReconnected };
}
