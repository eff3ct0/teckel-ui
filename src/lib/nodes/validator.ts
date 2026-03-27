import type { TeckelNode, TeckelEdge } from "@/types/pipeline";
import { NODE_SCHEMAS } from "@/lib/nodes/schemas";

/**
 * AssetRef pattern from teckel-spec v2.0:
 * Must start with a letter, only ASCII letters/digits/underscores/hyphens, 1-128 chars.
 */
export const ASSET_REF_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{0,127}$/;

export function isValidAssetRef(ref: string): boolean {
  return ASSET_REF_PATTERN.test(ref);
}

export interface ValidationError {
  nodeId: string;
  severity: "error" | "warning";
  message: string;
}

/**
 * Validate the entire pipeline and return errors/warnings.
 */
export function validatePipeline(
  nodes: TeckelNode[],
  edges: TeckelEdge[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Check for at least one input
  const inputs = nodes.filter((n) => n.data.teckelType === "input");
  if (nodes.length > 0 && inputs.length === 0) {
    errors.push({
      nodeId: "",
      severity: "warning",
      message: "Pipeline has no Input node",
    });
  }

  // 2. Check for at least one output
  const outputs = nodes.filter((n) => n.data.teckelType === "output");
  if (nodes.length > 0 && outputs.length === 0) {
    errors.push({
      nodeId: "",
      severity: "warning",
      message: "Pipeline has no Output node",
    });
  }

  // 3. Check unique refs
  const refs = new Map<string, string[]>();
  for (const node of nodes) {
    const existing = refs.get(node.data.ref) || [];
    existing.push(node.id);
    refs.set(node.data.ref, existing);
  }
  for (const [ref, nodeIds] of refs) {
    if (nodeIds.length > 1) {
      for (const nodeId of nodeIds) {
        errors.push({
          nodeId,
          severity: "error",
          message: `Duplicate reference: "${ref}"`,
        });
      }
    }
  }

  // 4. Validate AssetRef format (spec: ^[a-zA-Z][a-zA-Z0-9_-]{0,127}$)
  for (const node of nodes) {
    const ref = node.data.ref;
    if (!ref.trim()) {
      errors.push({
        nodeId: node.id,
        severity: "error",
        message: "Reference cannot be empty",
      });
    } else if (!isValidAssetRef(ref)) {
      errors.push({
        nodeId: node.id,
        severity: "error",
        message: `Invalid reference "${ref}": must start with a letter, contain only letters/digits/underscores/hyphens, max 128 chars`,
      });
    }
  }

  // 5. Validate node configs with Zod schemas
  for (const node of nodes) {
    const schema = NODE_SCHEMAS[node.data.teckelType];
    const result = schema.safeParse(node.data.config);
    if (!result.success) {
      for (const err of result.error.errors) {
        errors.push({
          nodeId: node.id,
          severity: "error",
          message: `${err.path.join(".")}: ${err.message}`,
        });
      }
    }
  }

  // 6. Check for disconnected transform/output nodes (no incoming edges)
  for (const node of nodes) {
    if (node.data.teckelType === "input") continue;
    const hasIncoming = edges.some((e) => e.target === node.id);
    if (!hasIncoming) {
      errors.push({
        nodeId: node.id,
        severity: "warning",
        message: "Node has no incoming connection",
      });
    }
  }

  // 7. Check for dangling edges
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({
        nodeId: edge.target,
        severity: "error",
        message: "Edge references a missing source node",
      });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({
        nodeId: edge.source,
        severity: "error",
        message: "Edge references a missing target node",
      });
    }
  }

  // 8. Cycle detection using DFS
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const edge of edges) {
    if (adjacency.has(edge.source)) {
      adjacency.get(edge.source)!.push(edge.target);
    }
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    for (const neighbor of adjacency.get(nodeId) || []) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }
    recursionStack.delete(nodeId);
    return false;
  }

  let hasCycles = false;
  for (const node of nodes) {
    if (!visited.has(node.id) && hasCycle(node.id)) {
      hasCycles = true;
      break;
    }
  }
  if (hasCycles) {
    errors.push({
      nodeId: "",
      severity: "error",
      message: "Pipeline contains a cycle",
    });
  }

  // 9. Join needs at least 2 incoming edges (left + right)
  for (const node of nodes) {
    if (node.data.teckelType === "join") {
      const incomingCount = edges.filter((e) => e.target === node.id).length;
      if (incomingCount < 2) {
        errors.push({
          nodeId: node.id,
          severity: "error",
          message: "Join requires at least 2 incoming connections (left + right)",
        });
      }
    }
  }

  return errors;
}
