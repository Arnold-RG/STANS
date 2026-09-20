import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dijkstraAlgorithm } from "@/utils/dijkstra";
import type { Edge } from "@/utils/kruskal";
import { nodeLabel, type GraphNode } from "@/data/karachiNetwork";

interface RouteFinderProps {
  nodes: GraphNode[];
  edges: Edge[];
  onRouteCalculated: (path: string[]) => void;
  trafficMultipliers: { [key: string]: number };
}

interface RouteStep {
  from: string;
  to: string;
  minutes: number;
  traffic: string;
}

const RouteFinder = ({
  nodes,
  edges,
  onRouteCalculated,
  trafficMultipliers,
}: RouteFinderProps) => {
  const [startLocation, setStartLocation] = useState<string>("");
  const [endLocation, setEndLocation] = useState<string>("");
  const [route, setRoute] = useState<{
    path: string[];
    totalTime: number;
    steps: RouteStep[];
    closuresAvoided: number;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRoute = () => {
    if (!startLocation || !endLocation) {
      setError("Pick a live point and a destination");
      return;
    }

    if (startLocation === endLocation) {
      setError("Live and dest cannot be the same junction");
      return;
    }

    setIsCalculating(true);
    setError(null);

    window.setTimeout(() => {
      const nodeIds = nodes.map((n) => n.id);
      const steps = dijkstraAlgorithm(edges, nodeIds, startLocation, endLocation);
      const lastStep = steps[steps.length - 1];

      if (!lastStep || !lastStep.shortestPath || lastStep.shortestPath.length === 0) {
        setError("No path with the current closures");
        setRoute(null);
        setIsCalculating(false);
        return;
      }

      const path = lastStep.shortestPath;
      const totalTime = lastStep.distances.get(endLocation) || 0;
      const routeSteps: RouteStep[] = [];

      for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];
        const edge = edges.find(
          (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
        );
        if (edge) {
          const key = `${edge.from}-${edge.to}`;
          const multiplier = trafficMultipliers[key] || 1;
          routeSteps.push({
            from,
            to,
            minutes: Math.round(edge.weight * multiplier),
            traffic: edge.traffic,
          });
        }
      }

      const closuresAvoided = edges.filter((edge) => edge.isBlocked).length;

      setRoute({ path, totalTime, steps: routeSteps, closuresAvoided });
      onRouteCalculated(path);
      setIsCalculating(false);
    }, 280);
  };

  const trafficWord = (traffic: string) => {
    if (traffic === "low") return "clear";
    if (traffic === "medium") return "slow";
    if (traffic === "high") return "heavy";
    return traffic;
  };

  return (
    <section className="dashboard-card p-3">
      <h2 className="stamp mb-3">Find a way through</h2>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="stamp" htmlFor="live-point">
            Live
          </label>
          <Select value={startLocation} onValueChange={setStartLocation}>
            <SelectTrigger id="live-point" className="h-11 w-full rounded-sm">
              <SelectValue placeholder="Current junction" />
            </SelectTrigger>
            <SelectContent>
              {nodes.map((node) => (
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
          <Select value={endLocation} onValueChange={setEndLocation}>
            <SelectTrigger id="dest-point" className="h-11 w-full rounded-sm">
              <SelectValue placeholder="Where they need to be" />
            </SelectTrigger>
            <SelectContent>
              {nodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={calculateRoute}
          disabled={isCalculating || nodes.length === 0}
          className="h-11 w-full rounded-sm"
        >
          {isCalculating ? "Working the graph…" : "Get Route"}
        </Button>

        {error && (
          <p className="border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {route && (
          <div className="space-y-3 border-t border-border pt-3">
            <div className="flex items-end justify-between gap-3">
              <span className="stamp">Travel</span>
              <span className="metric-num text-2xl text-primary">
                {route.totalTime}
                <span className="ml-1 text-xs text-muted-foreground">min</span>
              </span>
            </div>
            <div className="flex items-end justify-between gap-3">
              <span className="stamp">Closures avoided</span>
              <span className="metric-num text-sm">{route.closuresAvoided}</span>
            </div>
            <ol className="max-h-40 space-y-1 overflow-y-auto">
              {route.steps.map((step, index) => (
                <li
                  key={`${step.from}-${step.to}-${index}`}
                  className="flex items-center justify-between gap-2 border border-border/70 px-2 py-1.5 text-sm"
                >
                  <span>
                    {nodeLabel(nodes, step.from)} – {nodeLabel(nodes, step.to)}
                  </span>
                  <span className="metric-num text-xs text-muted-foreground">
                    {step.minutes} min · {trafficWord(step.traffic)}
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-[11px] text-muted-foreground">
              Dijkstra, using current closures and delay weights.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default RouteFinder;
