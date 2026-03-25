"use client";

import { useCallback } from "react";
import { usePipelineStore } from "@/stores/pipeline-store";

export function useYamlExport() {
  const yaml = usePipelineStore((s) => s.yaml);
  const name = usePipelineStore((s) => s.name);

  const exportToFile = useCallback(() => {
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, "-")}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  }, [yaml, name]);

  return { exportToFile };
}
