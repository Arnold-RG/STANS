import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import type { Place } from "@/lib/live/nominatim";
import type { Amenity, MapBounds } from "@/lib/live/overpass";
import type { MappedRoute } from "@/lib/live/osrm";
import type { GpsFix } from "@/hooks/useGeolocation";
import type { GraphNode } from "@/types/graph";
import type { LonLat } from "@/lib/live/geo";
import { amenityColor } from "@/lib/live/poi";
import type { MapBase } from "@/lib/live/share";

export type MapLayer = "dark" | "streets" | "sat";

interface LiveMapProps {
  origin: Place | null;
  dest: Place | null;
  via: Place | null;
  gps: GpsFix | null;
  routes: MappedRoute[];
  activeRoute: number;
  nearby: Amenity[];
  graphNodes: GraphNode[];
  graphPath: GraphNode[];
  onMapClick: (point: LonLat) => void;
  onBounds: (bounds: MapBounds) => void;
  base: MapBase;
  onBase: (base: MapBase) => void;
  initialCenter: [number, number];
  initialZoom: number;
  holdView: boolean;
  onView: (view: { center: LonLat; zoom: number }) => void;
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function FitTrip({
  origin,
  dest,
  via,
  route,
  hold,
}: {
  origin: Place | null;
  dest: Place | null;
  via: Place | null;
  route?: MappedRoute;
  hold: boolean;
}) {
  const map = useMap();
  const skipped = useRef(false);
  useEffect(() => {
    if (hold && !skipped.current) {
      skipped.current = true;
      return;
    }
    const still = reducedMotion();
    if (route?.geometry.length) {
      map.fitBounds(route.geometry, { padding: [56, 56], maxZoom: 15, animate: !still });
      return;
    }
    const pts = [origin, via, dest].filter(Boolean) as Place[];
    if (pts.length === 1) {
      map.flyTo([pts[0].lat, pts[0].lon], 14, { duration: still ? 0 : 0.7 });
    } else if (pts.length > 1) {
      map.fitBounds(
        pts.map((p) => [p.lat, p.lon] as [number, number]),
        { padding: [64, 64], maxZoom: 14, animate: !still },
      );
    }
  }, [map, origin, dest, via, route, hold]);
  return null;
}

function MapAssist({ onView }: { onView: (view: { center: LonLat; zoom: number }) => void }) {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    el.tabIndex = 0;
    el.setAttribute("aria-label", "Map. When focused, arrow keys pan and plus or minus zoom.");
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(el);
    const onKey = (event: KeyboardEvent) => {
      if (event.target !== el) return;
      const pan = 120;
      const moves: Record<string, [number, number]> = {
        ArrowUp: [0, -pan],
        ArrowDown: [0, pan],
        ArrowLeft: [-pan, 0],
        ArrowRight: [pan, 0],
      };
      if (moves[event.key]) {
        event.preventDefault();
        map.panBy(moves[event.key]);
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        map.zoomIn();
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        map.zoomOut();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => {
      observer.disconnect();
      el.removeEventListener("keydown", onKey);
    };
  }, [map]);

  useMapEvents({
    moveend() {
      const center = map.getCenter();
      onView({ center: { lon: center.lng, lat: center.lat }, zoom: map.getZoom() });
    },
  });
  return null;
}

const BASE_LABEL: Record<MapBase, string> = {
  night: "Night",
  osm: "Streets",
  sat: "Satellite",
};

function BasemapSwitch({ base, onBase }: { base: MapBase; onBase: (base: MapBase) => void }) {
  const map = useMap();
  return createPortal(
    <div
      className="stans-basemap"
      role="group"
      aria-label="Map style"
      ref={(node) => {
        if (node) (node as HTMLDivElement & { _leaflet_disable_click?: boolean })._leaflet_disable_click = true;
      }}
    >
      {(Object.keys(BASE_LABEL) as MapBase[]).map((id) => (
        <button
          key={id}
          type="button"
          aria-pressed={base === id}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onBase(id);
          }}
        >
          {BASE_LABEL[id]}
        </button>
      ))}
    </div>,
    map.getContainer(),
  );
}

function ClickCatch({ onMapClick, onBounds }: { onMapClick: (p: LonLat) => void; onBounds: (b: MapBounds) => void }) {
  const map = useMapEvents({
    click(event) {
      onMapClick({ lat: event.latlng.lat, lon: event.latlng.lng });
    },
    moveend() {
      const b = map.getBounds();
      onBounds({
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      });
    },
  });
  useEffect(() => {
    const b = map.getBounds();
    onBounds({
      south: b.getSouth(),
      west: b.getWest(),
      north: b.getNorth(),
      east: b.getEast(),
    });
  }, [map, onBounds]);
  return null;
}

