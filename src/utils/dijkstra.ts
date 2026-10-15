import type { Edge } from "./kruskal";

export interface DijkstraStep {
  stepNumber: number;
  action: "initialize" | "visit" | "update" | "complete";
  currentNode?: string;
  edge?: Edge;
  distances: Map<string, number>;
  previous: Map<string, string | null>;
  visited: Set<string>;
  explanation: string;
  shortestPath?: string[];
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
 * Get neighbors of a node from edge list
 */
function getNeighbors(node: string, edges: Edge[]): { neighbor: string; edge: Edge }[] {
  const neighbors: { neighbor: string; edge: Edge }[] = [];
  
  edges.forEach(edge => {
    if (!edge.isBlocked) {
      if (edge.from === node) {
        neighbors.push({ neighbor: edge.to, edge });
      } else if (edge.to === node) {
        neighbors.push({ neighbor: edge.from, edge });
      }
    }
  });

  return neighbors;
}

/**
 * Reconstruct shortest path from source to target
 */
function reconstructPath(
  target: string,
  previous: Map<string, string | null>
): string[] {
  const path: string[] = [];
  let current: string | null = target;

  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) || null;
  }

  return path;
}

/**
 * Dijkstra's Algorithm Implementation with step-by-step tracking
 * Finds shortest paths from source to all other nodes
 */
export function dijkstraAlgorithm(
  edges: Edge[],
  nodes: string[],
  sourceNode: string,
  targetNode?: string
): DijkstraStep[] {
  const steps: DijkstraStep[] = [];
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();
  const unvisited = new Set<string>(nodes);

  // Initialize distances
  nodes.forEach(node => {
    distances.set(node, node === sourceNode ? 0 : Infinity);
    previous.set(node, null);
  });

  steps.push({
    stepNumber: 0,
    action: "initialize",
    distances: new Map(distances),
    previous: new Map(previous),
    visited: new Set(visited),
    explanation: `Step 0: Initialize Dijkstra's algorithm from source node ${sourceNode}. Set distance to ${sourceNode} as 0, all others as ∞.`,
  });

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let minNode: string | null = null;
    let minDistance = Infinity;

    unvisited.forEach(node => {
      const dist = distances.get(node)!;
      if (dist < minDistance) {
        minDistance = dist;
        minNode = node;
      }
    });

    // If minimum distance is infinity, remaining nodes are unreachable
    if (minNode === null || minDistance === Infinity) {
      steps.push({
        stepNumber: steps.length,
        action: "complete",
        distances: new Map(distances),
        previous: new Map(previous),
        visited: new Set(visited),
        explanation: `Algorithm stopped: Remaining nodes are unreachable from ${sourceNode}.`,
      });
      break;
    }

    unvisited.delete(minNode);
    visited.add(minNode);

    steps.push({
      stepNumber: steps.length,
      action: "visit",
      currentNode: minNode,
      distances: new Map(distances),
      previous: new Map(previous),
      visited: new Set(visited),
      explanation: `Step ${steps.length}: Visit node ${minNode} (distance: ${minDistance === Infinity ? '∞' : minDistance.toFixed(1)}km). Check neighbors.`,
    });

    // Early termination if target is reached
    if (targetNode && minNode === targetNode) {
      const path = reconstructPath(targetNode, previous);
      steps.push({
        stepNumber: steps.length,
        action: "complete",
        distances: new Map(distances),
        previous: new Map(previous),
        visited: new Set(visited),
        explanation: `Target ${targetNode} reached! Shortest path: ${path.join(' → ')} with distance ${distances.get(targetNode)?.toFixed(1)}km`,
        shortestPath: path,
      });
      break;
    }

    // Update distances to neighbors
    const neighbors = getNeighbors(minNode, edges);
    
    neighbors.forEach(({ neighbor, edge }) => {
      if (!visited.has(neighbor)) {
        const edgeWeight = getEffectiveWeight(edge);
        const newDistance = distances.get(minNode)! + edgeWeight;
        const currentDistance = distances.get(neighbor)!;

        if (newDistance < currentDistance) {
          distances.set(neighbor, newDistance);
          previous.set(neighbor, minNode);

          steps.push({
            stepNumber: steps.length,
            action: "update",
            currentNode: minNode,
            edge: edge,
            distances: new Map(distances),
            previous: new Map(previous),
            visited: new Set(visited),
            explanation: `✓ Update: Path to ${neighbor} through ${minNode} is shorter (${newDistance.toFixed(1)}km < ${currentDistance === Infinity ? '∞' : currentDistance.toFixed(1)}km)`,
          });
        }
      }
    });
  }

  // Final step if all nodes visited
  if (visited.size === nodes.length) {
    const finalPath = targetNode ? reconstructPath(targetNode, previous) : [];
    steps.push({
      stepNumber: steps.length,
      action: "complete",
      distances: new Map(distances),
      previous: new Map(previous),
      visited: new Set(visited),
      explanation: `Algorithm Complete! All shortest paths from ${sourceNode} calculated.`,
      shortestPath: finalPath.length > 0 ? finalPath : undefined,
    });
  }

  return steps;
}
