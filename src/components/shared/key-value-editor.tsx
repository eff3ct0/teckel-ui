"use client";

import { useMemo } from "react";
import { Plus, X } from "lucide-react";

interface KeyValueEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

interface Entry {
  key: string;
  value: string;
}

export function KeyValueEditor({
  value,
  onChange,
  keyPlaceholder = "key",
  valuePlaceholder = "value",
}: KeyValueEditorProps) {
  // Convert Record to array for stable ordering and duplicate-key-safe editing
  const entries: Entry[] = useMemo(
    () => Object.entries(value).map(([k, v]) => ({ key: k, value: String(v ?? "") })),
    [value],
  );

  const emit = (next: Entry[]) => {
    const record: Record<string, string> = {};
    for (const e of next) {
      record[e.key] = e.value;
    }
    onChange(record);
  };

  const addEntry = () => {
    emit([...entries, { key: "", value: "" }]);
  };

  const removeEntry = (index: number) => {
    emit(entries.filter((_, i) => i !== index));
  };

  const updateKey = (index: number, newKey: string) => {
    emit(entries.map((e, i) => (i === index ? { ...e, key: newKey } : e)));
  };

  const updateValue = (index: number, newValue: string) => {
    emit(entries.map((e, i) => (i === index ? { ...e, value: newValue } : e)));
  };

  return (
    <div className="space-y-1.5">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            value={entry.key}
            onChange={(e) => updateKey(i, e.target.value)}
            placeholder={keyPlaceholder}
            className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none"
          />
          <input
            value={entry.value}
            onChange={(e) => updateValue(i, e.target.value)}
            placeholder={valuePlaceholder}
            className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => removeEntry(i)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
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
