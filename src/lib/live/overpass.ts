import type { Edge } from "@/utils/kruskal";
import type { GraphNode } from "@/types/graph";
import { haversineKm, type LonLat } from "./geo";

export interface Amenity {
  id: string;
  kind: string;
  name: string;
  lat: number;
  lon: number;
}

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface ExtractedGraph {
  nodes: GraphNode[];
  edges: Edge[];
}

const OVERPASS = "https://overpass-api.de/api/interpreter";

const SPEED_KMH: Record<string, number> = {
  motorway: 110,
  motorway_link: 70,
  trunk: 90,
  trunk_link: 60,
  primary: 70,
  primary_link: 50,
  secondary: 55,
  secondary_link: 40,
  tertiary: 40,
  tertiary_link: 30,
  unclassified: 35,
  residential: 30,
  living_street: 20,
  service: 20,
};

function parseMaxspeed(raw?: string): number | null {
  if (!raw) return null;
  const match = raw.match(/(\d+)/);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (/mph/i.test(raw)) return n * 1.609;
  return n;
}

async function overpass(query: string): Promise<{ elements: OverpassEl[] }> {
  const res = await fetch(OVERPASS, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass failed (${res.status})`);
  return res.json() as Promise<{ elements: OverpassEl[] }>;
}

type OverpassEl = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
};

export async function nearbyAmenities(point: LonLat, radiusM = 1800): Promise<Amenity[]> {
  const query = `
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${radiusM},${point.lat},${point.lon});
  node["amenity"="clinic"](around:${radiusM},${point.lat},${point.lon});
  node["amenity"="police"](around:${radiusM},${point.lat},${point.lon});
  node["amenity"="fire_station"](around:${radiusM},${point.lat},${point.lon});
  node["amenity"="fuel"](around:${radiusM},${point.lat},${point.lon});
);
out body 40;
`;
  const data = await overpass(query);
  return data.elements
    .filter((el) => el.lat && el.lon)
    .map((el) => ({
      id: String(el.id),
      kind: el.tags?.amenity ?? "place",
      name: el.tags?.name || el.tags?.amenity || "Unnamed",
      lat: el.lat as number,
      lon: el.lon as number,
    }));
}

export async function extractHighways(bounds: MapBounds): Promise<ExtractedGraph> {
  const { south, west, north, east } = bounds;
  const query = `
[out:json][timeout:25];
way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"](${south},${west},${north},${east});
out geom 80;
`;
  const data = await overpass(query);
  const nodes = new Map<string, GraphNode>();
  const edges: Edge[] = [];
  const seen = new Set<string>();

  for (const way of data.elements) {
    const geom = way.geometry;
    if (!geom || geom.length < 2) continue;
    const highway = way.tags?.highway ?? "secondary";
    const speed = parseMaxspeed(way.tags?.maxspeed) ?? SPEED_KMH[highway] ?? 40;
    const roadName = way.tags?.name || highway;

    for (let i = 0; i < geom.length; i += 1) {
      const pt = geom[i];
      const id = `n${Math.round(pt.lat * 1e5)}_${Math.round(pt.lon * 1e5)}`;
      if (!nodes.has(id)) {
        nodes.set(id, {
          id,
          x: pt.lon,
          y: -pt.lat,
          lat: pt.lat,
          lon: pt.lon,
          label: i === 0 || i === geom.length - 1 ? roadName : id,
        });
      }
    }

    for (let i = 0; i < geom.length - 1; i += 1) {
      const a = geom[i];
      const b = geom[i + 1];
      const from = `n${Math.round(a.lat * 1e5)}_${Math.round(a.lon * 1e5)}`;
      const to = `n${Math.round(b.lat * 1e5)}_${Math.round(b.lon * 1e5)}`;
      const key = from < to ? `${from}|${to}` : `${to}|${from}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const km = haversineKm({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon });
      const minutes = (km / Math.max(speed, 8)) * 60;
      edges.push({
        from,
        to,
        weight: Math.max(0.2, Number(minutes.toFixed(2))),
        traffic: speed >= 80 ? "low" : speed >= 45 ? "medium" : "high",
        isBlocked: false,
      });
    }
  }

  return { nodes: [...nodes.values()], edges };
}

export function nearestNode(nodes: GraphNode[], point: LonLat): GraphNode | null {
  let best: GraphNode | null = null;
  let bestKm = Infinity;
  for (const node of nodes) {
    if (node.lat == null || node.lon == null) continue;
    const km = haversineKm(point, { lat: node.lat, lon: node.lon });
    if (km < bestKm) {
      bestKm = km;
      best = node;
    }
  }
  return best;
}
