"use client";

import { useState } from "react";
import { useVariablesStore, type SecretEntry } from "@/stores/variables-store";
import { Plus, X, Variable, Lock, Info } from "lucide-react";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
      {children}
    </label>
  );
}

function VariablesSection() {
  const variables = useVariablesStore((s) => s.variables);
  const setVariable = useVariablesStore((s) => s.setVariable);
  const removeVariable = useVariablesStore((s) => s.removeVariable);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const entries = Object.entries(variables);

  const addVariable = () => {
    if (!newKey.trim()) return;
    setVariable(newKey.trim(), newValue);
    setNewKey("");
    setNewValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addVariable();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Variable className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
        <Label>Variables</Label>
      </div>
      <div className="rounded-md border border-[var(--border)] bg-[var(--background)]/50 p-2">
        <p className="mb-2 text-[10px] text-[var(--muted-foreground)]">
          Variables are substituted in YAML at parse time using <code className="rounded bg-[var(--secondary)] px-1">{"${VAR_NAME}"}</code> syntax.
          Use <code className="rounded bg-[var(--secondary)] px-1">{"${VAR:default}"}</code> for defaults.
        </p>
      </div>

      {/* Existing variables */}
      <div className="space-y-1.5">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center gap-1.5">
            <input
              value={key}
              readOnly
              className="h-7 w-28 shrink-0 rounded border border-[var(--border)] bg-[var(--secondary)]/50 px-2 font-mono text-[10px] text-[var(--foreground)]"
            />
            <input
              value={value}
              onChange={(e) => setVariable(key, e.target.value)}
              className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeVariable(key)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new variable */}
      <div className="flex items-center gap-1.5">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="VAR_NAME"
          className="h-7 w-28 shrink-0 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
        />
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="value"
          className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
        />
        <button
          type="button"
          onClick={addVariable}
          disabled={!newKey.trim()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] disabled:opacity-30"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function SecretsSection() {
  const secrets = useVariablesStore((s) => s.secrets);
  const addSecret = useVariablesStore((s) => s.addSecret);
  const updateSecret = useVariablesStore((s) => s.updateSecret);
  const removeSecret = useVariablesStore((s) => s.removeSecret);

  const handleAdd = () => {
    addSecret({ alias: "", key: "", scope: "" });
  };

  const handleUpdate = (index: number, field: keyof SecretEntry, value: string) => {
    const current = secrets[index];
    updateSecret(index, { ...current, [field]: value });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
        <Label>Secrets</Label>
      </div>
      <div className="rounded-md border border-[var(--border)] bg-[var(--background)]/50 p-2">
        <p className="mb-1 text-[10px] text-[var(--muted-foreground)]">
          Secrets are referenced in YAML as <code className="rounded bg-[var(--secondary)] px-1">{"{{secrets.alias}}"}</code>.
          They are declared here and resolved at runtime via the secrets provider or env var{" "}
          <code className="rounded bg-[var(--secondary)] px-1">TECKEL_SECRET__ALIAS</code>.
        </p>
      </div>

      {/* Headers */}
      {secrets.length > 0 && (
        <div className="flex items-center gap-1.5 px-0.5">
          <span className="w-24 text-[9px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Alias</span>
          <span className="flex-1 text-[9px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Key</span>
          <span className="w-20 text-[9px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Scope</span>
          <span className="w-7" />
        </div>
      )}

      {/* Existing secrets */}
      <div className="space-y-1.5">
        {secrets.map((secret, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              value={secret.alias}
              onChange={(e) => handleUpdate(i, "alias", e.target.value)}
              placeholder="alias"
              className="h-7 w-24 shrink-0 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
            <input
              value={secret.key}
              onChange={(e) => handleUpdate(i, "key", e.target.value)}
              placeholder="secret/path/key"
              className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
            <input
              value={secret.scope || ""}
              onChange={(e) => handleUpdate(i, "scope", e.target.value)}
              placeholder="scope"
              className="h-7 w-20 shrink-0 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeSecret(i)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
      >
        <Plus className="h-3 w-3" />
        Add secret
      </button>
    </div>
  );
}

export function VariablesPanel() {
  return (
    <div className="space-y-6">
      <VariablesSection />
      <div className="h-px bg-[var(--border)]" />
      <SecretsSection />
    </div>
  );
}
