import type { Edge } from "./kruskal";
import type { GraphNode } from "@/data/karachiNetwork";

export type Solver = "dijkstra" | "astar";

export interface PathResult {
  path: string[];
  minutes: number;
  hops: number;
  visited: number;
  solver: Solver;
}

const BAND: Record<Edge["traffic"], number> = {
  low: 1,
  medium: 1.5,
  high: 2.5,
};

const edgeKey = (from: string, to: string) => `${from}-${to}`;

export function liveWeight(
  edge: Edge,
  multipliers: Record<string, number>,
  inflate: Record<string, number> = {},
  shiftScale = 1,
): number {
  if (edge.isBlocked) return Number.POSITIVE_INFINITY;
  const key = edgeKey(edge.from, edge.to);
  const reverse = edgeKey(edge.to, edge.from);
  const multiplier = multipliers[key] ?? multipliers[reverse] ?? 1;
  const bump = inflate[key] ?? inflate[reverse] ?? 1;
  return edge.weight * BAND[edge.traffic] * multiplier * bump * shiftScale;
}

function neighbors(node: string, edges: Edge[]): { id: string; edge: Edge }[] {
  const out: { id: string; edge: Edge }[] = [];
  for (const edge of edges) {
    if (edge.isBlocked) continue;
    if (edge.from === node) out.push({ id: edge.to, edge });
    else if (edge.to === node) out.push({ id: edge.from, edge });
  }
  return out;
}

function reconstruct(cameFrom: Map<string, string>, target: string): string[] {
  const path = [target];
  let current = target;
  while (cameFrom.has(current)) {
    current = cameFrom.get(current)!;
    path.unshift(current);
  }
  return path;
}

function heuristicScale(nodes: GraphNode[], edges: Edge[]): number {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const ratios: number[] = [];
  for (const edge of edges) {
    const a = byId.get(edge.from);
    const b = byId.get(edge.to);
    if (!a || !b) continue;
    const pixels = Math.hypot(a.x - b.x, a.y - b.y);
    if (pixels > 1) ratios.push(edge.weight / pixels);
  }
  if (ratios.length === 0) return 0.02;
  ratios.sort((left, right) => left - right);
  return ratios[Math.floor(ratios.length / 2)];
}

function search(
  nodes: GraphNode[],
  edges: Edge[],
  multipliers: Record<string, number>,
  source: string,
  target: string,
  solver: Solver,
  inflate: Record<string, number> = {},
  shiftScale = 1,
): PathResult | null {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const scale = solver === "astar" ? heuristicScale(nodes, edges) : 0;
  const goal = byId.get(target);
  const h = (id: string) => {
    if (solver !== "astar" || !goal) return 0;
    const node = byId.get(id);
    if (!node) return 0;
    return Math.hypot(node.x - goal.x, node.y - goal.y) * scale;
  };

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const cameFrom = new Map<string, string>();
  const open = new Set<string>([source]);
  const closed = new Set<string>();

  for (const node of nodes) {
    gScore.set(node.id, node.id === source ? 0 : Number.POSITIVE_INFINITY);
    fScore.set(node.id, node.id === source ? h(source) : Number.POSITIVE_INFINITY);
  }

  let visited = 0;

  while (open.size > 0) {
    let current: string | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const id of open) {
      const score = fScore.get(id) ?? Number.POSITIVE_INFINITY;
      if (score < best) {
        best = score;
        current = id;
      }
    }
    if (current === null || best === Number.POSITIVE_INFINITY) break;

    if (current === target) {
      const path = reconstruct(cameFrom, target);
      return {
        path,
        minutes: Math.round(gScore.get(target) ?? 0),
        hops: Math.max(0, path.length - 1),
        visited,
        solver,
      };
    }

    open.delete(current);
    closed.add(current);
    visited += 1;

    for (const { id, edge } of neighbors(current, edges)) {
      if (closed.has(id)) continue;
      const tentative =
        (gScore.get(current) ?? Number.POSITIVE_INFINITY) +
        liveWeight(edge, multipliers, inflate, shiftScale);
      if (tentative >= (gScore.get(id) ?? Number.POSITIVE_INFINITY)) continue;
      cameFrom.set(id, current);
      gScore.set(id, tentative);
      fScore.set(id, tentative + h(id));
      open.add(id);
    }
  }

  return null;
}

export function findPath(
  nodes: GraphNode[],
  edges: Edge[],
  multipliers: Record<string, number>,
  source: string,
  target: string,
  solver: Solver = "dijkstra",
  shiftScale = 1,
): PathResult | null {
  if (source === target) return null;
  return search(nodes, edges, multipliers, source, target, solver, {}, shiftScale);
}

export function findPathVia(
  nodes: GraphNode[],
  edges: Edge[],
  multipliers: Record<string, number>,
  source: string,
  via: string,
  target: string,
  solver: Solver = "dijkstra",
  shiftScale = 1,
): PathResult | null {
  if (!via || via === source || via === target) {
    return findPath(nodes, edges, multipliers, source, target, solver, shiftScale);
  }
  const first = findPath(nodes, edges, multipliers, source, via, solver, shiftScale);
  const second = findPath(nodes, edges, multipliers, via, target, solver, shiftScale);
  if (!first || !second) return null;
  return {
    path: [...first.path, ...second.path.slice(1)],
    minutes: first.minutes + second.minutes,
    hops: first.hops + second.hops,
    visited: first.visited + second.visited,
    solver,
  };
}

export function findAlternatePath(
  nodes: GraphNode[],
  edges: Edge[],
  multipliers: Record<string, number>,
  primary: PathResult,
  shiftScale = 1,
): PathResult | null {
  const inflate: Record<string, number> = {};
  for (let i = 0; i < primary.path.length - 1; i += 1) {
    const from = primary.path[i];
    const to = primary.path[i + 1];
    inflate[edgeKey(from, to)] = 4;
    inflate[edgeKey(to, from)] = 4;
  }
  const next = search(
    nodes,
    edges,
    multipliers,
    primary.path[0],
    primary.path[primary.path.length - 1],
    "dijkstra",
    inflate,
    shiftScale,
  );
  if (!next) return null;
  if (next.path.join(">") === primary.path.join(">")) return null;
  return { ...next, solver: "dijkstra" };
}
