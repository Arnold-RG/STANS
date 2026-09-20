import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Edge } from "@/utils/kruskal";
import { findAlternatePath, findPath, findPathVia, type PathResult, type Solver } from "@/utils/pathfinding";
import { nodeLabel, type GraphNode } from "@/data/karachiNetwork";
import type { SavedTrip } from "@/data/deskOps";

interface RouteFinderProps {
  nodes: GraphNode[];
  edges: Edge[];
  liveId: string;
  destId: string;
  viaId: string;
  onLiveChange: (id: string) => void;
  onDestChange: (id: string) => void;
  onViaChange: (id: string) => void;
  onRouteCalculated: (path: string[], alternate: string[], minutes?: number) => void;
  trafficMultipliers: { [key: string]: number };
  shiftScale: number;
  onSaveTrip: (trip: Omit<SavedTrip, "id" | "savedAt">) => void;
  registerCompute?: (fn: () => void) => void;
}

const RouteFinder = ({
  nodes,
  edges,
  liveId,
  destId,
  viaId,
  onLiveChange,
  onDestChange,
  onViaChange,
  onRouteCalculated,
  trafficMultipliers,
  shiftScale,
  onSaveTrip,
  registerCompute,
}: RouteFinderProps) => {
  const [solver, setSolver] = useState<Solver>("dijkstra");
  const [primary, setPrimary] = useState<PathResult | null>(null);
  const [compare, setCompare] = useState<PathResult | null>(null);
  const [alternate, setAlternate] = useState<PathResult | null>(null);
  const [watching, setWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");

  const filteredNodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nodes;
    return nodes.filter((node) => node.label.toLowerCase().includes(q) || node.id.toLowerCase().includes(q));
  }, [nodes, query]);

  const runSearch = (silent = false) => {
    if (!liveId || !destId) {
      if (!silent) setError("Pick a live point and a destination, or click two junctions on the map");
      return;
    }
    if (liveId === destId) {
      if (!silent) setError("Live and dest cannot be the same junction");
      return;
    }

    const next = viaId
      ? findPathVia(nodes, edges, trafficMultipliers, liveId, viaId, destId, solver, shiftScale)
      : findPath(nodes, edges, trafficMultipliers, liveId, destId, solver, shiftScale);
    if (!next) {
      setPrimary(null);
      setCompare(null);
      setAlternate(null);
      onRouteCalculated([], []);
      if (!silent) setError("No path with the current closures");
      return;
    }

    const otherSolver: Solver = solver === "dijkstra" ? "astar" : "dijkstra";
    const other = viaId
      ? findPathVia(nodes, edges, trafficMultipliers, liveId, viaId, destId, otherSolver, shiftScale)
      : findPath(nodes, edges, trafficMultipliers, liveId, destId, otherSolver, shiftScale);
    const alt = findAlternatePath(nodes, edges, trafficMultipliers, next, shiftScale);

    setError(null);
    setPrimary(next);
    setCompare(other);
    setAlternate(alt);
    onRouteCalculated(next.path, alt?.path ?? [], next.minutes);
  };

  useEffect(() => {
    registerCompute?.(() => runSearch(false));
  });

  useEffect(() => {
    if (!watching || !liveId || !destId) return;
    runSearch(true);
    // Recut when the board moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watching, trafficMultipliers, edges, liveId, destId, viaId, solver, shiftScale]);

  const copyTrip = async () => {
    if (!primary) return;
    const lines = [
      `STANS trip · ${solver === "astar" ? "A*" : "Dijkstra"}`,
      `${nodeLabel(nodes, liveId)}${viaId ? ` via ${nodeLabel(nodes, viaId)}` : ""} → ${nodeLabel(nodes, destId)}`,
      `${primary.minutes} min · ${primary.hops} hops · ${primary.visited} nodes visited`,
      primary.path.map((id) => nodeLabel(nodes, id)).join(" → "),
    ];
    if (alternate) {
      lines.push(`Alternate ${alternate.minutes} min: ${alternate.path.map((id) => nodeLabel(nodes, id)).join(" → ")}`);
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Clipboard blocked");
    }
  };

  const swapEnds = () => {
    if (!liveId && !destId) return;
    onLiveChange(destId);
    onDestChange(liveId);
  };

  return (
    <section className="dashboard-card p-3">
      <h2 className="stamp mb-3">Find a way through</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Click two junctions on the map: first is live, second is dest. Optional via is a waypoint.
      </p>
      <div className="space-y-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a junction"
          className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm"
          disabled={nodes.length === 0}
        />

        <div className="space-y-1.5">
          <label className="stamp" htmlFor="live-point">
            Live
          </label>
          <Select value={liveId || undefined} onValueChange={onLiveChange} disabled={nodes.length === 0}>
            <SelectTrigger id="live-point" className="h-11 w-full rounded-sm">
              <SelectValue placeholder={nodes.length ? "Current junction" : "No junctions loaded"} />
            </SelectTrigger>
            <SelectContent>
              {filteredNodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="stamp" htmlFor="via-point">
            Via
          </label>
          <Select
            value={viaId || "none"}
            onValueChange={(value) => onViaChange(value === "none" ? "" : value)}
            disabled={nodes.length === 0}
          >
            <SelectTrigger id="via-point" className="h-11 w-full rounded-sm">
              <SelectValue placeholder="Optional waypoint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No waypoint</SelectItem>
              {filteredNodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="stamp" htmlFor="dest-point">
            Dest
          </label>
          <Select value={destId || undefined} onValueChange={onDestChange} disabled={nodes.length === 0}>
            <SelectTrigger id="dest-point" className="h-11 w-full rounded-sm">
              <SelectValue placeholder={nodes.length ? "Where they need to be" : "No junctions loaded"} />
            </SelectTrigger>
            <SelectContent>
              {filteredNodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={solver === "dijkstra" ? "default" : "outline"}
            className="h-11 rounded-sm"
            onClick={() => setSolver("dijkstra")}
          >
            Dijkstra
          </Button>
          <Button
            type="button"
            variant={solver === "astar" ? "default" : "outline"}
            className="h-11 rounded-sm"
            onClick={() => setSolver("astar")}
          >
            A*
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="h-11 rounded-sm" onClick={swapEnds}>
            Swap
          </Button>
          <Button
            type="button"
            variant={watching ? "default" : "outline"}
            className="h-11 rounded-sm"
            onClick={() => setWatching((value) => !value)}
          >
            {watching ? "Watching" : "Watch trip"}
          </Button>
        </div>

        <Button
          onClick={() => runSearch(false)}
          disabled={nodes.length === 0}
          className="h-11 w-full rounded-sm"
        >
          Get Route
        </Button>

        {error && (
          <p className="border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {primary && (
          <div className="space-y-3 border-t border-border pt-3">
            <div className="flex items-end justify-between gap-3">
              <span className="stamp">Travel</span>
              <span className="metric-num text-2xl text-primary">
                {primary.minutes}
                <span className="ml-1 text-xs text-muted-foreground">min</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="border border-border px-2 py-1.5">
                <div className="stamp">Hops</div>
                <div className="metric-num">{primary.hops}</div>
              </div>
              <div className="border border-border px-2 py-1.5">
                <div className="stamp">Visited</div>
                <div className="metric-num">{primary.visited}</div>
              </div>
            </div>

            {compare && (
              <p className="text-xs text-muted-foreground">
                {compare.solver === "astar" ? "A*" : "Dijkstra"} also {compare.minutes} min / {compare.visited}{" "}
                visited
                {compare.path.join(">") === primary.path.join(">") ? " (same path)" : " (different path)"}.
              </p>
            )}

            <ol className="max-h-40 space-y-1 overflow-y-auto">
              {primary.path.slice(0, -1).map((from, index) => {
                const to = primary.path[index + 1];
                return (
                  <li
                    key={`${from}-${to}-${index}`}
                    className="flex items-center justify-between gap-2 border border-border/70 px-2 py-1.5 text-sm"
                  >
                    <span>
                      {nodeLabel(nodes, from)} – {nodeLabel(nodes, to)}
                      {viaId && to === viaId ? " · via" : ""}
                    </span>
                    <span className="metric-num text-xs text-muted-foreground">{index + 1}</span>
                  </li>
                );
              })}
            </ol>

            {alternate && (
              <p className="text-xs text-muted-foreground">
                Alternate {alternate.minutes} min via {alternate.path.map((id) => nodeLabel(nodes, id)).join(" · ")}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" className="h-11 rounded-sm" onClick={copyTrip}>
                {copied ? "Copied" : "Copy trip"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-sm"
                onClick={() =>
                  onSaveTrip({
                    liveId,
                    destId,
                    viaId: viaId || undefined,
                    minutes: primary.minutes,
                    label: `${nodeLabel(nodes, liveId)}${viaId ? ` via ${nodeLabel(nodes, viaId)}` : ""} → ${nodeLabel(nodes, destId)}`,
                  })
                }
              >
                Save trip
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RouteFinder;
