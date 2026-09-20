import type { LonLat } from "./geo";

export interface Place {
  id: string;
  name: string;
  detail: string;
  lon: number;
  lat: number;
}

const NOMINATIM = "https://nominatim.openstreetmap.org";

function headers(): HeadersInit {
  return {
    Accept: "application/json",
  };
}

type NominatimHit = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
  addresstype?: string;
};

function toPlace(hit: NominatimHit): Place {
  const full = hit.display_name;
  const name = hit.name?.trim() || full.split(",")[0] || "Place";
  return {
    id: String(hit.place_id),
    name,
    detail: full,
    lon: Number(hit.lon),
    lat: Number(hit.lat),
  };
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const url = new URL(`${NOMINATIM}/search`);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "7");
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(`Place search failed (${res.status})`);
  const data = (await res.json()) as NominatimHit[];
  return data.map(toPlace);
}

export async function reverseGeocode(point: LonLat): Promise<Place> {
  const url = new URL(`${NOMINATIM}/reverse`);
  url.searchParams.set("lat", String(point.lat));
  url.searchParams.set("lon", String(point.lon));
  url.searchParams.set("format", "jsonv2");
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(`Reverse geocode failed (${res.status})`);
  const hit = (await res.json()) as NominatimHit & { error?: string };
  if (hit.error) {
    return {
      id: coordId(point),
      name: `${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}`,
      detail: "Unnamed map point",
      ...point,
    };
  }
  return toPlace(hit);
}

export function coordId(point: LonLat): string {
  return `${point.lon.toFixed(5)},${point.lat.toFixed(5)}`;
}

export function placeFromCoord(point: LonLat, name = "Map pin"): Place {
  return {
    id: coordId(point),
    name,
    detail: `${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}`,
    ...point,
  };
}
