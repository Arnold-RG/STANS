import { haversineKm, type LonLat } from "./geo";
import type { Amenity } from "./overpass";

export const POI_GROUPS = [
  { id: "medical", label: "Hospital", kinds: ["hospital", "clinic"] },
  { id: "police", label: "Police", kinds: ["police"] },
  { id: "fire", label: "Fire", kinds: ["fire_station"] },
  { id: "fuel", label: "Fuel", kinds: ["fuel"] },
] as const;

export type PoiGroupId = (typeof POI_GROUPS)[number]["id"];

export function kindsForGroups(enabled: Partial<Record<PoiGroupId, boolean>>): Set<string> {
  const kinds = new Set<string>();
  for (const group of POI_GROUPS) {
    if (enabled[group.id] === false) continue;
    for (const kind of group.kinds) kinds.add(kind);
  }
  return kinds;
}

export function amenityColor(kind: string): string {
  if (kind === "hospital" || kind === "clinic") return "#ff6b5a";
  if (kind === "police") return "#6ba3d4";
  if (kind === "fire_station") return "#f0a030";
  if (kind === "fuel") return "#3dd6e8";
  return "#7a8794";
}

export function amenityLabel(kind: string): string {
  return kind.replace(/_/g, " ");
}

export function rankAmenities<T extends Amenity>(items: T[], anchor: LonLat | null): Array<T & { distanceKm: number | null }> {
  return items
    .map((item) => ({
      ...item,
      distanceKm: anchor ? haversineKm(anchor, { lat: item.lat, lon: item.lon }) : null,
    }))
    .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
}
