import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import LiveMap from "@/components/live/LiveMap";
import LiveHeader from "@/components/live/LiveHeader";
import PlaceSearch from "@/components/live/PlaceSearch";
import { useGeolocation } from "@/hooks/useGeolocation";
import { coordPair, formatDuration, formatKm, parseCoordPair, type LonLat } from "@/lib/live/geo";
import { climbFromSamples, fetchElevation, fetchElevations, fetchWeather, type WeatherNow } from "@/lib/live/meteo";
import { placeFromCoord, reverseGeocode, type Place } from "@/lib/live/nominatim";
import { extractHighways, nearbyAmenities, nearestNode, type Amenity, type MapBounds } from "@/lib/live/overpass";
import { fetchRoutes, MODE_LABEL, type MappedRoute, type TravelMode } from "@/lib/live/osrm";
import {
  buildGpx,
  downloadText,
  pushRecentPlace,
  readRecentPlaces,
  readSavedTrips,
  writeSavedTrips,
  type SavedLiveTrip,
} from "@/lib/live/storage";
import { findPath } from "@/utils/pathfinding";
import { kruskalAlgorithm } from "@/utils/kruskal";
import type { GraphNode } from "@/types/graph";
import type { Edge } from "@/utils/kruskal";
import { ScrollArea } from "@/components/ui/scroll-area";

type PickTarget = "from" | "to" | "via";
type DeskTab = "trip" | "nav" | "field" | "graph";

