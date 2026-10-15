import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DeskChrome } from "@/components/live/DeskChrome";
import {
  DESK_TABS,
  PlanPanel,
  PoiPanel,
  RoutePanel,
  WeatherPanel,
  type DeskTab,
  type PickTarget,
} from "@/components/live/DeskPanels";
import LiveMap from "@/components/live/LiveMap";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMinWidth } from "@/hooks/useMediaQuery";
import { usePageTitle } from "@/hooks/usePageTitle";
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

function friendlyApiError(error: unknown, service: string): string {
  const message = error instanceof Error ? error.message : `${service} failed`;
  const status = /\((\d+)\)/.exec(message)?.[1];
  if (status === "429" || status === "503") {
    return `${service} is rate-limiting or overloaded. Wait a few seconds, then try again.`;
  }
  if (status === "502" || status === "504") {
    return `${service} is temporarily unreachable. Retry shortly.`;
  }
  return message;
}

const Dashboard = () => {
  const [params, setParams] = useSearchParams();
  const { fix, error: gpsError, busy: gpsBusy, locate } = useGeolocation();
  const tabletUp = useMinWidth(768);
  const wide = useMinWidth(1280);
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
  const [routeError, setRouteError] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [poiError, setPoiError] = useState<string | null>(null);
  const [tab, setTab] = useState<DeskTab>("search");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const [graphPath, setGraphPath] = useState<GraphNode[]>([]);
  const [mstNote, setMstNote] = useState("");
  const boundsRef = useRef<MapBounds | null>(null);
  const bootstrapped = useRef(false);
  const urlReady = useRef(false);
  const allowAutoGps = useRef(true);

  const onBounds = useCallback((bounds: MapBounds) => {
    boundsRef.current = bounds;
  }, []);

  const assign = useCallback((target: PickTarget, place: Place) => {
    if (target === "from") {
      setOrigin(place);
      setPick("to");
    } else if (target === "to") setDest(place);
    else setVia(place);
    setRecent(pushRecentPlace(place));
  }, []);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

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
        /* keep the pins even if the name lookup is slow */
      } finally {
        urlReady.current = true;
      }
    };
    void load();
  }, [assign, params]);

  useEffect(() => {
    if (!urlReady.current) return;
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
      setRouteError(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setBusy("Asking OSRM for a route…");
      setRouteError(null);
      try {
        const next = await fetchRoutes(origin, dest, mode, via);
        if (cancelled) return;
        setRoutes(next);
        setActiveRoute(0);
      } catch (error) {
        if (!cancelled) {
          setRoutes([]);
          const msg = friendlyApiError(error, "OSRM");
          setRouteError(msg);
          toast.error(msg);
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
    setWeatherError(null);
    void fetchWeather(point)
      .then((wx) => {
        if (!cancelled) setWeather(wx);
      })
      .catch((error) => {
        if (!cancelled) setWeatherError(friendlyApiError(error, "Open-Meteo"));
      });
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
    setBusy("Naming that point…");
    try {
      const place = await reverseGeocode(point);
      assign(pick, place);
    } catch {
      assign(pick, placeFromCoord(point, pick === "from" ? "From" : pick === "to" ? "To" : "Via"));
    } finally {
      setBusy(null);
    }
  };

  const applyGpsAsFrom = async () => {
    allowAutoGps.current = true;
    const next = fix ?? (await locate());
    if (!next) return;
    setBusy("Naming the GPS fix…");
    try {
      const place = await reverseGeocode(next.point);
      assign("from", { ...place, name: `GPS · ${place.name}` });
    } catch {
      assign("from", placeFromCoord(next.point, "GPS fix"));
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    if (!allowAutoGps.current || !fix || origin || params.get("from")) return;
    void reverseGeocode(fix.point)
      .then((place) => assign("from", { ...place, name: `GPS · ${place.name}` }))
      .catch(() => assign("from", placeFromCoord(fix.point, "GPS fix")));
  }, [assign, fix, origin, params]);

  const loadNearby = async () => {
    const point = origin ?? fix?.point;
    if (!point) {
      toast.message("Set a from-point, or allow GPS, first");
      return;
    }
    setBusy("Asking Overpass what is nearby…");
    setPoiError(null);
    try {
      const items = await nearbyAmenities(point);
      setNearby(items);
      toast.message(items.length ? `${items.length} places on the map` : "Nothing mapped nearby");
    } catch (error) {
      const msg = friendlyApiError(error, "Overpass");
      setPoiError(msg);
      toast.error(msg);
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
      toast.message("Zoom in before extracting roads. A wide view is too much for Overpass.");
      return;
    }
    setBusy("Reading highways in this view…");
    setPoiError(null);
    try {
      const extracted = await extractHighways(bounds);
      setGraph(extracted);
      setGraphPath([]);
      if (!extracted.edges.length) {
        toast.message("No trunk, primary, secondary, or tertiary ways in view");
        return;
      }
      if (origin && dest) {
        const start = nearestNode(extracted.nodes, origin);
        const end = nearestNode(extracted.nodes, dest);
        if (start && end) {
          const result = findPath(extracted.nodes, extracted.edges, {}, start.id, end.id, "dijkstra");
          if (result) {
            const byId = new Map(extracted.nodes.map((node) => [node.id, node]));
            setGraphPath(result.path.map((id) => byId.get(id)!).filter(Boolean));
            toast.message(`Dijkstra ${result.minutes.toFixed(0)} min on this street graph`);
          }
        }
      }
      const steps = kruskalAlgorithm(
        extracted.edges,
        extracted.nodes.map((node) => node.id),
      );
      const last = steps[steps.length - 1];
      setMstNote(
        last
          ? `Kruskal kept ${last.currentMST.length} links · ${last.totalWeight.toFixed(0)} min of OSM travel time`
          : "",
      );
    } catch (error) {
      const msg = friendlyApiError(error, "Overpass");
      setPoiError(msg);
      toast.error(msg);
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
    toast.message("Kept on this device");
  };

  const shareTrip = async () => {
    const url = window.location.href;
    const text = origin && dest ? `${origin.name} to ${dest.name}` : "STANS desk";
    if (navigator.share) {
      try {
        await navigator.share({ title: "STANS", text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.message("Link copied");
    } catch {
      toast.message(url);
    }
  };

  const exportGpx = () => {
    const route = routes[activeRoute];
    if (!route) return;
    const pts = route.geometry.map(([lat, lon]) => ({ lat, lon }));
    const name = `${origin?.name ?? "from"} to ${dest?.name ?? "to"}`;
    downloadText(`stans-${Date.now()}.gpx`, buildGpx(name, pts));
  };

  const swapEnds = () => {
    setOrigin(dest);
    setDest(origin);
  };

  const clearTrip = () => {
    allowAutoGps.current = false;
    setOrigin(null);
    setDest(null);
    setVia(null);
    setRoutes([]);
    setNearby([]);
    setGraph({ nodes: [], edges: [] });
    setGraphPath([]);
    setClimb(null);
    setMstNote("");
    setRouteError(null);
    setPoiError(null);
    setPick("from");
  };

  const route = routes[activeRoute];
  usePageTitle(route ? `${formatDuration(route.durationS)} · STANS` : "STANS — live traffic desk");

  const gpsLabel = gpsBusy ? "Fixing" : fix ? `±${Math.round(fix.accuracyM)} m` : gpsError ? "Denied" : "Off";
  const weatherLabel = weather ? `${Math.round(weather.temperatureC)}° ${weather.label}` : "—";
  const feed = busy ? "Waiting" : routeError ? "Error" : route ? "Live" : "Idle";

  const localHour = new Date().getHours();
  const clockNote =
    localHour < 6 || localHour >= 22
      ? "Late on this clock. OpenStreetMap speeds still apply; they are not scaled."
      : localHour < 10
        ? "Morning on this clock. Treat the OSRM time as free-flow, not a camera feed."
        : localHour < 16
          ? "Midday on this clock. The line is a road geometry, not live congestion."
          : "Evening on this clock. OSRM is not watching the traffic.";

  const plan = (
    <PlanPanel
      pick={pick}
      setPick={setPick}
      origin={origin}
      dest={dest}
      via={via}
      assign={assign}
      clearOrigin={() => setOrigin(null)}
      clearDest={() => setDest(null)}
      clearVia={() => setVia(null)}
      recent={recent}
      gpsBusy={gpsBusy}
      gpsError={gpsError}
      fix={fix}
      onGps={() => void applyGpsAsFrom()}
      mode={mode}
      setMode={setMode}
      onSwap={swapEnds}
      onClear={clearTrip}
    />
  );

  const routePanel = (
    <RoutePanel
      route={route}
      routes={routes}
      activeRoute={activeRoute}
      setActiveRoute={setActiveRoute}
      routeError={routeError}
      busy={busy}
    />
  );

  const weatherPanel = (
    <WeatherPanel weather={weather} elevationM={elevationM} climb={climb} weatherError={weatherError} />
  );

  const poiPanel = (
    <PoiPanel
      nearby={nearby}
      onNearby={() => void loadNearby()}
      graphCount={{ nodes: graph.nodes.length, edges: graph.edges.length, hops: graphPath.length }}
      mstNote={mstNote}
      onExtract={() => void extractGraph()}
      canSave={Boolean(origin && dest)}
      canExport={Boolean(route)}
      onSave={saveTrip}
      onShare={() => void shareTrip()}
      onGpx={exportGpx}
      onForget={() => {
        setSaved([]);
        writeSavedTrips([]);
      }}
      saved={saved}
      onOpenSaved={(trip) => {
        setOrigin(trip.from);
        setDest(trip.to);
        setMode(trip.mode);
      }}
      shareLabel={canShare ? "Share" : "Copy link"}
      onAmenity={(item) =>
        assign("to", { id: item.id, name: item.name, detail: item.kind, lat: item.lat, lon: item.lon })
      }
      poiError={poiError}
      busy={busy}
    />
  );

  const tabPanel =
    tab === "search" ? plan : tab === "route" ? routePanel : tab === "weather" ? weatherPanel : poiPanel;

  const chips = [
    ["Feed", feed],
    ["Mode", MODE_LABEL[mode]],
    ["From", origin?.name ?? "—"],
    ["To", dest?.name ?? "—"],
    ["GPS", gpsLabel],
    ["Weather", weatherLabel],
  ] as const;

  const openTab = (next: DeskTab) => {
    if (sheetOpen && tab === next) {
      setSheetOpen(false);
      return;
    }
    setTab(next);
    setSheetOpen(true);
  };

  return (
    <DeskChrome
      section="desk"
      flush
      ticker={
        <ul className="desk-ticker flex min-w-max items-stretch overflow-x-auto" aria-label="Desk status">
          {chips.map(([label, value], index) => (
            <li
              key={label}
              className={`desk-chip desk-status-shimmer mx-1 my-1.5 flex items-center gap-3 ${
                label === "Feed" && feed === "Live" ? "desk-chip-live" : ""
              } ${index ? "" : "ml-3"}`}
            >
              {label === "Feed" ? (
                <span
                  className={`desk-lamp ${feed === "Live" ? "is-live" : feed === "Error" ? "is-warn" : ""}`}
                  aria-hidden
                />
              ) : null}
              <span className="eyebrow">{label}</span>
              <span title={value} className="max-w-[14rem] truncate text-sm text-foreground">
                {value}
              </span>
            </li>
          ))}
        </ul>
      }
    >
      <p className="sr-only" aria-live="polite">
        {busy ??
          routeError ??
          (route ? `${formatDuration(route.durationS)}, ${formatKm(route.distanceM / 1000)}, ${MODE_LABEL[mode]}` : "No route yet")}
      </p>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {tabletUp ? (
          <aside
            aria-label="Plan the trip"
            className="flex h-full min-h-0 w-[min(24rem,40vw)] shrink-0 flex-col border-r border-border bg-card/80 xl:w-[min(26rem,30vw)]"
          >
            {!wide ? (
              <div
                role="tablist"
                aria-label="Desk sections"
                className="grid grid-cols-4 border-b border-border"
                onKeyDown={moveTab(tab, setTab)}
              >
                {DESK_TABS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`rail-tab-${item.id}`}
                    aria-selected={tab === item.id}
                    aria-controls={`rail-panel-${item.id}`}
                    tabIndex={tab === item.id ? 0 : -1}
                    onClick={() => setTab(item.id)}
                    className={`h-12 text-xs sm:text-sm ${
                      tab === item.id
                        ? "text-foreground shadow-[inset_0_-2px_0_hsl(var(--cyan))]"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
            <ScrollArea className="min-h-0 flex-1">
              <div className="p-4 pb-10 xl:p-5">
                {wide ? (
                  plan
                ) : (
                  <div role="tabpanel" id={`rail-panel-${tab}`} aria-labelledby={`rail-tab-${tab}`}>
                    {tabPanel}
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>
        ) : null}

        <main id="desk-map" className="relative min-h-0 min-w-0 flex-1" aria-label="Map">
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
          <div className="pointer-events-none absolute left-3 top-3 z-[450] max-w-[min(24rem,calc(100%-5.5rem))] sm:left-5 sm:top-5">
            <div className="desk-plaque pointer-events-auto px-4 py-3">
              <p className="eyebrow">STANS · On the desk</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                {routeError ?? busy ?? clockNote}
              </p>
            </div>
          </div>
          {route && tabletUp ? (
            <div className="pointer-events-none absolute bottom-5 left-5 z-[450] max-w-xs">
              <div className="desk-plaque desk-rise desk-route-live pointer-events-auto px-4 py-3">
                <p className="eyebrow">{MODE_LABEL[mode]}</p>
                <p className="desk-figure mt-2 text-[clamp(2.2rem,3vw,3.2rem)]">{formatDuration(route.durationS)}</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">{formatKm(route.distanceM / 1000)}</p>
              </div>
            </div>
          ) : null}
        </main>

        {wide ? (
          <aside
            aria-label="Route, weather, and POI"
            className="flex h-full min-h-0 w-[min(28rem,34vw)] shrink-0 flex-col border-l border-border bg-card/80"
          >
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-4 p-5 pb-12">
                {routePanel}
                {weatherPanel}
                {poiPanel}
              </div>
            </ScrollArea>
          </aside>
        ) : null}
      </div>

      {!tabletUp ? (
        <div className="desk-sheet">
          <div className="flex items-stretch gap-2 px-3 py-3">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              aria-expanded={sheetOpen}
              onClick={() => setSheetOpen((open) => !open)}
            >
              <span className="flex items-center gap-2">
                <span className={`desk-lamp ${route ? "is-live" : routeError ? "is-warn" : ""}`} aria-hidden />
                {route ? (
                  <span className="font-display text-[1.7rem] leading-none text-primary">
                    {formatDuration(route.durationS)}
                  </span>
                ) : (
                  <span className="font-display text-2xl leading-none tracking-tight">STANS</span>
                )}
              </span>
              <span className="eyebrow mt-1 block truncate">
                {routeError
                  ? "Routing issue — open Route"
                  : route
                    ? `${formatKm(route.distanceM / 1000)} · ${MODE_LABEL[mode]}`
                    : "Search · Route · Weather · POI"}
              </span>
            </button>
            <button
              type="button"
              className="desk-btn shrink-0"
              aria-expanded={sheetOpen}
              onClick={() => setSheetOpen((open) => !open)}
            >
              {sheetOpen ? "Close" : "Open"}
            </button>
          </div>
          <div
            role="tablist"
            aria-label="Desk sections"
            className="grid grid-cols-4 border-t border-border"
            onKeyDown={moveTab(tab, (next) => openTab(next))}
          >
            {DESK_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`sheet-tab-${item.id}`}
                aria-selected={sheetOpen && tab === item.id}
                aria-controls="sheet-panel"
                tabIndex={!sheetOpen || tab === item.id ? 0 : -1}
                onClick={() => openTab(item.id)}
                className={`h-12 text-xs ${
                  sheetOpen && tab === item.id
                    ? "text-foreground shadow-[inset_0_-2px_0_hsl(var(--cyan))]"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {sheetOpen ? (
            <div
              id="sheet-panel"
              role="tabpanel"
              aria-labelledby={`sheet-tab-${tab}`}
              className="max-h-[min(58vh,34rem)] overflow-auto border-t border-border px-3 py-4"
            >
              {tabPanel}
            </div>
          ) : null}
        </div>
      ) : null}
    </DeskChrome>
  );
};

function moveTab(current: DeskTab, setTab: (tab: DeskTab) => void) {
  return (event: KeyboardEvent<HTMLDivElement>) => {
    const order: DeskTab[] = ["search", "route", "weather", "poi"];
    const index = order.indexOf(current);
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setTab(order[(index + 1) % order.length]);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setTab(order[(index - 1 + order.length) % order.length]);
    }
  };
}

export default Dashboard;
