import { formatDuration, formatKm, type LonLat } from "./geo";

export type TravelMode = "driving" | "cycling" | "walking";

export interface RouteStep {
  text: string;
  distanceM: number;
  durationS: number;
  name: string;
}

export interface MappedRoute {
  distanceM: number;
  durationS: number;
  geometry: [number, number][];
  steps: RouteStep[];
  summary: string;
}

const OSRM = "https://router.project-osrm.org";

type OsrmManeuver = {
  type?: string;
  modifier?: string;
};

type OsrmStep = {
  name?: string;
  distance: number;
  duration: number;
  maneuver?: OsrmManeuver;
};

type OsrmResponse = {
  code: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: { type: string; coordinates: number[][] };
    legs?: Array<{ steps?: OsrmStep[] }>;
  }>;
};

function stepText(step: OsrmStep): string {
  const name = step.name?.trim() || "unnamed road";
  const type = step.maneuver?.type ?? "turn";
  const modifier = step.maneuver?.modifier;
  if (type === "depart") return `Leave on ${name}`;
  if (type === "arrive") return "Arrive";
  if (type === "roundabout") return `Roundabout onto ${name}`;
  const turn = [modifier, type].filter(Boolean).join(" ");
  return `${turn} · ${name}`;
}

function pack(route: NonNullable<OsrmResponse["routes"]>[number]): MappedRoute {
  const geometry = (route.geometry?.coordinates ?? []).map(
    ([lon, lat]) => [lat, lon] as [number, number],
  );
  const steps = (route.legs ?? [])
    .flatMap((leg) => leg.steps ?? [])
    .map((step) => ({
      text: stepText(step),
      distanceM: step.distance,
      durationS: step.duration,
      name: step.name?.trim() || "unnamed road",
    }));
  return {
    distanceM: route.distance,
    durationS: route.duration,
    geometry,
    steps,
    summary: `${formatKm(route.distance / 1000)} · ${formatDuration(route.duration)}`,
  };
}

export async function fetchRoutes(
  from: LonLat,
  to: LonLat,
  mode: TravelMode,
  via?: LonLat | null,
): Promise<MappedRoute[]> {
  const points = [from, via, to].filter(Boolean) as LonLat[];
  const path = points.map((p) => `${p.lon},${p.lat}`).join(";");
  const url = new URL(`${OSRM}/route/v1/${mode}/${path}`);
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("alternatives", "true");
  url.searchParams.set("steps", "true");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Routing failed (${res.status})`);
  const data = (await res.json()) as OsrmResponse;
  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error(data.message || "No route between those points");
  }
  return data.routes.map(pack);
}

export const MODE_LABEL: Record<TravelMode, string> = {
  driving: "Drive",
  cycling: "Cycle",
  walking: "Walk",
};
