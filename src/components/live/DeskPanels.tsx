import { useState } from "react";
import PlaceSearch from "@/components/live/PlaceSearch";
import type { GpsFix } from "@/hooks/useGeolocation";
import { formatDuration, formatKm, type LonLat } from "@/lib/live/geo";
import type { WeatherNow } from "@/lib/live/meteo";
import type { Place } from "@/lib/live/nominatim";
import type { Amenity } from "@/lib/live/overpass";
import { corridorLabel, MODE_LABEL, type MappedRoute, type TravelMode } from "@/lib/live/osrm";
import { amenityColor, amenityLabel, POI_GROUPS, rankAmenities, type PoiGroupId } from "@/lib/live/poi";
import type { SavedLiveTrip } from "@/lib/live/storage";

export type PickTarget = "from" | "to" | "via";
export type DeskTab = "search" | "route" | "weather" | "poi";

export const DESK_TABS: { id: DeskTab; label: string }[] = [
  { id: "search", label: "Search" },
  { id: "route", label: "Route" },
  { id: "weather", label: "Weather" },
  { id: "poi", label: "POI" },
];

const RATE_NOTE =
  "Nominatim lookups are queued to about one a second. Overpass still wants a tight map before a highway extract.";

interface PlanProps {
  pick: PickTarget;
  setPick: (target: PickTarget) => void;
  origin: Place | null;
  dest: Place | null;
  via: Place | null;
  assign: (target: PickTarget, place: Place) => void;
  clearOrigin: () => void;
  clearDest: () => void;
  clearVia: () => void;
  recent: Place[];
  gpsBusy: boolean;
  gpsError: string | null;
  fix: GpsFix | null;
  onGps: () => void;
  mode: TravelMode;
  setMode: (mode: TravelMode) => void;
  onSwap: () => void;
  onClear: () => void;
  searchError?: string | null;
}

