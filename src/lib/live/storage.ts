import type { LonLat } from "./geo";
import type { Place } from "./nominatim";
import type { TravelMode } from "./osrm";

export interface SavedLiveTrip {
  id: string;
  label: string;
  from: Place;
  to: Place;
  mode: TravelMode;
  savedAt: string;
}

const KEY = "stans.liveTrips.v2";
const RECENT_KEY = "stans.recentPlaces.v1";

export function readSavedTrips(): SavedLiveTrip[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedLiveTrip[]) : [];
  } catch {
    return [];
  }
}

export function writeSavedTrips(trips: SavedLiveTrip[]): void {
  localStorage.setItem(KEY, JSON.stringify(trips.slice(0, 16)));
}

export function readRecentPlaces(): Place[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as Place[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentPlace(place: Place): Place[] {
  const next = [place, ...readRecentPlaces().filter((item) => item.id !== place.id)].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

export function buildGpx(name: string, points: LonLat[]): string {
  const trkpts = points
    .map(
      (p) =>
        `    <trkpt lat="${p.lat.toFixed(6)}" lon="${p.lon.toFixed(6)}"></trkpt>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="STANS" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function downloadText(filename: string, body: string, type = "application/gpx+xml"): void {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
