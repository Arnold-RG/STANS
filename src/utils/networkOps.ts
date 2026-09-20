import type { Edge } from "@/utils/kruskal";
import { UnionFind } from "@/utils/unionFind";
import { nodeLabel, type GraphNode } from "@/data/karachiNetwork";
import type { ShiftProfile } from "@/data/deskOps";

const edgeId = (edge: Edge) => `${edge.from}-${edge.to}`;

export function liveMinutes(
  edge: Edge,
  multipliers: Record<string, number>,
  shiftScale: number,
): number {
  if (edge.isBlocked) return Number.POSITIVE_INFINITY;
  return edge.weight * (multipliers[edgeId(edge)] ?? 1) * shiftScale;
}

export function congestionHeat(
  edges: Edge[],
  multipliers: Record<string, number>,
): number {
  if (edges.length === 0) return 0;
  const delayed = edges.filter((edge) => {
    const multiplier = multipliers[edgeId(edge)] ?? 1;
    return !edge.isBlocked && (multiplier > 1.5 || edge.traffic === "high");
  }).length;
  const blocked = edges.filter((edge) => edge.isBlocked).length;
  return Math.min(100, Math.round((delayed / edges.length) * 55 + (blocked / edges.length) * 45));
}

export function networkComponents(nodes: GraphNode[], edges: Edge[]) {
  if (nodes.length === 0) {
    return { count: 0, isolated: [] as string[], groups: [] as string[][] };
  }
  const uf = new UnionFind(nodes.map((node) => node.id));
  for (const edge of edges) {
    if (edge.isBlocked) continue;
    uf.union(edge.from, edge.to);
  }
  const groups = Array.from(uf.getSets().values()).sort((left, right) => right.length - left.length);
  return {
    count: groups.length,
    isolated: groups.filter((group) => group.length === 1).map((group) => group[0]),
    groups,
  };
}

export function heatBand(score: number): "CLEAR" | "WARM" | "HOT" {
  if (score >= 55) return "HOT";
  if (score >= 25) return "WARM";
  return "CLEAR";
}

export function sitrepLines(input: {
  sector: string;
  shift: ShiftProfile;
  operator: string;
  nodes: GraphNode[];
  edges: Edge[];
  multipliers: Record<string, number>;
  liveId: string;
  destId: string;
  viaId: string;
  path: string[];
  minutes?: number;
}): string[] {
  const heat = congestionHeat(input.edges, input.multipliers);
  const closed = input.edges.filter((edge) => edge.isBlocked);
  const parts = networkComponents(input.nodes, input.edges);
  const trip =
    input.path.length > 0
      ? `${input.path.map((id) => nodeLabel(input.nodes, id)).join(" → ")}${input.minutes ? ` · ${input.minutes} min` : ""}`
      : "No trip on the board";

  return [
    `STANS SITREP · ${input.sector}`,
    `Shift ${input.shift.label} (${input.shift.window}) · ${input.shift.scale.toFixed(2)}×`,
    `Operator ${input.operator || "UNSIGNED"}`,
    `Board ${input.nodes.length} junctions / ${input.edges.length} links`,
    `Heat ${heat} ${heatBand(heat)} · closed ${closed.length} · components ${parts.count} · isolated ${parts.isolated.length}`,
    `Live ${input.liveId || "—"} · via ${input.viaId || "—"} · dest ${input.destId || "—"}`,
    trip,
    closed.length
      ? `Closures: ${closed.map((edge) => `${nodeLabel(input.nodes, edge.from)}–${nodeLabel(input.nodes, edge.to)}`).join("; ")}`
      : "Closures: none",
    `Issued ${new Date().toISOString()}`,
  ];
}

export function printPlain(title: string, lines: string[]) {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font: 13px/1.45 "IBM Plex Mono", ui-monospace, monospace; color: #16140f; margin: 32px; }
  h1 { font-size: 14px; letter-spacing: .2em; text-transform: uppercase; }
  p { margin: 0 0 8px; }
</style></head><body>
<h1>${title}</h1>
${lines.map((line) => `<p>${line.replace(/</g, "&lt;")}</p>`).join("")}
</body></html>`;
  const frame = window.open("", "_blank", "noopener,noreferrer");
  if (!frame) return false;
  frame.document.write(html);
  frame.document.close();
  frame.focus();
  frame.print();
  return true;
}
