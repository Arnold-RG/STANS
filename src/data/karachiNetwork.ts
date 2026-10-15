import type { MapType } from "@/components/maps/PakistanMapSVG";
import type { Edge } from "@/utils/kruskal";

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
}

export const KARACHI_MAP_TYPE: MapType = "karachi";
export const KARACHI_SECTOR = "KARACHI · SECTOR 04";

export const KARACHI_NODES: GraphNode[] = [
  { id: "CLF", x: 100, y: 350, label: "Clifton" },
  { id: "DHA", x: 80, y: 280, label: "DHA" },
  { id: "SAD", x: 200, y: 200, label: "Saddar" },
  { id: "GLN", x: 350, y: 150, label: "Gulshan" },
  { id: "JHR", x: 450, y: 180, label: "Jauhar" },
  { id: "KRG", x: 550, y: 250, label: "Korangi" },
  { id: "LYR", x: 500, y: 350, label: "Landhi" },
  { id: "SFT", x: 400, y: 100, label: "Shah Faisal" },
  { id: "MLP", x: 320, y: 80, label: "Malir" },
  { id: "NNZ", x: 280, y: 120, label: "N. Nazimabad" },
  { id: "NAZ", x: 250, y: 180, label: "Nazimabad" },
  { id: "LBR", x: 180, y: 130, label: "Liaquatabad" },
  { id: "PCH", x: 150, y: 250, label: "PECHS" },
  { id: "BHD", x: 220, y: 300, label: "Bahadurabad" },
  { id: "TRQ", x: 280, y: 250, label: "Tariq Road" },
  { id: "KMR", x: 120, y: 180, label: "Kemari" },
  { id: "SIT", x: 160, y: 80, label: "SITE" },
  { id: "OGR", x: 380, y: 200, label: "Orangi" },
  { id: "BNS", x: 420, y: 280, label: "Bin Qasim" },
  { id: "APT", x: 480, y: 120, label: "Airport" },
];

export const KARACHI_EDGES: Edge[] = [
  { from: "CLF", to: "DHA", weight: 8, traffic: "medium", isBlocked: false },
  { from: "CLF", to: "PCH", weight: 6, traffic: "high", isBlocked: false },
  { from: "DHA", to: "PCH", weight: 5, traffic: "medium", isBlocked: false },
  { from: "PCH", to: "SAD", weight: 7, traffic: "high", isBlocked: false },
  { from: "PCH", to: "BHD", weight: 4, traffic: "medium", isBlocked: false },
  { from: "SAD", to: "NAZ", weight: 6, traffic: "high", isBlocked: false },
  { from: "SAD", to: "LBR", weight: 5, traffic: "high", isBlocked: false },
  { from: "SAD", to: "KMR", weight: 8, traffic: "medium", isBlocked: false },
  { from: "NAZ", to: "NNZ", weight: 4, traffic: "medium", isBlocked: false },
  { from: "NAZ", to: "LBR", weight: 3, traffic: "medium", isBlocked: false },
  { from: "NNZ", to: "GLN", weight: 10, traffic: "high", isBlocked: false },
  { from: "GLN", to: "JHR", weight: 8, traffic: "high", isBlocked: false },
  { from: "GLN", to: "SFT", weight: 6, traffic: "medium", isBlocked: false },
  { from: "JHR", to: "KRG", weight: 12, traffic: "high", isBlocked: false },
  { from: "JHR", to: "APT", weight: 7, traffic: "medium", isBlocked: false },
  { from: "KRG", to: "LYR", weight: 6, traffic: "medium", isBlocked: false },
  { from: "KRG", to: "BNS", weight: 8, traffic: "low", isBlocked: false },
  { from: "SFT", to: "MLP", weight: 10, traffic: "medium", isBlocked: false },
  { from: "SFT", to: "APT", weight: 5, traffic: "low", isBlocked: false },
  { from: "MLP", to: "NNZ", weight: 8, traffic: "medium", isBlocked: false },
  { from: "LBR", to: "SIT", weight: 6, traffic: "medium", isBlocked: false },
  { from: "BHD", to: "TRQ", weight: 3, traffic: "high", isBlocked: false },
  { from: "TRQ", to: "GLN", weight: 7, traffic: "high", isBlocked: false },
  { from: "TRQ", to: "OGR", weight: 9, traffic: "medium", isBlocked: false },
  { from: "OGR", to: "JHR", weight: 6, traffic: "medium", isBlocked: false },
  { from: "OGR", to: "BNS", weight: 10, traffic: "low", isBlocked: false },
  { from: "LYR", to: "BNS", weight: 7, traffic: "medium", isBlocked: false },
  { from: "KMR", to: "SIT", weight: 7, traffic: "low", isBlocked: false },
];

export function cloneKarachiNetwork(): {
  nodes: GraphNode[];
  edges: Edge[];
  mapType: MapType;
} {
  return {
    nodes: KARACHI_NODES.map((node) => ({ ...node })),
    edges: KARACHI_EDGES.map((edge) => ({ ...edge })),
    mapType: KARACHI_MAP_TYPE,
  };
}

export function nodeLabel(nodes: GraphNode[], id: string): string {
  return nodes.find((node) => node.id === id)?.label ?? id;
}
