"use client";

import { useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { registerTeckelLanguage } from "@/lib/editor/teckel-language";
import { useThemeStore } from "@/stores/theme-store";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function CodeInput({
  value,
  onChange,
  placeholder,
  rows = 3,
}: CodeInputProps) {
  const theme = useThemeStore((s) => s.theme);
  const registeredRef = useRef(false);

  const handleMount: OnMount = (_editor, monaco) => {
    if (!registeredRef.current) {
      registerTeckelLanguage(monaco);
      registeredRef.current = true;
    }
  };

  const height = rows * 20; // approximate line height

  return (
    <Editor
      height={`${height}px`}
      language="teckel"
      theme={theme === "dark" ? "vs-dark" : "vs"}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onMount={handleMount}
      options={{
        minimap: { enabled: false },
        lineNumbers: "off",
        glyphMargin: false,
        folding: false,
        scrollBeyondLastLine: false,
        wordWrap: "on",
        fontSize: 13,
        fontFamily: "var(--font-jetbrains-mono), monospace",
        padding: { top: 8, bottom: 8 },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        scrollbar: { vertical: "hidden", horizontal: "hidden" },
        renderLineHighlight: "none",
        placeholder: placeholder,
        automaticLayout: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
      }}
      className="rounded-md border border-zinc-700 overflow-hidden"
    />
  );
}
