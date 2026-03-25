"use client";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function CodeInput({
  value,
  onChange,
  placeholder = "Enter expression...",
  rows = 3,
}: CodeInputProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-2 font-mono text-xs text-[var(--foreground)] transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30"
      spellCheck={false}
    />
  );
}
