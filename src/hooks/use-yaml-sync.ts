"use client";

import { useEffect } from "react";
import { usePipelineStore } from "@/stores/pipeline-store";
import { generateYaml } from "@/lib/yaml/generator";

/**
 * Hook that auto-generates YAML whenever nodes, edges, or metadata change.
 */
export function useYamlSync() {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const name = usePipelineStore((s) => s.name);
  const metadata = usePipelineStore((s) => s.metadata);
  const setYaml = usePipelineStore((s) => s.setYaml);

  useEffect(() => {
    const yamlStr = generateYaml(nodes, edges, name, metadata);
    setYaml(yamlStr);
  }, [nodes, edges, name, metadata, setYaml]);
}
