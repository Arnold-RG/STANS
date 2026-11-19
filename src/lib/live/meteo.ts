import type { LonLat } from "./geo";

export interface WeatherNow {
  temperatureC: number;
  apparentC: number;
  humidity: number;
  windKmh: number;
  code: number;
  precipitationMm: number;
  label: string;
  timezone: string;
}

export interface ElevationPoint {
  elevationM: number;
}

const WMO: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm, hail",
  99: "Severe hail",
};

export function weatherLabel(code: number): string {
  return WMO[code] ?? `Code ${code}`;
}

export async function fetchWeather(point: LonLat): Promise<WeatherNow> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(point.lat));
  url.searchParams.set("longitude", String(point.lon));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation",
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("wind_speed_unit", "kmh");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Weather failed (${res.status})`);
  const data = await res.json();
  const cur = data.current;
  const code = Number(cur.weather_code);
  return {
    temperatureC: Number(cur.temperature_2m),
    apparentC: Number(cur.apparent_temperature),
    humidity: Number(cur.relative_humidity_2m),
    windKmh: Number(cur.wind_speed_10m),
    code,
    precipitationMm: Number(cur.precipitation),
    label: weatherLabel(code),
    timezone: String(data.timezone ?? "local"),
  };
}

export async function fetchElevation(point: LonLat): Promise<number> {
  const url = new URL("https://api.open-meteo.com/v1/elevation");
  url.searchParams.set("latitude", String(point.lat));
  url.searchParams.set("longitude", String(point.lon));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Elevation failed (${res.status})`);
  const data = await res.json();
  return Number(data.elevation?.[0] ?? 0);
}

export async function fetchElevations(points: LonLat[]): Promise<number[]> {
  if (!points.length) return [];
  const sample = points.length > 40 ? points.filter((_, i) => i % Math.ceil(points.length / 40) === 0) : points;
  const url = new URL("https://api.open-meteo.com/v1/elevation");
  url.searchParams.set("latitude", sample.map((p) => p.lat).join(","));
  url.searchParams.set("longitude", sample.map((p) => p.lon).join(","));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Elevation failed (${res.status})`);
  const data = await res.json();
  return (data.elevation as number[]) ?? [];
}

export function climbFromSamples(elevations: number[]): { gain: number; loss: number; min: number; max: number } {
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < elevations.length; i += 1) {
    const d = elevations[i] - elevations[i - 1];
    if (d > 0) gain += d;
    else loss += -d;
  }
  return {
    gain: Math.round(gain),
    loss: Math.round(loss),
    min: Math.round(Math.min(...elevations)),
    max: Math.round(Math.max(...elevations)),
  };
}
