"use client";

import { useState, useCallback, type KeyboardEvent } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder = "Type and press Enter" }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = useCallback(() => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
  }, [input, value, onChange]);

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="flex min-h-[32px] flex-wrap items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 transition-colors focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]/30">
      {value.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded bg-[var(--secondary)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--foreground)]"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={addTag}
        placeholder={value.length === 0 ? placeholder : ""}
        className="min-w-[80px] flex-1 bg-transparent text-xs text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
      />
    </div>
  );
}
