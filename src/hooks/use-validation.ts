"use client";

import { useMemo } from "react";
import { usePipelineStore } from "@/stores/pipeline-store";
import { validatePipeline, type ValidationError } from "@/lib/nodes/validator";

export function useValidation(): {
  errors: ValidationError[];
  errorCount: number;
  warningCount: number;
  nodeErrors: Map<string, ValidationError[]>;
} {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);

  return useMemo(() => {
    const errors = validatePipeline(nodes, edges);
    const errorCount = errors.filter((e) => e.severity === "error").length;
    const warningCount = errors.filter((e) => e.severity === "warning").length;

    const nodeErrors = new Map<string, ValidationError[]>();
    for (const error of errors) {
      if (!error.nodeId) continue;
      const existing = nodeErrors.get(error.nodeId) || [];
      existing.push(error);
      nodeErrors.set(error.nodeId, existing);
    }

    return { errors, errorCount, warningCount, nodeErrors };
  }, [nodes, edges]);
}