const Dashboard = () => {
  const [params, setParams] = useSearchParams();
  const { fix, error: gpsError, busy: gpsBusy, locate } = useGeolocation();
  const [origin, setOrigin] = useState<Place | null>(null);
  const [dest, setDest] = useState<Place | null>(null);
  const [via, setVia] = useState<Place | null>(null);
  const [mode, setMode] = useState<TravelMode>("driving");
  const [routes, setRoutes] = useState<MappedRoute[]>([]);
  const [activeRoute, setActiveRoute] = useState(0);
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [elevationM, setElevationM] = useState<number | null>(null);
  const [climb, setClimb] = useState<{ gain: number; loss: number; min: number; max: number } | null>(null);
  const [nearby, setNearby] = useState<Amenity[]>([]);
  const [recent, setRecent] = useState<Place[]>(() => readRecentPlaces());
  const [saved, setSaved] = useState<SavedLiveTrip[]>(() => readSavedTrips());
  const [pick, setPick] = useState<PickTarget>("from");
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<DeskTab>("trip");
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const [graphPath, setGraphPath] = useState<GraphNode[]>([]);
  const [mstNote, setMstNote] = useState("");
  const boundsRef = useRef<MapBounds | null>(null);
  const bootstrapped = useRef(false);

  const onBounds = useCallback((bounds: MapBounds) => {
    boundsRef.current = bounds;
  }, []);

  const remember = (place: Place) => {
    setRecent(pushRecentPlace(place));
  };

  const assign = (target: PickTarget, place: Place) => {
    if (target === "from") setOrigin(place);
    if (target === "to") setDest(place);
    if (target === "via") setVia(place);
    remember(place);
    if (target === "from") setPick("to");
  };

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const from = parseCoordPair(params.get("from"));
    const to = parseCoordPair(params.get("to"));
    const waypoint = parseCoordPair(params.get("via"));
    const nextMode = params.get("mode");
    if (nextMode === "driving" || nextMode === "cycling" || nextMode === "walking") {
      setMode(nextMode);
    }
    const load = async () => {
      try {
        if (from) assign("from", await reverseGeocode(from).catch(() => placeFromCoord(from, "From")));
        if (to) assign("to", await reverseGeocode(to).catch(() => placeFromCoord(to, "To")));
        if (waypoint) assign("via", await reverseGeocode(waypoint).catch(() => placeFromCoord(waypoint, "Via")));
      } catch {
        /* keep pins even if nominatim is slow */
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (origin) next.set("from", coordPair(origin));
    if (dest) next.set("to", coordPair(dest));
    if (via) next.set("via", coordPair(via));
    next.set("mode", mode);
    setParams(next, { replace: true });
  }, [origin, dest, via, mode, setParams]);

  useEffect(() => {
    if (!origin || !dest) {
      setRoutes([]);
      setClimb(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setBusy("Routing through OSRM…");
      try {
        const next = await fetchRoutes(origin, dest, mode, via);
        if (cancelled) return;
        setRoutes(next);
        setActiveRoute(0);
      } catch (error) {
        if (!cancelled) {
          setRoutes([]);
          toast.error(error instanceof Error ? error.message : "Routing failed");
        }
      } finally {
        if (!cancelled) setBusy(null);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [origin, dest, via, mode]);

  useEffect(() => {
    const point = dest ?? origin ?? fix?.point;
    if (!point) return;
    let cancelled = false;
    void fetchWeather(point)
      .then((wx) => {
        if (!cancelled) setWeather(wx);
      })
      .catch(() => undefined);
    void fetchElevation(point)
      .then((m) => {
        if (!cancelled) setElevationM(m);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [origin, dest, fix?.point]);

  useEffect(() => {
    const route = routes[activeRoute];
    if (!route?.geometry.length) return;
    const samples = route.geometry.map(([lat, lon]) => ({ lat, lon }));
    let cancelled = false;
    void fetchElevations(samples)
      .then((els) => {
        if (!cancelled && els.length) setClimb(climbFromSamples(els));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [routes, activeRoute]);

  const handleMapClick = async (point: LonLat) => {
    setBusy("Reverse geocoding…");
    try {
      const place = await reverseGeocode(point);
      assign(pick, place);
    } catch {
      assign(pick, placeFromCoord(point, pick === "from" ? "From" : pick === "to" ? "To" : "Via"));
    } finally {
      setBusy(null);
    }
  };

  const useGpsAsFrom = async () => {
    locate();
    if (!fix) return;
    setBusy("Naming GPS fix…");
    try {
      const place = await reverseGeocode(fix.point);
      assign("from", { ...place, name: `GPS · ${place.name}` });
    } catch {
      assign("from", placeFromCoord(fix.point, "GPS fix"));
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    if (!fix || origin || params.get("from")) return;
    void reverseGeocode(fix.point)
      .then((place) => assign("from", { ...place, name: `GPS · ${place.name}` }))
      .catch(() => assign("from", placeFromCoord(fix.point, "GPS fix")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fix?.point.lat, fix?.point.lon]);

  const loadNearby = async () => {
    const point = origin ?? fix?.point;
    if (!point) {
      toast.message("Set a from-point or allow GPS first");
      return;
    }
    setBusy("Overpass nearby…");
    try {
      const items = await nearbyAmenities(point);
      setNearby(items);
      toast.message(`${items.length} mapped amenities`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Overpass failed");
    } finally {
      setBusy(null);
    }
  };

  const extractGraph = async () => {
    const bounds = boundsRef.current;
    if (!bounds) {
      toast.message("Move the map first");
      return;
    }
    const span = Math.abs(bounds.north - bounds.south) * Math.abs(bounds.east - bounds.west);
    if (span > 0.12) {
      toast.message("Zoom in before extracting OSM ways. Wide views choke Overpass.");
      return;
    }
    setBusy("Pulling OSM highways…");
    try {
      const extracted = await extractHighways(bounds);
      setGraph(extracted);
      setGraphPath([]);
      if (!extracted.edges.length) {
        toast.message("No trunk/primary/secondary/tertiary ways in view");
        return;
      }
      if (origin && dest) {
        const start = nearestNode(extracted.nodes, origin);
        const end = nearestNode(extracted.nodes, dest);
        if (start && end) {
          const result = findPath(extracted.nodes, extracted.edges, {}, start.id, end.id, "dijkstra");
          if (result) {
            const byId = new Map(extracted.nodes.map((n) => [n.id, n]));
            setGraphPath(result.path.map((id) => byId.get(id)!).filter(Boolean));
            toast.message(`Dijkstra ${result.minutes.toFixed(0)} min on OSM topology`);
          }
        }
      }
      const steps = kruskalAlgorithm(
        extracted.edges,
        extracted.nodes.map((n) => n.id),
      );
      const last = steps[steps.length - 1];
      setMstNote(
        last
          ? `Kruskal kept ${last.currentMST.length} links · ${last.totalWeight.toFixed(0)} min of OSM travel time`
          : "",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Overpass extract failed");
    } finally {
      setBusy(null);
    }
  };

  const saveTrip = () => {
    if (!origin || !dest) return;
    const next: SavedLiveTrip = {
      id: String(Date.now()),
      label: `${origin.name} → ${dest.name}`,
      from: origin,
      to: dest,
      mode,
      savedAt: new Date().toISOString(),
    };
    const all = [next, ...saved].slice(0, 16);
    setSaved(all);
    writeSavedTrips(all);
    toast.message("Trip kept on this device");
  };

  const shareTrip = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.message("Desk URL copied");
    } catch {
      toast.message(url);
    }
  };

  const exportGpx = () => {
    const route = routes[activeRoute];
    if (!route) return;
    const pts = route.geometry.map(([lat, lon]) => ({ lat, lon }));
    const name = `${origin?.name ?? "from"}-${dest?.name ?? "to"}`;
    downloadText(`stans-${Date.now()}.gpx`, buildGpx(name, pts));
  };

  const swapEnds = () => {
    setOrigin(dest);
    setDest(origin);
  };

  const clearTrip = () => {
    setOrigin(null);
    setDest(null);
    setVia(null);
    setRoutes([]);
    setNearby([]);
    setGraph({ nodes: [], edges: [] });
    setGraphPath([]);
    setClimb(null);
    setPick("from");
  };

  const route = routes[activeRoute];
  const gpsLabel = gpsBusy ? "FIXING" : fix ? `±${Math.round(fix.accuracyM)} m` : gpsError ? "DENIED" : "OFF";
  const weatherLabel = weather ? `${Math.round(weather.temperatureC)}° ${weather.label}` : "—";

  const rail = (
    <div className="space-y-4 pb-8">
      <section className="dashboard-card p-3">
        <p className="stamp mb-2">01 · Place search</p>
        <p className="mb-3 text-xs text-muted-foreground">Nominatim, OpenStreetMap. Click the map to drop pins.</p>
        <div className="mb-2 flex gap-1">
          {(["from", "to", "via"] as PickTarget[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPick(key)}
              className={`stamp h-8 flex-1 border px-2 ${pick === key ? "border-primary text-primary" : "border-border"}`}
            >
              Pick {key}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          <PlaceSearch label="From" value={origin} onSelect={(p) => assign("from", p)} onClear={() => setOrigin(null)} />
          <PlaceSearch label="To" value={dest} onSelect={(p) => assign("to", p)} onClear={() => setDest(null)} />
          <PlaceSearch label="Via (optional)" value={via} onSelect={(p) => assign("via", p)} onClear={() => setVia(null)} />
        </div>
        {recent.length ? (
          <div className="mt-3">
            <p className="stamp mb-1">Recent</p>
            <div className="flex flex-wrap gap-1">
              {recent.slice(0, 6).map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className="stamp border border-border px-2 py-1 hover:border-primary"
                  onClick={() => assign(pick, place)}
                >
                  {place.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="dashboard-card p-3">
        <p className="stamp mb-2">02 · GPS</p>
        <p className="mb-2 text-xs text-muted-foreground">Browser geolocation. No mock coordinates.</p>
        <button type="button" onClick={() => void useGpsAsFrom()} className="h-10 w-full rounded-sm bg-primary font-mono text-xs tracking-wide text-primary-foreground">
          {gpsBusy ? "Waiting on fix…" : "Use my position as From"}
        </button>
        {fix ? (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {fix.point.lat.toFixed(5)}, {fix.point.lon.toFixed(5)} · ±{Math.round(fix.accuracyM)} m
            {fix.speedMs != null && fix.speedMs > 0 ? ` · ${Math.round(fix.speedMs * 3.6)} km/h` : ""}
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">{gpsError ?? "Allow location when the browser asks."}</p>
        )}
      </section>

      <section className="dashboard-card p-3">
        <p className="stamp mb-2">03 · Mode</p>
        <div className="grid grid-cols-3 gap-1">
          {(["driving", "cycling", "walking"] as TravelMode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`h-10 rounded-sm border font-mono text-xs ${
                mode === item ? "border-primary bg-primary/15 text-primary" : "border-border"
              }`}
            >
              {MODE_LABEL[item]}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1">
          <button type="button" onClick={swapEnds} className="h-10 rounded-sm border border-border font-mono text-xs">
            Swap
          </button>
          <button type="button" onClick={clearTrip} className="h-10 rounded-sm border border-border font-mono text-xs">
            Clear
          </button>
        </div>
      </section>
    </div>
  );

  const fieldRail = (
    <div className="space-y-4 pb-8">
      <section className="dashboard-card p-3">
        <p className="stamp mb-2">04 · OSRM trip</p>
        {route ? (
          <>
            <p className="font-mono text-2xl tabular-nums text-primary">{formatDuration(route.durationS)}</p>
            <p className="font-mono text-sm">{formatKm(route.distanceM / 1000)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Public OSRM. Speeds come from OSM tags, not invented congestion.
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Set from and to. The desk asks OSRM; it does not invent a path.</p>
        )}
      </section>

      <section className="dashboard-card p-3">
        <p className="stamp mb-2">05 · Alternates</p>
        {routes.length > 1 ? (
          <div className="space-y-1">
            {routes.map((item, index) => (
              <button
                key={item.summary}
                type="button"
                onClick={() => setActiveRoute(index)}
                className={`block w-full border px-2 py-2 text-left font-mono text-xs ${
                  index === activeRoute ? "border-primary text-primary" : "border-border"
                }`}
              >
                {index === 0 ? "Primary" : `Alt ${index}`} · {item.summary}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">OSRM only returns an alternate when the network has one.</p>
        )}
      </section>

      <section className="dashboard-card p-3">
        <p className="stamp mb-2">06 · Turns</p>
        {route?.steps.length ? (
          <ol className="max-h-52 space-y-1 overflow-auto font-mono text-[11px]">
            {route.steps.slice(0, 40).map((step, index) => (
              <li key={`${step.text}-${index}`} className="border-b border-border/50 py-1">
                <span className="text-muted-foreground">{String(index + 1).padStart(2, "0")} · </span>
                {step.text}
                <span className="text-muted-foreground"> · {formatKm(step.distanceM / 1000)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-muted-foreground">Turn sheet fills after a live route.</p>
        )}
      </section>

      <section className="dashboard-card p-3">
        <p className="stamp mb-2">07 · Weather + height</p>
        {weather ? (
          <div className="font-mono text-sm">
            <div>
              {Math.round(weather.temperatureC)}°C · feels {Math.round(weather.apparentC)}° · {weather.label}
            </div>
            <div className="text-xs text-muted-foreground">
              RH {weather.humidity}% · wind {Math.round(weather.windKmh)} km/h · {weather.timezone}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Open-Meteo, at dest if set, else from/GPS.</p>
        )}
        {elevationM != null ? <p className="mt-2 font-mono text-xs">Ground {Math.round(elevationM)} m</p> : null}
        {climb ? (
          <p className="font-mono text-xs text-muted-foreground">
            Climb +{climb.gain} m / −{climb.loss} m · {climb.min}–{climb.max} m
          </p>
        ) : null}
      </section>

      <section className="dashboard-card p-3">
        <p className="stamp mb-2">08 · Nearby (OSM)</p>
        <button type="button" onClick={() => void loadNearby()} className="mb-2 h-10 w-full rounded-sm border border-border font-mono text-xs">
          Query hospitals, police, fuel
        </button>
        {nearby.length ? (
          <ul className="max-h-40 space-y-1 overflow-auto font-mono text-[11px]">
            {nearby.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="text-left hover:text-primary"
                  onClick={() => assign("to", { id: item.id, name: item.name, detail: item.kind, lat: item.lat, lon: item.lon })}
                >
                  {item.kind} · {item.name}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">Live Overpass query around From/GPS. Nothing is preloaded.</p>
        )}
      </section>

      <section className="dashboard-card p-3">
        <p className="stamp mb-2">09 · OSM graph + Dijkstra</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Pulls real ways in the current view. Weights are length ÷ OSM speed (maxspeed or highway class).
        </p>
        <button type="button" onClick={() => void extractGraph()} className="h-10 w-full rounded-sm border border-border font-mono text-xs">
          Extract highways in view
        </button>
        {graph.nodes.length ? (
          <p className="mt-2 font-mono text-[11px]">
            {graph.nodes.length} nodes · {graph.edges.length} links
            {graphPath.length ? ` · path ${graphPath.length} hops` : ""}
          </p>
        ) : null}
        {mstNote ? <p className="mt-1 font-mono text-[11px] text-muted-foreground">{mstNote}</p> : null}
      </section>

      <section className="dashboard-card p-3">
        <p className="stamp mb-2">10 · Keep / share</p>
        <div className="grid grid-cols-2 gap-1">
          <button type="button" onClick={saveTrip} className="h-10 rounded-sm border border-border font-mono text-xs">
            Save
          </button>
          <button type="button" onClick={() => void shareTrip()} className="h-10 rounded-sm border border-border font-mono text-xs">
            Copy URL
          </button>
          <button type="button" onClick={exportGpx} className="h-10 rounded-sm border border-border font-mono text-xs">
            GPX
          </button>
          <button
            type="button"
            onClick={() => {
              setSaved([]);
              writeSavedTrips([]);
            }}
            className="h-10 rounded-sm border border-border font-mono text-xs"
          >
            Forget
          </button>
        </div>
        {saved.length ? (
          <ul className="mt-2 space-y-1 font-mono text-[11px]">
            {saved.map((trip) => (
              <li key={trip.id}>
                <button
                  type="button"
                  className="text-left hover:text-primary"
                  onClick={() => {
                    setOrigin(trip.from);
                    setDest(trip.to);
                    setMode(trip.mode);
                  }}
                >
                  {trip.label}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Saved only in this browser.</p>
        )}
      </section>
    </div>
  );

  const localHour = new Date().getHours();
  const clockNote =
    localHour < 6 || localHour >= 22
      ? "Night hours on this clock. OSM speeds still apply; we do not scale them."
      : localHour < 10
        ? "Morning peak on this clock. Treat OSRM times as free-flow."
        : localHour < 16
          ? "Midday on this clock."
          : "Evening peak on this clock. OSRM is not a live-camera feed.";

  return (
    <div className="asphalt-desk flex h-[100dvh] flex-col overflow-hidden">
      <LiveHeader
        status={busy ? "WAIT" : route ? "LIVE" : "IDLE"}
        modeLabel={MODE_LABEL[mode]}
        fromLabel={origin?.name ?? "—"}
        toLabel={dest?.name ?? "—"}
        gpsLabel={gpsLabel}
        weatherLabel={weatherLabel}
        asset={Intl.DateTimeFormat().resolvedOptions().timeZone}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-72 shrink-0 overflow-hidden border-r border-border bg-card/90 md:block xl:w-80">
          <ScrollArea className="h-full">
            <div className="p-3">{rail}</div>
          </ScrollArea>
        </aside>

        <main className="relative min-w-0 flex-1">
          <LiveMap
            origin={origin}
            dest={dest}
            via={via}
            gps={fix}
            routes={routes}
            activeRoute={activeRoute}
            nearby={nearby}
            graphNodes={graph.nodes}
            graphPath={graphPath}
            onMapClick={(point) => void handleMapClick(point)}
            onBounds={onBounds}
          />
          <div className="pointer-events-none absolute left-3 top-3 max-w-sm space-y-2">
            <div className="pointer-events-auto border border-border bg-background/90 px-3 py-2">
              <p className="stamp">Desk</p>
              <p className="text-xs text-muted-foreground">{busy ?? clockNote}</p>
            </div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex gap-2 md:hidden">
            {(["trip", "nav", "field", "graph"] as DeskTab[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`h-11 flex-1 rounded-sm border font-mono text-[10px] uppercase ${
                  tab === item ? "border-primary bg-background text-primary" : "border-border bg-background/90"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </main>

        <aside className="hidden w-80 shrink-0 overflow-hidden border-l border-border bg-card/90 lg:block xl:w-96">
          <ScrollArea className="h-full">
            <div className="p-3">{fieldRail}</div>
          </ScrollArea>
        </aside>
      </div>

      <div className="md:hidden">
        {(tab === "trip" || tab === "nav") && (
          <div className="max-h-[42vh] overflow-auto border-t border-border bg-card p-3">{rail}</div>
        )}
        {(tab === "field" || tab === "graph") && (
          <div className="max-h-[42vh] overflow-auto border-t border-border bg-card p-3">{fieldRail}</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
