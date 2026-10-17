import { formatDuration, formatKm, type LonLat } from "./geo";
import { createPacer, withTimeout } from "./pace";

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

/** Public demo server. One route calculation at a time, with a short gap. */
const pace = createPacer(1000);

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

export function describeManeuver(step: Pick<OsrmStep, "name" | "maneuver">): string {
  const name = step.name?.trim() || "unnamed road";
  const type = step.maneuver?.type ?? "turn";
  const modifier = step.maneuver?.modifier;
  if (type === "depart") return `Leave on ${name}`;
  if (type === "arrive") return "Arrive";
  if (type === "roundabout" || type === "rotary") return `Roundabout onto ${name}`;
  if (type === "merge") return `Merge onto ${name}`;
  if (type === "fork") return `${modifier ? `${modifier} ` : ""}fork onto ${name}`;
  if (type === "new name" || type === "continue") return `Continue on ${name}`;
  if (type === "end of road") return `At the end of the road, ${modifier ?? "turn"} onto ${name}`;
  const turn = [modifier, type].filter(Boolean).join(" ");
  return `${turn} · ${name}`;
}

/** Named roads in travel order, merging repeated steps on the same street. */
export function corridorLabel(steps: RouteStep[]): string {
  const runs: { name: string; distanceM: number }[] = [];
  for (const step of steps) {
    const name = step.name.trim();
    if (!name || name === "unnamed road") continue;
    const last = runs[runs.length - 1];
    if (last?.name === name) last.distanceM += step.distanceM;
    else runs.push({ name, distanceM: step.distanceM });
  }
  const kept = runs.filter((run) => run.distanceM >= 150);
  const list = (kept.length ? kept : runs).slice(0, 4);
  if (!list.length) return "";
  return list.map((run) => `${run.name} (${formatKm(run.distanceM / 1000)})`).join(" → ");
}

function pack(route: NonNullable<OsrmResponse["routes"]>[number]): MappedRoute {
  const geometry = (route.geometry?.coordinates ?? []).map(
    ([lon, lat]) => [lat, lon] as [number, number],
  );
  const steps = (route.legs ?? [])
    .flatMap((leg) => leg.steps ?? [])
    .map((step) => ({
      text: describeManeuver(step),
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
  signal?: AbortSignal,
): Promise<MappedRoute[]> {
  const points = [from, via, to].filter(Boolean) as LonLat[];
  const path = points.map((p) => `${p.lon},${p.lat}`).join(";");
  const url = new URL(`${OSRM}/route/v1/${mode}/${path}`);
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("alternatives", "true");
  url.searchParams.set("steps", "true");
  const data = await pace(async () => {
    const res = await fetch(url.toString(), { signal: withTimeout(signal, 25000) });
    if (!res.ok) throw new Error(`Routing failed (${res.status})`);
    return (await res.json()) as OsrmResponse;
  }, signal);
  if (data.code === "NoRoute" || !data.routes?.length) {
    throw new Error(data.message || "No route between those points");
  }
  if (data.code !== "Ok") {
    throw new Error(data.message || `Routing failed (${data.code})`);
  }
  return data.routes.map(pack);
}

export const MODE_LABEL: Record<TravelMode, string> = {
  driving: "Drive",
  cycling: "Cycle",
  walking: "Walk",
};
