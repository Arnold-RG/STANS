import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Edge } from "@/utils/kruskal";
import { nodeLabel, type GraphNode } from "@/data/karachiNetwork";
import {
  SHIFTS,
  SHIFT_ORDER,
  type DeskOperator,
  type DispatchEntry,
  type FieldUnit,
  type SavedTrip,
  type ShiftId,
  type UnitStatus,
} from "@/data/deskOps";
import { congestionHeat, heatBand, liveMinutes, networkComponents } from "@/utils/networkOps";

const edgeId = (edge: Edge) => `${edge.from}-${edge.to}`;

export const StatusWall = ({
  heat,
  closed,
  isolated,
  eta,
  operator,
}: {
  heat: number;
  closed: number;
  isolated: number;
  eta?: number;
  operator: string;
}) => {
  const cells = [
    ["HEAT", `${String(heat).padStart(2, "0")} ${heatBand(heat)}`],
    ["CLOSED", String(closed).padStart(2, "0")],
    ["ISOLATED", String(isolated).padStart(2, "0")],
    ["ETA", eta != null ? `${eta} MIN` : "—"],
    ["OP", operator || "UNSIGNED"],
  ] as const;

  return (
    <div className="status-wall hidden border-b border-border md:grid">
      {cells.map(([label, value]) => (
        <div key={label} className="flex min-w-0 items-baseline justify-between gap-3 px-3 py-2">
          <span className="stamp">{label}</span>
          <span className="truncate font-mono text-[11px] tracking-wide text-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
};

export const ShiftControl = ({
  shiftId,
  onChange,
}: {
  shiftId: ShiftId;
  onChange: (id: ShiftId) => void;
}) => {
  const shift = SHIFTS[shiftId];
  return (
    <section className="dashboard-card p-3">
      <div className="mb-2 flex items-end justify-between">
        <h2 className="stamp">01 · Shift profile</h2>
        <span className="metric-num text-xs">{shift.scale.toFixed(2)}×</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {SHIFT_ORDER.map((id) => (
          <Button
            key={id}
            type="button"
            variant={shiftId === id ? "default" : "outline"}
            className="h-10 rounded-sm px-2 font-mono text-[10px] uppercase tracking-wide"
            onClick={() => onChange(id)}
          >
            {SHIFTS[id].label}
          </Button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {shift.window} · {shift.note}
      </p>
    </section>
  );
};

export const HeatIndex = ({
  edges,
  multipliers,
}: {
  edges: Edge[];
  multipliers: Record<string, number>;
}) => {
  const score = congestionHeat(edges, multipliers);
  const band = heatBand(score);
  return (
    <section className="dashboard-card p-3">
      <div className="mb-2 flex items-end justify-between">
        <h2 className="stamp">02 · Heat index</h2>
        <span className="metric-num text-lg">{score}</span>
      </div>
      <div className="heat-track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label="Congestion heat">
        <div className={`heat-fill heat-${band.toLowerCase()}`} style={{ width: `${score}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {edges.length === 0 ? "No links on the board." : `${band} corridor pressure from delay and closures.`}
      </p>
    </section>
  );
};

export const DispatchLog = ({
  entries,
  onClear,
}: {
  entries: DispatchEntry[];
  onClear: () => void;
}) => (
  <section className="dashboard-card p-3">
    <div className="mb-2 flex items-center justify-between">
      <h2 className="stamp">03 · Dispatch log</h2>
      <button type="button" className="stamp tap-target text-muted-foreground hover:text-foreground" onClick={onClear}>
        Clear
      </button>
    </div>
    {entries.length === 0 ? (
      <p className="text-sm text-muted-foreground">No desk events.</p>
    ) : (
      <ol className="max-h-48 space-y-2 overflow-y-auto">
        {entries.slice(0, 24).map((entry) => (
          <li key={entry.id} className="border-b border-border/70 pb-2 last:border-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="stamp text-foreground">{entry.kind}</span>
              <time className="metric-num text-[10px] text-muted-foreground">{entry.at}</time>
            </div>
            <p className="mt-0.5 text-xs leading-snug">{entry.text}</p>
          </li>
        ))}
      </ol>
    )}
  </section>
);

export const SavedTrips = ({
  trips,
  onLoad,
  onRemove,
}: {
  trips: SavedTrip[];
  onLoad: (trip: SavedTrip) => void;
  onRemove: (id: string) => void;
}) => (
  <section className="dashboard-card p-3">
    <h2 className="stamp mb-2">04 · Saved trips</h2>
    {trips.length === 0 ? (
      <p className="text-sm text-muted-foreground">No trips stored. Compute a route, then save it.</p>
    ) : (
      <ul className="space-y-2">
        {trips.map((trip) => (
          <li key={trip.id} className="border border-border/80 px-2 py-2">
            <p className="text-sm">{trip.label}</p>
            <p className="metric-num text-[10px] text-muted-foreground">
              {trip.minutes ? `${trip.minutes} min · ` : ""}
              {trip.savedAt}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <Button type="button" variant="outline" className="h-9 rounded-sm" onClick={() => onLoad(trip)}>
                Recall
              </Button>
              <Button type="button" variant="ghost" className="h-9 rounded-sm" onClick={() => onRemove(trip.id)}>
                Drop
              </Button>
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export const Inspector = ({
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  trafficMultipliers,
}: {
  nodes: GraphNode[];
  edges: Edge[];
  selectedNode: string | null;
  selectedEdge: string | null;
  trafficMultipliers: Record<string, number>;
}) => {
  const node = nodes.find((item) => item.id === selectedNode);
  const edge = edges.find((item) => edgeId(item) === selectedEdge || `${item.to}-${item.from}` === selectedEdge);

  return (
    <section className="dashboard-card p-3">
      <h2 className="stamp mb-2">05 · Inspector</h2>
      {!node && !edge ? (
        <p className="text-sm text-muted-foreground">Click a junction or a road.</p>
      ) : null}
      {node && (
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="stamp">Junction</dt>
            <dd>{node.label}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="stamp">Callsign</dt>
            <dd className="metric-num">{node.id}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="stamp">Plot</dt>
            <dd className="metric-num">
              {Math.round(node.x)},{Math.round(node.y)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="stamp">Degree</dt>
            <dd className="metric-num">
              {edges.filter((item) => item.from === node.id || item.to === node.id).length}
            </dd>
          </div>
        </dl>
      )}
      {edge && (
        <dl className={`${node ? "mt-3 border-t border-border pt-3" : ""} space-y-1.5 text-sm`}>
          <div className="flex justify-between gap-2">
            <dt className="stamp">Link</dt>
            <dd>
              {nodeLabel(nodes, edge.from)}–{nodeLabel(nodes, edge.to)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="stamp">Base</dt>
            <dd className="metric-num">{edge.weight} min</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="stamp">Band</dt>
            <dd className="uppercase">{edge.traffic}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="stamp">Live</dt>
            <dd className="metric-num">{(trafficMultipliers[edgeId(edge)] ?? 1).toFixed(2)}×</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="stamp">State</dt>
            <dd>{edge.isBlocked ? "CLOSED" : "OPEN"}</dd>
          </div>
        </dl>
      )}
    </section>
  );
};

export const ClosureQueue = ({
  nodes,
  edges,
  onReopen,
}: {
  nodes: GraphNode[];
  edges: Edge[];
  onReopen: (id: string) => void;
}) => {
  const closed = edges.filter((edge) => edge.isBlocked);
  return (
    <section className="dashboard-card p-3">
      <h2 className="stamp mb-2">06 · Closure queue</h2>
      {closed.length === 0 ? (
        <p className="text-sm text-muted-foreground">No closed links.</p>
      ) : (
        <ul className="space-y-2">
          {closed.map((edge) => {
            const id = edgeId(edge);
            return (
              <li key={id} className="flex items-center justify-between gap-2 border-b border-border/70 pb-2 last:border-0">
                <span className="text-sm">
                  {nodeLabel(nodes, edge.from)}–{nodeLabel(nodes, edge.to)}
                </span>
                <Button type="button" variant="outline" className="h-8 rounded-sm px-2 text-[11px]" onClick={() => onReopen(id)}>
                  Reopen
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export const ConnectivityBoard = ({ nodes, edges }: { nodes: GraphNode[]; edges: Edge[] }) => {
  const parts = networkComponents(nodes, edges);
  return (
    <section className="dashboard-card p-3">
      <div className="mb-2 flex items-end justify-between">
        <h2 className="stamp">07 · Connectivity</h2>
        <span className="metric-num text-xs">{parts.count} cmp</span>
      </div>
      {nodes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Load a sector to test Union-Find partitions.</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground">
            {parts.count === 1
              ? "Sector is one open component."
              : `${parts.count} open components. Isolated junctions cannot be routed.`}
          </p>
          {parts.isolated.length > 0 && (
            <p className="font-mono text-[11px] text-destructive">
              Isolated: {parts.isolated.map((id) => nodeLabel(nodes, id)).join(", ")}
            </p>
          )}
        </>
      )}
    </section>
  );
};

export const OperatorSignOn = ({
  operator,
  onSave,
}: {
  operator: DeskOperator;
  onSave: (next: DeskOperator) => void;
}) => {
  const [callsign, setCallsign] = useState(operator.callsign);
  const [post, setPost] = useState(operator.post);
  return (
    <section className="dashboard-card p-3">
      <h2 className="stamp mb-2">08 · Operator sign-on</h2>
      <div className="space-y-2">
        <input
          value={callsign}
          onChange={(event) => setCallsign(event.target.value)}
          placeholder="Callsign"
          className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm"
        />
        <input
          value={post}
          onChange={(event) => setPost(event.target.value)}
          placeholder="Post / desk"
          className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm"
        />
        <Button
          type="button"
          className="h-11 w-full rounded-sm"
          onClick={() => onSave({ callsign: callsign.trim(), post: post.trim() })}
        >
          {operator.callsign ? "Update sign-on" : "Sign on"}
        </Button>
        {operator.callsign ? (
          <p className="text-xs text-muted-foreground">
            On duty: {operator.callsign}
            {operator.post ? ` · ${operator.post}` : ""}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Desk is unsigned until an operator takes it.</p>
        )}
      </div>
    </section>
  );
};

export const DutyNotes = ({
  notes,
  onChange,
}: {
  notes: string;
  onChange: (value: string) => void;
}) => (
  <section className="dashboard-card p-3">
    <h2 className="stamp mb-2">09 · Duty notes</h2>
    <textarea
      value={notes}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Handover, weather, VIP movement — empty until you write it."
      className="min-h-[160px] w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
    />
  </section>
);

export const UnitBoard = ({
  units,
  nodes,
  onAdd,
  onDrop,
}: {
  units: FieldUnit[];
  nodes: GraphNode[];
  onAdd: (unit: Omit<FieldUnit, "id">) => void;
  onDrop: (id: string) => void;
}) => {
  const [callsign, setCallsign] = useState("");
  const [at, setAt] = useState("");
  const [status, setStatus] = useState<UnitStatus>("standby");

  return (
    <section className="dashboard-card p-3">
      <h2 className="stamp mb-2">10 · Field units</h2>
      {nodes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Load a sector before posting a unit.</p>
      ) : (
        <div className="space-y-2">
          <input
            value={callsign}
            onChange={(event) => setCallsign(event.target.value)}
            placeholder="Unit callsign"
            className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm"
          />
          <select
            value={at}
            onChange={(event) => setAt(event.target.value)}
            className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm"
          >
            <option value="">Junction</option>
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as UnitStatus)}
            className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm"
          >
            <option value="standby">Standby</option>
            <option value="enroute">En route</option>
            <option value="onscene">On scene</option>
          </select>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-sm"
            onClick={() => {
              if (!callsign.trim() || !at) return;
              onAdd({ callsign: callsign.trim(), at, status });
              setCallsign("");
            }}
          >
            Post unit
          </Button>
        </div>
      )}
      {units.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No units posted.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {units.map((unit) => (
            <li key={unit.id} className="flex items-center justify-between gap-2 border-b border-border/70 pb-2 last:border-0">
              <div>
                <p className="text-sm">{unit.callsign}</p>
                <p className="stamp">
                  {unit.status} · {nodeLabel(nodes, unit.at)}
                </p>
              </div>
              <button type="button" className="stamp text-muted-foreground hover:text-foreground" onClick={() => onDrop(unit.id)}>
                Drop
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export const SitrepPanel = ({
  lines,
  onPrint,
  onCopy,
}: {
  lines: string[];
  onPrint: () => void;
  onCopy: () => void;
}) => (
  <section className="dashboard-card p-4">
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="stamp">SITREP</h2>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="h-9 rounded-sm" onClick={onCopy}>
          Copy
        </Button>
        <Button type="button" className="h-9 rounded-sm" onClick={onPrint}>
          Print briefing
        </Button>
      </div>
    </div>
    <pre className="sitrep-sheet overflow-x-auto whitespace-pre-wrap p-3 font-mono text-[12px] leading-relaxed">
      {lines.join("\n")}
    </pre>
  </section>
);

export const CorridorAnalytics = ({
  nodes,
  edges,
  trafficMultipliers,
  shiftScale,
}: {
  nodes: GraphNode[];
  edges: Edge[];
  trafficMultipliers: Record<string, number>;
  shiftScale: number;
}) => {
  const open = edges.filter((edge) => !edge.isBlocked);
  const closed = edges.filter((edge) => edge.isBlocked);
  const times = open
    .map((edge) => liveMinutes(edge, trafficMultipliers, shiftScale))
    .filter((value) => Number.isFinite(value));
  const avg = times.length ? times.reduce((sum, value) => sum + value, 0) / times.length : 0;
  const worst = [...open]
    .sort(
      (left, right) =>
        liveMinutes(right, trafficMultipliers, shiftScale) - liveMinutes(left, trafficMultipliers, shiftScale),
    )
    .slice(0, 6);
  const degree =
    nodes.length === 0
      ? 0
      : nodes.reduce((sum, node) => sum + edges.filter((edge) => edge.from === node.id || edge.to === node.id).length, 0) /
        nodes.length;
  const parts = networkComponents(nodes, edges);

  return (
    <div className="mx-auto grid max-w-5xl gap-3 p-1 md:grid-cols-2">
      <section className="dashboard-card p-4">
        <h2 className="stamp mb-3">Corridor analytics</h2>
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="stamp">Mean hop</dt>
            <dd className="metric-num text-2xl">{avg ? avg.toFixed(1) : "—"}</dd>
          </div>
          <div>
            <dt className="stamp">Closed</dt>
            <dd className="metric-num text-2xl">{closed.length}</dd>
          </div>
          <div>
            <dt className="stamp">Open links</dt>
            <dd className="metric-num text-2xl">{open.length}</dd>
          </div>
          <div className="col-span-2">
            <dt className="stamp">Avg degree / components</dt>
            <dd className="metric-num text-2xl">
              {degree ? degree.toFixed(1) : "—"}
              <span className="ml-2 text-sm text-muted-foreground">/ {parts.count || "—"}</span>
            </dd>
          </div>
        </dl>
      </section>
      <section className="dashboard-card p-4">
        <h2 className="stamp mb-3">Hottest corridors</h2>
        {worst.length === 0 ? (
          <p className="text-sm text-muted-foreground">Load a sector to rank delay.</p>
        ) : (
          <ol className="space-y-2">
            {worst.map((edge, index) => (
              <li key={edgeId(edge)} className="flex items-center justify-between border-b border-border/70 pb-2 text-sm last:border-0">
                <span>
                  <span className="metric-num mr-2 text-muted-foreground">{index + 1}</span>
                  {nodeLabel(nodes, edge.from)}–{nodeLabel(nodes, edge.to)}
                </span>
                <span className="metric-num text-xs">
                  {Math.round(liveMinutes(edge, trafficMultipliers, shiftScale))} min
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};

export const KeyboardHelp = () => (
  <section className="dashboard-card p-3">
    <h2 className="stamp mb-2">Keys</h2>
    <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
      <li>Ctrl/⌘ K · command palette</li>
      <li>G · compute route</li>
      <li>X · swap live/dest</li>
      <li>1–8 · desk tabs</li>
      <li>Esc · clear selection</li>
    </ul>
  </section>
);