function Pin({
  place,
  color,
  label,
}: {
  place: Place;
  color: string;
  label: string;
}) {
  return (
    <CircleMarker
      center={[place.lat, place.lon]}
      radius={8}
      pathOptions={{ color, fillColor: color, fillOpacity: 1, weight: 2 }}
    >
      <Popup>
        <div className="font-mono text-xs">
          <div className="uppercase tracking-wide text-[10px]">{label}</div>
          <div>{place.name}</div>
        </div>
      </Popup>
    </CircleMarker>
  );
}

const LiveMap = ({
  origin,
  dest,
  via,
  gps,
  routes,
  activeRoute,
  nearby,
  graphNodes,
  graphPath,
  onMapClick,
  onBounds,
  base,
  onBase,
  initialCenter,
  initialZoom,
  holdView,
  onView,
}: LiveMapProps) => {
  const primary = routes[activeRoute];
  const graphLine = useMemo(
    () =>
      graphPath
        .filter((n) => n.lat != null && n.lon != null)
        .map((n) => [n.lat as number, n.lon as number] as [number, number]),
    [graphPath],
  );

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      className="h-full w-full"
      zoomControl={false}
      attributionControl
    >
      <ZoomControl position="topright" />
      {base === "night" ? (
        <>
          <TileLayer
            key="night"
            attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer
            attribution=""
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          />
        </>
      ) : null}
      {base === "osm" ? (
        <TileLayer
          key="osm"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      ) : null}
      {base === "sat" ? (
        <TileLayer
          key="sat"
          attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
      ) : null}
      <BasemapSwitch base={base} onBase={onBase} />

      <ClickCatch onMapClick={onMapClick} onBounds={onBounds} />
      <MapAssist onView={onView} />
      <FitTrip origin={origin} dest={dest} via={via} route={primary} hold={holdView} />

      {routes.map((route, index) =>
        index === activeRoute ? null : (
          <Polyline
            key={`alt-${index}`}
            positions={route.geometry}
            pathOptions={{ color: "#6b7c8a", weight: 4, dashArray: "2 10", opacity: 0.75 }}
          />
        ),
      )}
      {primary ? (
        <>
          <Polyline positions={primary.geometry} pathOptions={{ color: "#16140f", weight: 10, opacity: 0.6 }} />
          <Polyline
            className="route-live-pulse"
            positions={primary.geometry}
            pathOptions={{ color: "#d4a017", weight: 4.5, opacity: 0.96 }}
          />
        </>
      ) : null}

      {graphNodes.slice(0, 400).map((node) =>
        node.lat != null && node.lon != null ? (
          <CircleMarker
            key={node.id}
            center={[node.lat, node.lon]}
            radius={2}
            pathOptions={{ color: "#5fd4a4", fillColor: "#5fd4a4", fillOpacity: 0.7, weight: 0 }}
          />
        ) : null,
      )}
      {graphLine.length > 1 ? (
        <Polyline
          className="route-live-pulse"
          positions={graphLine}
          pathOptions={{ color: "#d4a017", weight: 4, opacity: 0.94 }}
        />
      ) : null}

      {nearby.map((item) => (
        <CircleMarker
          key={item.id}
          center={[item.lat, item.lon]}
          radius={5}
          pathOptions={{ color: amenityColor(item.kind), fillColor: amenityColor(item.kind), fillOpacity: 0.9, weight: 1 }}
        >
          <Popup>
            <div className="font-mono text-xs">
              <div className="uppercase tracking-wide text-[10px]">{item.kind}</div>
              <div>{item.name}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {gps ? (
        <CircleMarker
          center={[gps.point.lat, gps.point.lon]}
          radius={9}
          pathOptions={{ color: "#e8f4f8", fillColor: "#3dd6e8", fillOpacity: 1, weight: 2 }}
        >
          <Popup>
            <div className="font-mono text-xs">
              GPS ±{Math.round(gps.accuracyM)} m
            </div>
          </Popup>
        </CircleMarker>
      ) : null}

      {origin ? <Pin place={origin} color="#f0a030" label="From" /> : null}
      {via ? <Pin place={via} color="#5fd4a4" label="Via" /> : null}
      {dest ? <Pin place={dest} color="#ff6b5a" label="To" /> : null}
    </MapContainer>
  );
};

export default LiveMap;
