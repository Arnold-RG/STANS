import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { Edge } from "@/utils/kruskal";
import { nodeLabel, type GraphNode } from "@/data/karachiNetwork";

interface TrafficSimulatorProps {
  isSimulating: boolean;
  isPaused: boolean;
  speed: number;
  nodes: GraphNode[];
  edges: Edge[];
  trafficMultipliers: { [key: string]: number };
  onToggleSimulation: () => void;
  onTogglePause: () => void;
  onSpeedChange: (speed: number) => void;
  onSimulateAccident: (edgeId: string) => void;
  onClearAccidents: () => void;
  onTrafficLevelChange: (edgeId: string, level: number) => void;
  selectedEdge: string | null;
  onToggleBlock: () => void;
}

const edgeId = (edge: Edge) => `${edge.from}-${edge.to}`;

const TrafficSimulator = ({
  isSimulating,
  isPaused,
  speed,
  nodes,
  edges,
  trafficMultipliers,
  onToggleSimulation,
  onTogglePause,
  onSpeedChange,
  onSimulateAccident,
  onClearAccidents,
  selectedEdge,
  onToggleBlock,
}: TrafficSimulatorProps) => {
  const congestedRoads = edges.filter((edge) => {
    const multiplier = trafficMultipliers[edgeId(edge)] || 1;
    return edge.isBlocked || multiplier > 1.5 || edge.traffic === "high";
  });

  return (
    <section className="dashboard-card p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="stamp">Night board</h2>
        <Switch
          checked={isSimulating}
          onCheckedChange={onToggleSimulation}
          aria-label="Run traffic board"
        />
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        {isSimulating
          ? isPaused
            ? "Board paused. Weights hold."
            : "Karachi is running. Weights drift every few seconds."
          : "Board is dark. Turn it on to watch delay move."}
      </p>

      {isSimulating && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-11 rounded-sm"
              onClick={onTogglePause}
            >
              {isPaused ? "Resume" : "Hold"}
            </Button>
            <Button variant="outline" className="h-11 rounded-sm" onClick={onClearAccidents}>
              Clear incidents
            </Button>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="stamp">Clock rate</span>
              <span className="metric-num text-xs">{speed.toFixed(1)}×</span>
            </div>
            <Slider
              value={[speed]}
              onValueChange={([value]) => onSpeedChange(value)}
              min={0.5}
              max={3}
              step={0.5}
            />
          </div>

          {selectedEdge && (
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="destructive"
                className="h-11 w-full rounded-sm"
                onClick={onToggleBlock}
              >
                {edges.find((edge) => `${edge.from}-${edge.to}` === selectedEdge)?.isBlocked
                  ? "Reopen selected link"
                  : "Close selected link"}
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full rounded-sm"
                onClick={() => onSimulateAccident(selectedEdge)}
              >
                Jam selected link
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <h3 className="stamp mb-2">Congested links</h3>
        {congestedRoads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No delayed links on the board.</p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {congestedRoads.map((edge) => {
              const multiplier = trafficMultipliers[edgeId(edge)] || 1;
              const minutes = Math.round(edge.weight * multiplier);
              const state = edge.isBlocked ? "closed" : multiplier > 2 ? "jammed" : "delayed";
              return (
                <li
                  key={edgeId(edge)}
                  className="flex items-center justify-between gap-2 border-b border-border/60 py-1.5 text-sm last:border-0"
                >
                  <span>
                    {nodeLabel(nodes, edge.from)}–{nodeLabel(nodes, edge.to)}
                  </span>
                  <span className="metric-num text-xs text-muted-foreground">
                    {state} · {minutes} min
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

export default TrafficSimulator;
