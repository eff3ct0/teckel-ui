"use client";

import { useEffect } from "react";
import { usePipelineStore } from "@/stores/pipeline-store";
import { generateYaml } from "@/lib/yaml/generator";

/**
 * Hook that auto-generates YAML whenever nodes or edges change.
 */
export function useYamlSync() {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const setYaml = usePipelineStore((s) => s.setYaml);

  useEffect(() => {
    const yamlStr = generateYaml(nodes, edges);
    setYaml(yamlStr);
  }, [nodes, edges, setYaml]);
}
