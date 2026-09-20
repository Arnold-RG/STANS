import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TrafficSimulator from "@/components/dashboard/TrafficSimulator";
import RouteFinder from "@/components/dashboard/RouteFinder";
import SystemDashboard from "@/components/dashboard/SystemDashboard";
import TrafficMapCanvas from "@/components/dashboard/TrafficMapCanvas";
import CommandPalette from "@/components/dashboard/CommandPalette";
import {
  ClosureQueue,
  ConnectivityBoard,
  CorridorAnalytics,
  DispatchLog,
  DutyNotes,
  HeatIndex,
  Inspector,
  KeyboardHelp,
  OperatorSignOn,
  SavedTrips,
  ShiftControl,
  SitrepPanel,
  StatusWall,
  UnitBoard,
} from "@/components/dashboard/OpsPanels";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useTrafficSimulation } from "@/hooks/useTrafficSimulation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Edge } from "@/utils/kruskal";
import GraphBuilder from "@/components/GraphBuilder";
import GraphTemplates from "@/components/GraphTemplates";
import GraphVisualization from "@/components/GraphVisualization";
import DijkstraVisualization from "@/components/DijkstraVisualization";
import PrimVisualization from "@/components/PrimVisualization";
import GraphImport from "@/components/GraphImport";
import type { MapType } from "@/components/maps/PakistanMapSVG";
import { cloneKarachiNetwork, KARACHI_SECTOR, type GraphNode } from "@/data/karachiNetwork";
import {
  inferShift,
  newLog,
  NOTES_STORAGE_KEY,
  OPERATOR_STORAGE_KEY,
  TRIPS_STORAGE_KEY,
  UNITS_STORAGE_KEY,
  type DeskOperator,
  type DispatchEntry,
  type FieldUnit,
  type SavedTrip,
  type ShiftId,
  SHIFTS,
} from "@/data/deskOps";
import { congestionHeat, networkComponents, printPlain, sitrepLines } from "@/utils/networkOps";
import { toast } from "sonner";

