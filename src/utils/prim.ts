import type { Edge } from "./kruskal";

export interface PrimStep {
  stepNumber: number;
  action: "initialize" | "consider" | "add" | "complete";
  edge?: Edge;
  currentMST: Edge[];
  totalWeight: number;
  explanation: string;
  visitedNodes: Set<string>;
  candidateEdges?: Edge[];
}

/**
 * Calculate effective weight considering traffic and blockades
 */
function getEffectiveWeight(edge: Edge): number {
  if (edge.isBlocked) {
    return Infinity;
  }

  const trafficMultiplier = {
    low: 1,
    medium: 1.5,
    high: 2.5,
  };

  return edge.weight * trafficMultiplier[edge.traffic];
}

/**
 * Prim's Algorithm Implementation with step-by-step tracking
 * Builds MST by growing a tree from a starting node
 */
export function primAlgorithm(
  edges: Edge[],
  nodes: string[],
  startNode: string = nodes[0]
): PrimStep[] {
  const steps: PrimStep[] = [];
  const mst: Edge[] = [];
  let totalWeight = 0;
  const visitedNodes = new Set<string>([startNode]);

  steps.push({
    stepNumber: 0,
    action: "initialize",
    currentMST: [],
    totalWeight: 0,
    explanation: `Step 0: Initialize Prim's algorithm starting from node ${startNode}. Mark it as visited.`,
    visitedNodes: new Set(visitedNodes),
  });

  // Continue until all nodes are visited
  while (visitedNodes.size < nodes.length) {
    // Find all edges connecting visited to unvisited nodes
    const candidateEdges = edges.filter(
      (edge) =>
        !edge.isBlocked &&
        ((visitedNodes.has(edge.from) && !visitedNodes.has(edge.to)) ||
         (visitedNodes.has(edge.to) && !visitedNodes.has(edge.from)))
    );

    if (candidateEdges.length === 0) {
      // Graph is disconnected
      steps.push({
        stepNumber: steps.length,
        action: "complete",
        currentMST: [...mst],
        totalWeight: totalWeight,
        explanation: `Algorithm stopped: Graph is disconnected. Cannot reach all nodes.`,
        visitedNodes: new Set(visitedNodes),
      });
      break;
    }

    // Sort candidate edges by effective weight
    candidateEdges.sort((a, b) => getEffectiveWeight(a) - getEffectiveWeight(b));

    steps.push({
      stepNumber: steps.length,
      action: "consider",
      currentMST: [...mst],
      totalWeight: totalWeight,
      explanation: `Step ${steps.length}: Found ${candidateEdges.length} candidate edges from visited nodes to unvisited nodes.`,
      visitedNodes: new Set(visitedNodes),
      candidateEdges: candidateEdges.slice(0, 5), // Show top 5
    });

    // Select minimum weight edge
    const minEdge = candidateEdges[0];
    const effectiveWeight = getEffectiveWeight(minEdge);
    const newNode = visitedNodes.has(minEdge.from) ? minEdge.to : minEdge.from;

    mst.push(minEdge);
    totalWeight += minEdge.weight;
    visitedNodes.add(newNode);

    steps.push({
      stepNumber: steps.length,
      action: "add",
      edge: minEdge,
      currentMST: [...mst],
      totalWeight: totalWeight,
      explanation: `✓ Add edge ${minEdge.from}-${minEdge.to} (weight: ${minEdge.weight}km, effective: ${effectiveWeight.toFixed(1)}). Add node ${newNode} to tree. Visited: ${visitedNodes.size}/${nodes.length}`,
      visitedNodes: new Set(visitedNodes),
    });
  }

  if (visitedNodes.size === nodes.length) {
    steps.push({
      stepNumber: steps.length,
      action: "complete",
      currentMST: [...mst],
      totalWeight: totalWeight,
      explanation: `Algorithm Complete! MST has ${mst.length} edges with total weight ${totalWeight}km. All nodes connected.`,
      visitedNodes: new Set(visitedNodes),
    });
  }

  return steps;
}
