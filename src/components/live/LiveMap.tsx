import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  LayersControl,
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
}

function FitTrip({
  origin,
  dest,
  via,
  route,
}: {
  origin: Place | null;
  dest: Place | null;
  via: Place | null;
  route?: MappedRoute;
}) {
  const map = useMap();
  useEffect(() => {
    if (route?.geometry.length) {
      map.fitBounds(route.geometry, { padding: [48, 48], maxZoom: 15 });
      return;
    }
    const pts = [origin, via, dest].filter(Boolean) as Place[];
    if (pts.length === 1) {
      map.flyTo([pts[0].lat, pts[0].lon], 14, { duration: 0.6 });
    } else if (pts.length > 1) {
      map.fitBounds(
        pts.map((p) => [p.lat, p.lon] as [number, number]),
        { padding: [56, 56], maxZoom: 14 },
      );
    }
  }, [map, origin, dest, via, route]);
  return null;
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
      center={[20, 12]}
      zoom={3}
      className="h-full w-full bg-[#16140f]"
      zoomControl={false}
      attributionControl
    >
      <ZoomControl position="topright" />
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Night streets">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="OpenStreetMap">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution="Tiles &copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <ClickCatch onMapClick={onMapClick} onBounds={onBounds} />
      <FitTrip origin={origin} dest={dest} via={via} route={primary} />

      {routes.map((route, index) =>
        index === activeRoute ? null : (
          <Polyline
            key={`alt-${index}`}
            positions={route.geometry}
            pathOptions={{ color: "#8a8170", weight: 4, dashArray: "8 7", opacity: 0.85 }}
          />
        ),
      )}
      {primary ? (
        <Polyline
          positions={primary.geometry}
          pathOptions={{ color: "#d4a017", weight: 6, opacity: 0.95 }}
        />
      ) : null}

      {graphNodes.slice(0, 400).map((node) =>
        node.lat != null && node.lon != null ? (
          <CircleMarker
            key={node.id}
            center={[node.lat, node.lon]}
            radius={2}
            pathOptions={{ color: "#4d6b3c", fillColor: "#4d6b3c", fillOpacity: 0.7, weight: 0 }}
          />
        ) : null,
      )}
      {graphLine.length > 1 ? (
        <Polyline positions={graphLine} pathOptions={{ color: "#c45c3e", weight: 4, opacity: 0.9 }} />
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
          pathOptions={{ color: "#e6dcc8", fillColor: "#3d7a4a", fillOpacity: 1, weight: 2 }}
        >
          <Popup>
            <div className="font-mono text-xs">
              GPS ±{Math.round(gps.accuracyM)} m
            </div>
          </Popup>
        </CircleMarker>
      ) : null}

      {origin ? <Pin place={origin} color="#d4a017" label="From" /> : null}
      {via ? <Pin place={via} color="#8aa35f" label="Via" /> : null}
      {dest ? <Pin place={dest} color="#c45c3e" label="To" /> : null}
    </MapContainer>
  );
};

function amenityColor(kind: string): string {
  if (kind === "hospital" || kind === "clinic") return "#c45c3e";
  if (kind === "police") return "#6b8cae";
  if (kind === "fire_station") return "#d4782a";
  if (kind === "fuel") return "#d4a017";
  return "#8a8170";
}

export default LiveMap;