const sectorLabel = (mapType: MapType): string => {
  switch (mapType) {
    case "karachi":
      return KARACHI_SECTOR;
    case "lahore":
      return "LAHORE · SECTOR 07";
    case "islamabad":
      return "ISLAMABAD · BLUE";
    case "peshawar":
      return "PESHAWAR · RING";
    case "quetta":
      return "QUETTA · CANTONMENT";
    case "faisalabad":
      return "FAISALABAD · CLOCK";
    case "multan":
      return "MULTAN · CANTT";
    case "rawalpindi":
      return "RAWALPINDI · SADDAR";
    case "pakistan":
      return "PAKISTAN · TRUNK";
    default:
      return "NO SECTOR LOADED";
  }
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const Dashboard = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [activeTab, setActiveTab] = useState("map");
  const [mstKind, setMstKind] = useState<"kruskal" | "prim">("kruskal");
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [liveId, setLiveId] = useState("");
  const [destId, setDestId] = useState("");
  const [viaId, setViaId] = useState("");
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [alternatePath, setAlternatePath] = useState<string[]>([]);
  const [mstEdges] = useState<Edge[]>([]);
  const [currentMapType, setCurrentMapType] = useState<MapType>(null);
  const [algorithmStatus, setAlgorithmStatus] = useState<{
    name: string;
    step: string;
    progress: number;
    details?: string[];
  } | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [deskOpen, setDeskOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shiftId, setShiftId] = useState<ShiftId>(() => inferShift());
  const [log, setLog] = useState<DispatchEntry[]>([]);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>(() => readJson(TRIPS_STORAGE_KEY, []));
  const [operator, setOperator] = useState<DeskOperator>(() =>
    readJson(OPERATOR_STORAGE_KEY, { callsign: "", post: "" }),
  );
  const [dutyNotes, setDutyNotes] = useState(() => {
    try {
      return localStorage.getItem(NOTES_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [units, setUnits] = useState<FieldUnit[]>(() => readJson(UNITS_STORAGE_KEY, []));
  const [routeMinutes, setRouteMinutes] = useState<number | undefined>(undefined);
  const computeRef = useRef<(() => void) | null>(null);

  const pushLog = useCallback((kind: DispatchEntry["kind"], text: string) => {
    setLog((current) => [newLog(kind, text), ...current].slice(0, 80));
  }, []);

  const handleEdgesUpdate = useCallback((updatedEdges: Edge[]) => {
    setEdges(updatedEdges);
  }, []);

  const {
    isSimulating,
    isPaused,
    speed,
    trafficMultipliers,
    startSimulation,
    stopSimulation,
    togglePause,
    setSpeed,
    simulateAccident,
    setTrafficLevel,
    clearAccidents,
  } = useTrafficSimulation({
    edges,
    onEdgesUpdate: handleEdgesUpdate,
  });

  const shiftScale = SHIFTS[shiftId].scale;
  const heatScore = useMemo(() => congestionHeat(edges, trafficMultipliers), [edges, trafficMultipliers]);
  const isolatedCount = useMemo(() => networkComponents(nodes, edges).isolated.length, [nodes, edges]);
  const briefing = useMemo(
    () =>
      sitrepLines({
        sector: sectorLabel(currentMapType),
        shift: SHIFTS[shiftId],
        operator: operator.callsign,
        nodes,
        edges,
        multipliers: trafficMultipliers,
        liveId,
        destId,
        viaId,
        path: highlightedPath,
        minutes: routeMinutes,
      }),
    [
      currentMapType,
      destId,
      edges,
      highlightedPath,
      liveId,
      nodes,
      operator.callsign,
      routeMinutes,
      shiftId,
      trafficMultipliers,
      viaId,
    ],
  );

  const networkHealth = useMemo(() => {
    if (edges.length === 0) return "optimal";
    const congestedCount = edges.filter((edge) => {
      const multiplier = trafficMultipliers[`${edge.from}-${edge.to}`] || 1;
      return multiplier > 1.5 || edge.traffic === "high";
    }).length;
    const ratio = congestedCount / edges.length;
    if (ratio > 0.5) return "congested";
    if (ratio > 0.2) return "strained";
    return "optimal";
  }, [edges, trafficMultipliers]);

  const handleToggleSimulation = () => {
    if (isSimulating) {
      stopSimulation();
      pushLog("board", "Night board held.");
    } else {
      if (edges.length === 0) {
        toast.message("Load a sector before running the board.");
        return;
      }
      startSimulation();
      pushLog("board", `${SHIFTS[shiftId].label} board live.`);
    }
  };

  const handleRouteCalculated = (path: string[], alternate: string[], minutes?: number) => {
    setHighlightedPath(path);
    setAlternatePath(alternate);
    setRouteMinutes(minutes);
    setAlgorithmStatus({
      name: "Path",
      step: path.length ? "Path on the board" : "No path",
      progress: path.length ? 100 : 0,
      details: path.length
        ? [`${path.length} junctions`, `${minutes ?? "—"} min`, path.join(" → ")]
        : ["Closed or disconnected"],
    });
    if (path.length) {
      pushLog("route", `Trip ${path.join(" → ")}${minutes ? ` · ${minutes} min` : ""}`);
    }
    setActiveTab("map");
  };

  const handleNodeSelect = (id: string) => {
    setSelectedNode(id);
    if (!liveId || (liveId && destId)) {
      setLiveId(id);
      setDestId("");
      setHighlightedPath([]);
      setAlternatePath([]);
      return;
    }
    if (id === liveId) return;
    setDestId(id);
  };

  const setRoadBlocked = (targetId: string, blocked?: boolean) => {
    setEdges((current) =>
      current.map((edge) => {
        const id = `${edge.from}-${edge.to}`;
        const reverse = `${edge.to}-${edge.from}`;
        if (id === targetId || reverse === targetId) {
          const next = { ...edge, isBlocked: blocked ?? !edge.isBlocked };
          pushLog("incident", `${next.isBlocked ? "Closed" : "Reopened"} ${id}`);
          return next;
        }
        return edge;
      }),
    );
  };

  const toggleSelectedRoad = () => {
    if (!selectedEdge) return;
    setRoadBlocked(selectedEdge);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setDeskOpen(false);
  };

  const resetSelection = () => {
    setLiveId("");
    setDestId("");
    setViaId("");
    setSelectedEdge(null);
    setSelectedNode(null);
    setHighlightedPath([]);
    setAlternatePath([]);
    setRouteMinutes(undefined);
  };

  const loadNetwork = (nextNodes: GraphNode[], nextEdges: Edge[], mapType?: MapType) => {
    setNodes(nextNodes);
    setEdges(nextEdges);
    setCurrentMapType(mapType ?? null);
    resetSelection();
    setActiveTab("map");
    pushLog("board", `Loaded ${sectorLabel(mapType ?? null)} · ${nextNodes.length} junctions / ${nextEdges.length} links`);
    setUnits((current) => {
      const ids = new Set(nextNodes.map((node) => node.id));
      const next = current.filter((unit) => ids.has(unit.at));
      localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearBoard = () => {
    setNodes([]);
    setEdges([]);
    setCurrentMapType(null);
    resetSelection();
    stopSimulation();
    clearAccidents();
    setAlgorithmStatus(null);
    setUnits([]);
    localStorage.setItem(UNITS_STORAGE_KEY, "[]");
    pushLog("board", "Board wiped. No sector loaded.");
    toast.message("Board cleared");
  };

  const exportSession = () => {
    const payload = {
      sector: sectorLabel(currentMapType),
      shift: SHIFTS[shiftId],
      liveId,
      destId,
      viaId,
      nodes,
      edges,
      trafficMultipliers,
      path: highlightedPath,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stans-session-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    pushLog("info", "Session JSON exported.");
  };

  const printBriefing = () => {
    const ok = printPlain("STANS SITREP", briefing);
    if (!ok) toast.message("Allow pop-ups to print the briefing.");
    else pushLog("info", "SITREP sent to printer.");
  };

  const copyBriefing = async () => {
    try {
      await navigator.clipboard.writeText(briefing.join("\n"));
      toast.success("SITREP copied");
    } catch {
      toast.message("Clipboard blocked");
    }
  };

  const persistTrips = (next: SavedTrip[]) => {
    setSavedTrips(next);
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(next));
  };

  const saveTrip = (trip: Omit<SavedTrip, "id" | "savedAt">) => {
    persistTrips([
      {
        ...trip,
        id: `${Date.now()}`,
        savedAt: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      },
      ...savedTrips,
    ].slice(0, 12));
    pushLog("route", `Saved trip ${trip.label}`);
    toast.success("Trip saved");
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typing) return;
      if (event.key === "Escape") {
        resetSelection();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        computeRef.current?.();
        return;
      }
      if (event.key === "x" || event.key === "X") {
        setLiveId(destId);
        setDestId(liveId);
        return;
      }
      const tabKeys: Record<string, string> = {
        "1": "map",
        "2": "route",
        "3": "mst",
        "4": "builder",
        "5": "cities",
        "6": "files",
        "7": "analytics",
        "8": "brief",
      };
      if (tabKeys[event.key]) setActiveTab(tabKeys[event.key]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [liveId, destId]);

  const deskControls = (
    <div className="space-y-4">
      <ShiftControl shiftId={shiftId} onChange={setShiftId} />
      <HeatIndex edges={edges} multipliers={trafficMultipliers} />
      <RouteFinder
        nodes={nodes}
        edges={edges}
        liveId={liveId}
        destId={destId}
        viaId={viaId}
        onLiveChange={setLiveId}
        onDestChange={setDestId}
        onViaChange={setViaId}
        onRouteCalculated={handleRouteCalculated}
        trafficMultipliers={trafficMultipliers}
        shiftScale={shiftScale}
        onSaveTrip={saveTrip}
        registerCompute={(fn) => {
          computeRef.current = fn;
        }}
      />
      <TrafficSimulator
        isSimulating={isSimulating}
        isPaused={isPaused}
        speed={speed}
        nodes={nodes}
        edges={edges}
        trafficMultipliers={trafficMultipliers}
        onToggleSimulation={handleToggleSimulation}
        onTogglePause={togglePause}
        onSpeedChange={setSpeed}
        onSimulateAccident={simulateAccident}
        onClearAccidents={() => {
          clearAccidents();
          pushLog("incident", "Incidents cleared.");
        }}
        onTrafficLevelChange={setTrafficLevel}
        selectedEdge={selectedEdge}
        onToggleBlock={toggleSelectedRoad}
      />
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" className="h-11 rounded-sm" onClick={exportSession}>
          Export JSON
        </Button>
        <Button type="button" variant="outline" className="h-11 rounded-sm" onClick={clearBoard}>
          Clear board
        </Button>
      </div>
      <Button type="button" variant="outline" className="h-11 w-full rounded-sm" onClick={printBriefing}>
        Print SITREP
      </Button>
    </div>
  );

  const rightRail = (
    <div className="space-y-4">
      <SystemDashboard
        nodes={nodes}
        edges={edges}
        trafficMultipliers={trafficMultipliers}
        algorithmStatus={algorithmStatus}
      />
      <Inspector
        nodes={nodes}
        edges={edges}
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        trafficMultipliers={trafficMultipliers}
      />
      <ClosureQueue nodes={nodes} edges={edges} onReopen={(id) => setRoadBlocked(id, false)} />
      <ConnectivityBoard nodes={nodes} edges={edges} />
      <SavedTrips
        trips={savedTrips}
        onLoad={(trip) => {
          setLiveId(trip.liveId);
          setDestId(trip.destId);
          setViaId(trip.viaId ?? "");
          toast.message("Trip recalled");
        }}
        onRemove={(id) => persistTrips(savedTrips.filter((trip) => trip.id !== id))}
      />
      <DispatchLog entries={log} onClear={() => setLog([])} />
      <KeyboardHelp />
    </div>
  );

  return (
    <div className="asphalt-desk flex h-[100dvh] flex-col overflow-hidden">
      <DashboardHeader
        isSimulating={isSimulating}
        networkHealth={networkHealth}
        sectorName={sectorLabel(currentMapType)}
        shiftLabel={SHIFTS[shiftId].label}
        junctionCount={nodes.length}
        linkCount={edges.length}
        liveId={liveId}
        destId={destId}
        onCommand={() => setPaletteOpen(true)}
      />
      <StatusWall
        heat={heatScore}
        closed={edges.filter((edge) => edge.isBlocked).length}
        isolated={isolatedCount}
        eta={routeMinutes}
        operator={operator.callsign}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={`hidden flex-shrink-0 overflow-hidden border-r border-border bg-card/80 md:block ${
            leftSidebarOpen ? "w-72 xl:w-80" : "w-0"
          }`}
        >
          <ScrollArea className="h-full">
            <div className="p-3">{deskControls}</div>
          </ScrollArea>
        </aside>

        <button
          type="button"
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="absolute top-1/2 z-20 hidden h-11 w-6 -translate-y-1/2 items-center justify-center border border-border bg-card text-xs text-muted-foreground md:flex"
          style={{ left: leftSidebarOpen ? "18rem" : "0" }}
          aria-label={leftSidebarOpen ? "Hide route desk" : "Show route desk"}
        >
          {leftSidebarOpen ? "‹" : "›"}
        </button>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
            <div className="desk-strip hidden items-center gap-0 overflow-x-auto border-b border-border bg-card/90 px-2 md:flex">
              <TabsList className="h-11 w-max justify-start gap-0 rounded-none bg-transparent p-0">
                {[
                  ["map", "Map"],
                  ["route", "Route"],
                  ["mst", "MST"],
                  ["builder", "Builder"],
                  ["cities", "Cities"],
                  ["files", "Files"],
                  ["analytics", "Analytics"],
                  ["brief", "Brief"],
                ].map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="h-11 rounded-none border-b-2 border-transparent px-3 font-mono text-[11px] uppercase tracking-[0.16em] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <TabsContent value="map" className="mt-0 h-full">
                <TrafficMapCanvas
                  nodes={nodes}
                  edges={edges}
                  trafficMultipliers={trafficMultipliers}
                  highlightedPath={highlightedPath}
                  alternatePath={alternatePath}
                  mstEdges={mstEdges}
                  selectedEdge={selectedEdge}
                  onEdgeSelect={setSelectedEdge}
                  onNodeSelect={handleNodeSelect}
                  currentNode={selectedNode}
                  liveId={liveId}
                  destId={destId}
                  viaId={viaId}
                  visitedNodes={new Set()}
                  mapType={currentMapType}
                  onLoadCities={() => setActiveTab("cities")}
                />
              </TabsContent>

              <TabsContent value="route" className="mt-0 h-full overflow-auto p-2 md:p-4">
                <DijkstraVisualization nodes={nodes} edges={edges} />
              </TabsContent>

              <TabsContent value="mst" className="mt-0 h-full overflow-auto p-2 md:p-4">
                <div className="mb-3 flex gap-2">
                  <Button
                    variant={mstKind === "kruskal" ? "default" : "outline"}
                    className="h-11 rounded-sm"
                    onClick={() => setMstKind("kruskal")}
                  >
                    Kruskal
                  </Button>
                  <Button
                    variant={mstKind === "prim" ? "default" : "outline"}
                    className="h-11 rounded-sm"
                    onClick={() => setMstKind("prim")}
                  >
                    Prim
                  </Button>
                </div>
                {mstKind === "kruskal" ? (
                  <GraphVisualization nodes={nodes} edges={edges} />
                ) : (
                  <PrimVisualization nodes={nodes} edges={edges} />
                )}
              </TabsContent>

              <TabsContent value="builder" className="mt-0 h-full overflow-auto p-2 md:p-4">
                <GraphBuilder nodes={nodes} edges={edges} setNodes={setNodes} setEdges={setEdges} />
              </TabsContent>

              <TabsContent value="cities" className="mt-0 h-full overflow-auto p-2 md:p-4">
                <GraphTemplates onLoadTemplate={loadNetwork} />
              </TabsContent>

              <TabsContent value="files" className="mt-0 h-full overflow-auto p-2 md:p-4">
                <GraphImport
                  onImportGraph={(data) => {
                    loadNetwork(
                      data.nodes,
                      data.edges.map((edge) => ({
                        from: edge.from,
                        to: edge.to,
                        weight: edge.weight,
                        traffic: edge.traffic > 0.6 ? "high" : edge.traffic > 0.3 ? "medium" : "low",
                        isBlocked: edge.blocked,
                      })),
                      null,
                    );
                  }}
                  currentGraph={{
                    nodes,
                    edges: edges.map((edge) => ({
                      from: edge.from,
                      to: edge.to,
                      weight: edge.weight,
                      traffic: edge.traffic === "low" ? 0.3 : edge.traffic === "medium" ? 0.6 : 0.9,
                      blocked: edge.isBlocked || false,
                    })),
                  }}
                />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0 h-full overflow-auto p-2 md:p-4">
                <CorridorAnalytics
                  nodes={nodes}
                  edges={edges}
                  trafficMultipliers={trafficMultipliers}
                  shiftScale={shiftScale}
                />
              </TabsContent>

              <TabsContent value="brief" className="mt-0 h-full overflow-auto p-2 md:p-4">
                <div className="mx-auto grid max-w-5xl gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <SitrepPanel lines={briefing} onPrint={printBriefing} onCopy={copyBriefing} />
                  </div>
                  <OperatorSignOn
                    operator={operator}
                    onSave={(next) => {
                      setOperator(next);
                      localStorage.setItem(OPERATOR_STORAGE_KEY, JSON.stringify(next));
                      pushLog("info", next.callsign ? `Signed on ${next.callsign}` : "Desk unsigned.");
                    }}
                  />
                  <DutyNotes
                    notes={dutyNotes}
                    onChange={(value) => {
                      setDutyNotes(value);
                      localStorage.setItem(NOTES_STORAGE_KEY, value);
                    }}
                  />
                  <div className="md:col-span-2">
                    <UnitBoard
                      units={units}
                      nodes={nodes}
                      onAdd={(unit) => {
                        const next = [{ ...unit, id: `${Date.now()}` }, ...units].slice(0, 16);
                        setUnits(next);
                        localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(next));
                        pushLog("board", `Unit ${unit.callsign} posted at ${unit.at}`);
                      }}
                      onDrop={(id) => {
                        const next = units.filter((unit) => unit.id !== id);
                        setUnits(next);
                        localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(next));
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </main>

        <button
          type="button"
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className="absolute top-1/2 z-20 hidden h-11 w-6 -translate-y-1/2 items-center justify-center border border-border bg-card text-xs text-muted-foreground md:flex"
          style={{ right: rightSidebarOpen ? "18rem" : "0" }}
          aria-label={rightSidebarOpen ? "Hide sector load" : "Show sector load"}
        >
          {rightSidebarOpen ? "›" : "‹"}
        </button>

        <aside
          className={`hidden flex-shrink-0 overflow-hidden border-l border-border bg-card/80 md:block ${
            rightSidebarOpen ? "w-72 xl:w-80" : "w-0"
          }`}
        >
          <ScrollArea className="h-full">
            <div className="p-3">{rightRail}</div>
          </ScrollArea>
        </aside>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onTab={handleTabChange}
        onCompute={() => computeRef.current?.()}
        onSwap={() => {
          setLiveId(destId);
          setDestId(liveId);
        }}
        onClearBoard={clearBoard}
        onExport={exportSession}
        onLoadKarachi={() => {
          const network = cloneKarachiNetwork();
          loadNetwork(network.nodes, network.edges, network.mapType);
        }}
        onToggleSim={handleToggleSimulation}
        onOpenCities={() => handleTabChange("cities")}
        onPrint={printBriefing}
        onBrief={() => handleTabChange("brief")}
      />

      <Drawer open={deskOpen} onOpenChange={setDeskOpen}>
        <DrawerContent className="rounded-none border-border bg-background md:hidden">
          <DrawerHeader className="border-b border-border text-left">
            <DrawerTitle className="font-mono text-sm tracking-[0.18em]">DESK</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="max-h-[70dvh]">
            <div className="space-y-4 p-3 pb-8">
              {deskControls}
              {rightRail}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>

      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenDesk={() => setDeskOpen(true)}
      />

      <div
        className="md:hidden"
        style={{ height: "calc(3.5rem + env(safe-area-inset-bottom))" }}
      />
    </div>
  );
};

export default Dashboard;
