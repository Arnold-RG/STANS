import { coordPair, parseCoordPair, type LonLat } from "./geo";
import type { TravelMode } from "./osrm";

export type MapBase = "night" | "osm" | "sat";

export interface DeskLinkState {
  from: LonLat | null;
  to: LonLat | null;
  via: LonLat | null;
  mode: TravelMode;
  alt: number;
  center: LonLat | null;
  zoom: number | null;
  base: MapBase | null;
}

const MODES: TravelMode[] = ["driving", "cycling", "walking"];
const BASES: MapBase[] = ["night", "osm", "sat"];

export const DESK_QUERY_KEYS = ["from", "to", "via", "mode", "alt", "base", "c", "z"] as const;

export function parseZoom(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const z = Math.round(n);
  if (Math.abs(n - z) > 0.001) return null;
  if (z < 2 || z > 19) return null;
  return z;
}

export function parseDeskSearch(params: URLSearchParams): DeskLinkState {
  const modeRaw = params.get("mode");
  const baseRaw = params.get("base");
  const altRaw = Number(params.get("alt"));
  return {
    from: parseCoordPair(params.get("from")),
    to: parseCoordPair(params.get("to")),
    via: parseCoordPair(params.get("via")),
    mode: MODES.includes(modeRaw as TravelMode) ? (modeRaw as TravelMode) : "driving",
    alt: Number.isInteger(altRaw) && altRaw >= 0 && altRaw <= 3 ? altRaw : 0,
    center: parseCoordPair(params.get("c")),
    zoom: parseZoom(params.get("z")),
    base: BASES.includes(baseRaw as MapBase) ? (baseRaw as MapBase) : null,
  };
}

export function buildDeskSearch(state: DeskLinkState): URLSearchParams {
  const next = new URLSearchParams();
  if (state.from) next.set("from", coordPair(state.from));
  if (state.to) next.set("to", coordPair(state.to));
  if (state.via) next.set("via", coordPair(state.via));
  next.set("mode", state.mode);
  if (state.alt > 0) next.set("alt", String(state.alt));
  if (state.base) next.set("base", state.base);
  if (state.center) next.set("c", coordPair(state.center));
  if (state.zoom != null) next.set("z", String(state.zoom));
  return next;
}

/** Shared `c` and `z` together own the camera. One of them still lets the route fit. */
export function sharedCameraHolds(state: Pick<DeskLinkState, "center" | "zoom">): boolean {
  return state.center != null && state.zoom != null;
}

export function deskSearchEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  return DESK_QUERY_KEYS.every((key) => (a.get(key) ?? "") === (b.get(key) ?? ""));
}
