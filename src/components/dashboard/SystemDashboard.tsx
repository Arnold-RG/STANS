import { useMemo } from "react";
import type { Edge } from "@/utils/kruskal";
import { nodeLabel, type GraphNode } from "@/data/karachiNetwork";

interface SystemDashboardProps {
  nodes: GraphNode[];
  edges: Edge[];
  trafficMultipliers: { [key: string]: number };
  algorithmStatus?: {
    name: string;
    step: string;
    progress: number;
    details?: string[];
  };
}

const edgeId = (edge: Edge) => `${edge.from}-${edge.to}`;

const SystemDashboard = ({
  nodes,
  edges,
  trafficMultipliers,
  algorithmStatus,
}: SystemDashboardProps) => {
  const stats = useMemo(() => {
    const delayed = edges.filter((edge) => {
      const multiplier = trafficMultipliers[edgeId(edge)] || 1;
      return multiplier > 1.5 || edge.traffic === "high";
    });
    const blocked = edges.filter((edge) => edge.isBlocked);
    const congestionRatio = edges.length > 0 ? delayed.length / edges.length : 0;
    const blockedRatio = edges.length > 0 ? blocked.length / edges.length : 0;
    const healthScore = Math.max(0, 100 - congestionRatio * 40 - blockedRatio * 60);

    return {
      intersections: nodes.length,
      roads: edges.length,
      delayed: delayed.length,
      blocked: blocked.length,
      healthScore,
      incidents: [...blocked, ...delayed.filter((edge) => !edge.isBlocked)].slice(0, 8),
    };
  }, [nodes, edges, trafficMultipliers]);

  return (
    <div className="space-y-4">
      <section className="dashboard-card p-3">
        <h2 className="stamp mb-3">Sector load</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <dt className="stamp">Intersections</dt>
            <dd className="metric-num text-xl">{stats.intersections}</dd>
          </div>
          <div>
            <dt className="stamp">Roads</dt>
            <dd className="metric-num text-xl">{stats.roads}</dd>
          </div>
          <div>
            <dt className="stamp">Delayed</dt>
            <dd className="metric-num text-xl text-warning">{stats.delayed}</dd>
          </div>
          <div>
            <dt className="stamp">Blocked</dt>
            <dd className="metric-num text-xl text-destructive">{stats.blocked}</dd>
          </div>
        </dl>
      </section>

      <section className="dashboard-card p-3">
        <div className="mb-2 flex items-end justify-between">
          <h2 className="stamp">Health</h2>
          <span className="metric-num text-lg">{Math.round(stats.healthScore)}</span>
        </div>
        <div
          className="h-2 w-full border border-border bg-muted"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(stats.healthScore)}
          aria-label="Network health"
        >
          <div
            className="h-full bg-primary"
            style={{ width: `${stats.healthScore}%` }}
          />
        </div>
      </section>

      {algorithmStatus && (
        <section className="dashboard-card p-3">
          <h2 className="stamp mb-2">{algorithmStatus.name}</h2>
          <p className="text-sm">{algorithmStatus.step}</p>
          {algorithmStatus.details && algorithmStatus.details.length > 0 && (
            <ul className="mt-2 space-y-1 font-mono text-[11px] text-muted-foreground">
              {algorithmStatus.details.slice(-4).map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="dashboard-card p-3">
        <h2 className="stamp mb-2">Incident feed</h2>
        {stats.incidents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No named incidents on this board.</p>
        ) : (
          <ul className="space-y-2">
            {stats.incidents.map((edge) => {
              const multiplier = trafficMultipliers[edgeId(edge)] || 1;
              const minutes = Math.round(edge.weight * multiplier);
              const state = edge.isBlocked ? "closed" : "delayed";
              return (
                <li key={edgeId(edge)} className="border-b border-border/70 pb-2 last:border-0">
                  <p className="text-sm">
                    {nodeLabel(nodes, edge.from)}–{nodeLabel(nodes, edge.to)} {state}
                  </p>
                  <p className="metric-num text-xs text-muted-foreground">{minutes} min</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="dashboard-card p-3">
        <h2 className="stamp mb-2">Paint</h2>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="h-px w-5 bg-traffic-clear" />
            Clear
          </li>
          <li className="flex items-center gap-2">
            <span className="h-px w-5 bg-warning" />
            Delayed
          </li>
          <li className="flex items-center gap-2">
            <span className="h-px w-5 bg-destructive" />
            Heavy
          </li>
          <li className="flex items-center gap-2">
            <span className="h-px w-5 bg-road" />
            Blocked
          </li>
        </ul>
      </section>
    </div>
  );
};

export default SystemDashboard;
