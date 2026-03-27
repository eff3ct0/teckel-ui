"use client";

import { useState, useCallback } from "react";
import { useConnectionStore } from "@/stores/connection-store";
import { createTeckelClient } from "@/lib/api/teckel-client";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

export function ConnectionPanel() {
  const serverUrl = useConnectionStore((s) => s.serverUrl);
  const setServerUrl = useConnectionStore((s) => s.setServerUrl);
  const autoValidate = useConnectionStore((s) => s.autoValidate);
  const setAutoValidate = useConnectionStore((s) => s.setAutoValidate);
  const connected = useConnectionStore((s) => s.connected);
  const setConnected = useConnectionStore((s) => s.setConnected);
  const lastHealthCheck = useConnectionStore((s) => s.lastHealthCheck);
  const setLastHealthCheck = useConnectionStore((s) => s.setLastHealthCheck);

  const [testing, setTesting] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState(serverUrl);

  const testConnection = useCallback(async () => {
    setTesting(true);
    setTestError(null);
    setServerVersion(null);

    try {
      const client = createTeckelClient(urlDraft);
      const resp = await client.health();
      setConnected(true);
      setServerVersion(resp.version);
      setLastHealthCheck(new Date().toISOString());
      setTestError(null);
      // Persist URL only on successful connection
      if (urlDraft !== serverUrl) {
        setServerUrl(urlDraft);
      }
    } catch (e) {
      setConnected(false);
      setServerVersion(null);
      setLastHealthCheck(null);
      setTestError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setTesting(false);
    }
  }, [urlDraft, serverUrl, setServerUrl, setConnected, setLastHealthCheck]);

  return (
    <div className="space-y-4">
      {/* Connection status indicator */}
      <div className="flex items-center gap-2">
        {connected ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Wifi className="h-3.5 w-3.5" />
            Connected
            {serverVersion && (
              <span className="text-[var(--muted-foreground)]">v{serverVersion}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <WifiOff className="h-3.5 w-3.5" />
            Disconnected
          </div>
        )}
      </div>

      {/* Server URL */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
          Server URL
        </label>
        <div className="flex gap-1.5">
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="http://localhost:8080"
            className="h-8 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 font-mono text-xs text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30"
          />
          <button
            onClick={testConnection}
            disabled={testing || !urlDraft.trim()}
            className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)] disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${testing ? "animate-spin" : ""}`} />
            Test
          </button>
        </div>
      </div>

      {/* Test result */}
      {testError && (
        <div className="flex items-start gap-1.5 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
          <span className="text-[10px] text-red-400">{testError}</span>
        </div>
      )}
      {connected && !testError && (
        <div className="flex items-start gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span className="text-[10px] text-emerald-400">
            Server is reachable
            {lastHealthCheck && (
              <span className="text-emerald-400/60">
                {" "}(checked {new Date(lastHealthCheck).toLocaleTimeString()})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Auto-validate toggle */}
      <div>
        <label className="flex items-center gap-2 text-xs text-[var(--foreground)]">
          <input
            type="checkbox"
            checked={autoValidate}
            onChange={(e) => setAutoValidate(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-[var(--border)] accent-[var(--primary)]"
          />
          Auto-validate YAML on server
        </label>
        <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
          When enabled, validates your pipeline YAML against the server as you edit.
        </p>
      </div>
    </div>
  );
}
