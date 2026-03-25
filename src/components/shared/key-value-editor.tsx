"use client";

import { Plus, X } from "lucide-react";

interface KeyValueEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor({
  value,
  onChange,
  keyPlaceholder = "key",
  valuePlaceholder = "value",
}: KeyValueEditorProps) {
  const entries = Object.entries(value);

  const addEntry = () => {
    onChange({ ...value, "": "" });
  };

  const removeEntry = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const updateKey = (oldKey: string, newKey: string) => {
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(value)) {
      next[k === oldKey ? newKey : k] = v;
    }
    onChange(next);
  };

  const updateValue = (key: string, newValue: string) => {
    onChange({ ...value, [key]: newValue });
  };

  return (
    <div className="space-y-1.5">
      {entries.map(([key, val], i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            value={key}
            onChange={(e) => updateKey(key, e.target.value)}
            placeholder={keyPlaceholder}
            className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none"
          />
          <input
            value={val}
            onChange={(e) => updateValue(key, e.target.value)}
            placeholder={valuePlaceholder}
            className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => removeEntry(key)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
      >
        <Plus className="h-3 w-3" />
        Add entry
      </button>
    </div>
  );
}
