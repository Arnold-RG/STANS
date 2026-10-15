export type LonLat = { lon: number; lat: number };

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(a: LonLat, b: LonLat): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours && minutes) return `${hours} h ${minutes} min`;
  if (hours) return `${hours} h`;
  if (total < 60) return `${total} s`;
  return `${Math.max(1, minutes)} min`;
}

export function parseCoordPair(value: string | null): LonLat | null {
  if (!value) return null;
  const parts = value.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  const [lon, lat] = parts;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lon, lat };
}

export function coordPair(point: LonLat): string {
  return `${point.lon.toFixed(5)},${point.lat.toFixed(5)}`;
}