export function PlanPanel({
  pick,
  setPick,
  origin,
  dest,
  via,
  assign,
  clearOrigin,
  clearDest,
  clearVia,
  recent,
  gpsBusy,
  gpsError,
  fix,
  onGps,
  mode,
  setMode,
  onSwap,
  onClear,
  searchError,
}: PlanProps) {
  return (
    <div className="space-y-4">
      <section className="desk-panel desk-panel-section pl-4">
        <p className="eyebrow">Search</p>
        <h2 className="desk-title mt-2">Where</h2>
        <p className="desk-lede">Nominatim on OpenStreetMap. Choose a pin target, search, or tap the map.</p>
        <p className="desk-rate mt-3">{RATE_NOTE}</p>
        {searchError ? <p className="desk-error mt-3" role="alert">{searchError}</p> : null}
        <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label="Pin to set">
          {(["from", "to", "via"] as PickTarget[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={pick === key}
              onClick={() => setPick(key)}
              className="desk-btn capitalize"
            >
              {key}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-4">
          <PlaceSearch label="From" value={origin} onSelect={(place) => assign("from", place)} onClear={clearOrigin} />
          <PlaceSearch label="To" value={dest} onSelect={(place) => assign("to", place)} onClear={clearDest} />
          <PlaceSearch label="Via, if you need one" value={via} onSelect={(place) => assign("via", place)} onClear={clearVia} />
        </div>
        {recent.length ? (
          <div className="mt-4">
            <p className="eyebrow mb-2">Recent</p>
            <div className="flex flex-wrap gap-2">
              {recent.slice(0, 6).map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className="desk-btn max-w-full truncate"
                  onClick={() => assign(pick, place)}
                >
                  {place.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="desk-panel desk-panel-section pl-4">
        <p className="eyebrow">GPS</p>
        <h2 className="desk-title mt-2">Your position</h2>
        <p className="desk-lede">The browser’s own fix. No stand-in coordinates.</p>
        <button type="button" onClick={onGps} className="desk-btn desk-btn-solid mt-4">
          {gpsBusy ? "Waiting on a fix…" : "Use my position as From"}
        </button>
        {fix ? (
          <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
            {fix.point.lat.toFixed(5)}, {fix.point.lon.toFixed(5)} · ±{Math.round(fix.accuracyM)} m
            {fix.speedMs != null && fix.speedMs > 0 ? ` · ${Math.round(fix.speedMs * 3.6)} km/h` : ""}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">{gpsError ?? "Allow location when the browser asks."}</p>
        )}
      </section>

      <section className="desk-panel desk-panel-section pl-4">
        <p className="eyebrow">Mode</p>
        <h2 id="mode-heading" className="desk-title mt-2">
          How you’ll go
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-labelledby="mode-heading">
          {(["driving", "cycling", "walking"] as TravelMode[]).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={mode === item}
              onClick={() => setMode(item)}
              className="desk-btn"
            >
              {MODE_LABEL[item]}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" onClick={onSwap} className="desk-btn">
            Swap ends
          </button>
          <button type="button" onClick={onClear} className="desk-btn">
            Clear trip
          </button>
        </div>
      </section>
    </div>
  );
}

interface RouteProps {
  route: MappedRoute | undefined;
  routes: MappedRoute[];
  activeRoute: number;
  setActiveRoute: (index: number) => void;
  routeError?: string | null;
  busy?: string | null;
  onRetry?: () => void;
}

export function RoutePanel({ route, routes, activeRoute, setActiveRoute, routeError, busy, onRetry }: RouteProps) {
  const [showAllTurns, setShowAllTurns] = useState(false);
  const corridor = route ? corridorLabel(route.steps) : "";
  const turns = route ? (showAllTurns ? route.steps : route.steps.slice(0, 8)) : [];
  return (
    <div className="space-y-4">
      <section className="desk-panel desk-panel-section pl-4" aria-busy={Boolean(busy) && !route}>
        <p className="eyebrow">Route</p>
        <h2 className="desk-title mt-2">The journey</h2>
        {routeError ? (
          <div className="mt-3 space-y-2">
            <p className="desk-error" role="alert">{routeError}</p>
            {onRetry ? (
              <button type="button" className="desk-btn" onClick={onRetry}>
                Try the route again
              </button>
            ) : null}
          </div>
        ) : null}
        {busy && !route ? <p className="desk-lede mt-3 text-primary">{busy}</p> : null}
        {route ? (
          <div className="desk-rise mt-5">
            <p className="desk-figure">{formatDuration(route.durationS)}</p>
            <p className="mt-3 font-mono text-sm text-foreground">{formatKm(route.distanceM / 1000)}</p>
            {corridor ? <p className="mt-3 text-sm leading-relaxed text-foreground/90">{corridor}</p> : null}
            <p className="desk-lede">Public OSRM. Pace from OpenStreetMap tags — not a guessed jam.</p>
          </div>
        ) : (
          !routeError &&
          !busy && <p className="desk-lede">Name a from and a to. The desk asks OSRM, and it will not invent a path.</p>
        )}
        <p className="desk-rate mt-3">OSRM’s public demo has fair-use limits. A failed route can be tried again.</p>
      </section>

      <section className="desk-panel desk-panel-section pl-4">
        <p className="eyebrow">Alternates</p>
        <h2 className="desk-title mt-2">Another way</h2>
        {routes.length > 1 ? (
          <div className="mt-4 space-y-2">
            {routes.map((item, index) => (
              <button
                key={`${item.summary}-${index}`}
                type="button"
                aria-pressed={index === activeRoute}
                onClick={() => setActiveRoute(index)}
                className={`desk-route-card font-mono text-xs ${index === activeRoute ? "desk-route-live" : ""}`}
              >
                <span className="eyebrow block text-[0.65rem]">
                  {index === 0 ? "Primary" : `Alternate ${index}`}
                </span>
                <span className="mt-1 block text-foreground">{item.summary}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="desk-lede">An alternate appears only when the road network has one.</p>
        )}
      </section>

      <section className="desk-panel desk-panel-section pl-4">
        <p className="eyebrow">Turns</p>
        <h2 className="desk-title mt-2">Turn sheet</h2>
        {turns.length ? (
          <ol className="mt-4 max-h-80 space-y-0 overflow-auto">
            {turns.map((step, index) => (
              <li key={`${step.text}-${index}`} className="flex gap-3 border-b border-border/60 py-2.5 text-sm leading-snug">
                <span className="w-7 shrink-0 font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
                <span>
                  {step.text}
                  <span className="text-muted-foreground"> · {formatKm(step.distanceM / 1000)}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="desk-lede">The turn sheet fills in after a live route.</p>
        )}
        {route && route.steps.length > 8 ? (
          <button type="button" className="desk-btn mt-3 w-full" aria-expanded={showAllTurns} onClick={() => setShowAllTurns((open) => !open)}>
            {showAllTurns ? "Show the short list" : `Show all ${route.steps.length} turns`}
          </button>
        ) : null}
      </section>
    </div>
  );
}

export type WeatherState = "idle" | "loading" | "ready" | "error";

interface WeatherPanelProps {
  weather: WeatherNow | null;
  elevationM: number | null;
  climb: { gain: number; loss: number; min: number; max: number } | null;
  weatherError?: string | null;
  weatherState?: WeatherState;
  onRetry?: () => void;
}

export function WeatherPanel({ weather, elevationM, climb, weatherError, weatherState = "idle", onRetry }: WeatherPanelProps) {
  return (
    <div className="space-y-4">
      <section className="desk-panel desk-panel-section pl-4" aria-busy={weatherState === "loading"}>
        <p className="eyebrow">Weather</p>
        <h2 className="desk-title mt-2">Air & height</h2>
        {weatherError ? (
          <div className="mt-3 space-y-2">
            <p className="desk-error" role="alert">{weatherError}</p>
            {onRetry ? (
              <button type="button" className="desk-btn" onClick={onRetry}>
                Read the weather again
              </button>
            ) : null}
          </div>
        ) : null}
        {weatherState === "loading" && !weather ? <p className="desk-lede mt-3 text-primary">Reading Open-Meteo…</p> : null}
        {weather ? (
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <dt className="eyebrow">Air</dt>
              <dd className="mt-1 text-lg tabular-nums">{Math.round(weather.temperatureC)}°</dd>
            </div>
            <div>
              <dt className="eyebrow">Feels</dt>
              <dd className="mt-1 text-lg tabular-nums">{Math.round(weather.apparentC)}°</dd>
            </div>
            <div>
              <dt className="eyebrow">Sky</dt>
              <dd className="mt-1 text-sm">{weather.label}</dd>
            </div>
            <div>
              <dt className="eyebrow">Wind</dt>
              <dd className="mt-1 text-sm tabular-nums">{Math.round(weather.windKmh)} km/h</dd>
            </div>
            <div>
              <dt className="eyebrow">Humidity</dt>
              <dd className="mt-1 text-sm tabular-nums">{weather.humidity}%</dd>
            </div>
            <div>
              <dt className="eyebrow">Zone</dt>
              <dd className="mt-1 truncate text-sm">{weather.timezone}</dd>
            </div>
          </dl>
        ) : (
          !weatherError &&
          weatherState !== "loading" && (
            <p className="desk-lede">Open-Meteo at the destination if you have one, otherwise from or GPS.</p>
          )
        )}
        {elevationM != null ? <p className="mt-4 font-mono text-xs">Ground {Math.round(elevationM)} m</p> : null}
        {climb ? (
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Climb +{climb.gain} m / −{climb.loss} m · {climb.min}–{climb.max} m
          </p>
        ) : null}
      </section>
    </div>
  );
}

interface PoiPanelProps {
  nearby: Amenity[];
  onNearby: () => void;
  graphCount: { nodes: number; edges: number; hops: number };
  mstNote: string;
  onExtract: () => void;
  canSave: boolean;
  canExport: boolean;
  onSave: () => void;
  onShare: () => void;
  onGpx: () => void;
  onForget: () => void;
  saved: SavedLiveTrip[];
  onOpenSaved: (trip: SavedLiveTrip) => void;
  shareLabel: string;
  onAmenity: (item: Amenity) => void;
  poiError?: string | null;
  busy?: string | null;
  poiState?: "idle" | "loading" | "ready" | "empty" | "error";
  nearbyTotal?: number;
  anchor?: LonLat | null;
  poiOn: Partial<Record<PoiGroupId, boolean>>;
  onTogglePoi: (id: PoiGroupId) => void;
  onRetry?: () => void;
}

export function PoiPanel({
  nearby,
  onNearby,
  graphCount,
  mstNote,
  onExtract,
  canSave,
  canExport,
  onSave,
  onShare,
  onGpx,
  onForget,
  saved,
  onOpenSaved,
  shareLabel,
  onAmenity,
  poiError,
  busy,
  poiState = "idle",
  nearbyTotal = 0,
  anchor = null,
  poiOn,
  onTogglePoi,
  onRetry,
}: PoiPanelProps) {
  const [armForget, setArmForget] = useState(false);

  return (
    <div className="space-y-4">
      <section className="desk-panel desk-panel-section pl-4">
        <p className="eyebrow">POI</p>
        <h2 className="desk-title mt-2">Nearby help</h2>
        <p className="desk-lede">Hospitals, police, fire, fuel — live Overpass around From or GPS.</p>
        <p className="desk-rate mt-3">Overpass can throttle heavy queries. Zoom in before extracting highways.</p>
        {poiError ? (
          <div className="mt-3 space-y-2">
            <p className="desk-error" role="alert">{poiError}</p>
            {onRetry ? (
              <button type="button" className="desk-btn" onClick={onRetry}>
                Ask Overpass again
              </button>
            ) : null}
          </div>
        ) : null}
        {busy ? <p className="mt-3 text-sm text-primary">{busy}</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Place categories">
          {POI_GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              aria-pressed={poiOn[group.id] !== false}
              onClick={() => onTogglePoi(group.id)}
              className="desk-btn justify-start gap-2"
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: amenityColor(group.kinds[0]) }} aria-hidden />
              {group.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={onNearby} className="desk-btn mt-4 w-full">
          Look around this point
        </button>
        <PoiList
          nearby={nearby}
          nearbyTotal={nearbyTotal}
          poiState={poiState}
          anchor={anchor}
          onAmenity={onAmenity}
        />
      </section>

      <section className="desk-panel desk-panel-section pl-4">
        <p className="eyebrow">Graph</p>
        <h2 className="desk-title mt-2">Roads in view</h2>
        <p className="desk-lede">
          Real ways from the current frame. Weight is length divided by OSM speed (maxspeed or highway class).
        </p>
        <button type="button" onClick={onExtract} className="desk-btn mt-4 w-full">
          Extract highways
        </button>
        {graphCount.nodes ? (
          <p className="mt-3 font-mono text-xs">
            {graphCount.nodes} nodes · {graphCount.edges} links
            {graphCount.hops ? ` · path ${graphCount.hops} hops` : ""}
          </p>
        ) : null}
        {mstNote ? <p className="mt-2 text-sm text-muted-foreground">{mstNote}</p> : null}
      </section>

      <section className="desk-panel desk-panel-section pl-4">
        <p className="eyebrow">Local</p>
        <h2 className="desk-title mt-2">Keep it here</h2>
        <p className="desk-lede">Saved only in this browser. Nothing is sent to an account.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onSave} className="desk-btn" disabled={!canSave}>
            Save trip
          </button>
          <button type="button" onClick={onShare} className="desk-btn">
            {shareLabel}
          </button>
          <button type="button" onClick={onGpx} className="desk-btn" disabled={!canExport}>
            Export GPX
          </button>
          <button
            type="button"
            className="desk-btn"
            onClick={() => {
              if (!armForget) {
                setArmForget(true);
                return;
              }
              onForget();
              setArmForget(false);
            }}
          >
            {armForget ? "Confirm forget" : "Forget saved"}
          </button>
        </div>
        {saved.length ? (
          <ul className="mt-4 space-y-1">
            {saved.map((trip) => (
              <li key={trip.id}>
                <button type="button" className="w-full truncate py-1 text-left text-sm hover:text-primary" onClick={() => onOpenSaved(trip)}>
                  {trip.label}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No trips kept on this device yet.</p>
        )}
      </section>
    </div>
  );
}

function PoiList({
  nearby,
  nearbyTotal,
  poiState,
  anchor,
  onAmenity,
}: {
  nearby: Amenity[];
  nearbyTotal: number;
  poiState: "idle" | "loading" | "ready" | "empty" | "error";
  anchor: LonLat | null;
  onAmenity: (item: Amenity) => void;
}) {
  if (poiState === "loading" && !nearbyTotal) {
    return <p className="desk-lede mt-3 text-primary">Asking Overpass what is nearby…</p>;
  }
  if (poiState === "idle") {
    return <p className="desk-lede">Nothing loaded yet. Look around From, or the GPS fix if you have one.</p>;
  }
  if (poiState === "empty") {
    return <p className="desk-lede">Overpass returned no hospitals, police, fire stations, or fuel in this radius.</p>;
  }
  if (!nearby.length && nearbyTotal > 0) {
    return <p className="desk-lede">Nothing in the categories left on. Turn another one back on.</p>;
  }
  if (!nearby.length) return null;
  const ranked = rankAmenities(nearby, anchor);
  return (
    <ul className="mt-3 max-h-56 space-y-1 overflow-auto">
      {ranked.map((item) => (
        <li key={item.id}>
          <button type="button" className="flex w-full items-baseline justify-between gap-3 py-1 text-left text-sm hover:text-primary" onClick={() => onAmenity(item)}>
            <span className="min-w-0">
              <span className="eyebrow mr-2">{amenityLabel(item.kind)}</span>
              <span className="text-foreground">{item.name}</span>
            </span>
            {item.distanceKm != null ? (
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{formatKm(item.distanceKm)}</span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** @deprecated Prefer WeatherPanel + PoiPanel; kept for any leftover imports */
export function FieldPanel(props: WeatherPanelProps & PoiPanelProps) {
  return (
    <div className="space-y-4">
      <WeatherPanel {...props} />
      <PoiPanel {...props} />
    </div>
  );
}
