import type { TeckelNode, TeckelEdge, ResolvedTags } from "@/types/pipeline";

export type { ResolvedTags };

/**
 * Resolve tags for all nodes using topological ordering.
 * Own tags come from node.data.config.tags, inherited tags propagate
 * from upstream parents, and removeTags strips specific tags.
 */
export function resolveAllTags(
  nodes: TeckelNode[],
  edges: TeckelEdge[],
): Record<string, ResolvedTags> {
  const result: Record<string, ResolvedTags> = {};

  if (nodes.length === 0) return result;

  // Build adjacency and in-degree maps
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    children.set(node.id, []);
    parents.set(node.id, []);
  }

  for (const edge of edges) {
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      children.get(edge.source)!.push(edge.target);
      parents.get(edge.target)!.push(edge.source);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  }

  // Kahn's algorithm for topological sort
  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(id);
    for (const child of children.get(id) || []) {
      const newDegree = (inDegree.get(child) || 1) - 1;
      inDegree.set(child, newDegree);
      if (newDegree === 0) queue.push(child);
    }
  }

  // Process in topological order
  for (const nodeId of sorted) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const config = node.data.config;
    const own = (config.tags as string[] | undefined) ?? [];
    const removed = (config.removeTags as string[] | undefined) ?? [];

    // Collect inherited tags from all parent nodes
    const inheritedSet = new Set<string>();
    for (const parentId of parents.get(nodeId) || []) {
      const parentResolved = result[parentId];
      if (parentResolved) {
        for (const tag of parentResolved.effective) {
          inheritedSet.add(tag);
        }
      }
    }
    // Don't include own tags in the inherited list
    const inherited = [...inheritedSet].filter((t) => !own.includes(t));

    // Effective = own + inherited - removed
    const removedSet = new Set(removed);
    const effective = [...own, ...inherited].filter((t) => !removedSet.has(t));

    result[nodeId] = { own, inherited, removed, effective };
  }

  // Handle any nodes not reached by topological sort (cycles)
  for (const node of nodes) {
    if (!result[node.id]) {
      const config = node.data.config;
      const own = (config.tags as string[] | undefined) ?? [];
      result[node.id] = { own, inherited: [], removed: [], effective: own };
    }
  }

  return result;
}
