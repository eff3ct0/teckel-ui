"use client";

import { useEffect, useMemo } from "react";
import { usePipelineStore, type PipelineExtraSections } from "@/stores/pipeline-store";
import { useVariablesStore } from "@/stores/variables-store";
import { useConnectionStore } from "@/stores/connection-store";
import { generateYaml } from "@/lib/yaml/generator";

/**
 * Hook that auto-generates YAML whenever nodes, edges, metadata, or secrets change.
 * Merges secrets from the variables store into the extra sections for YAML output.
 */
export function useYamlSync() {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const name = usePipelineStore((s) => s.name);
  const metadata = usePipelineStore((s) => s.metadata);
  const extraSections = usePipelineStore((s) => s.extraSections);
  const setYaml = usePipelineStore((s) => s.setYaml);
  const secrets = useVariablesStore((s) => s.secrets);
  const backend = useConnectionStore((s) => s.backend);

  // Build the secrets YAML section from the variables store entries
  const mergedSections = useMemo((): PipelineExtraSections => {
    const validSecrets = secrets.filter((s) => s.alias && s.key);
    if (validSecrets.length === 0) {
      return extraSections;
    }

    const secretsObj: Record<string, unknown> = {
      keys: Object.fromEntries(
        validSecrets.map((s) => [
          s.alias,
          {
            key: s.key,
            ...(s.scope ? { scope: s.scope } : {}),
          },
        ]),
      ),
    };

    return {
      ...extraSections,
      secrets: secretsObj,
    };
  }, [extraSections, secrets]);

  useEffect(() => {
    const yamlStr = generateYaml(nodes, edges, name, metadata, mergedSections, backend);
    setYaml(yamlStr);
  }, [nodes, edges, name, metadata, mergedSections, backend, setYaml]);
}
