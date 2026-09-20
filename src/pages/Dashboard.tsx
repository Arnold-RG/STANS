import { useCallback, useMemo, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TrafficSimulator from "@/components/dashboard/TrafficSimulator";
import RouteFinder from "@/components/dashboard/RouteFinder";
import SystemDashboard from "@/components/dashboard/SystemDashboard";
import TrafficMapCanvas from "@/components/dashboard/TrafficMapCanvas";
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
import EducationalMode from "@/components/EducationalMode";
import { InteractiveTutorial } from "@/components/InteractiveTutorial";
import type { MapType } from "@/components/maps/PakistanMapSVG";
import { cloneKarachiNetwork, KARACHI_SECTOR, type GraphNode } from "@/data/karachiNetwork";

const initialNetwork = cloneKarachiNetwork();

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
      return "CUSTOM · DESK";
  }
};

const Dashboard = () => {
  const [nodes, setNodes] = useState<GraphNode[]>(initialNetwork.nodes);
  const [edges, setEdges] = useState<Edge[]>(initialNetwork.edges);
  const [activeTab, setActiveTab] = useState("map");
  const [mstKind, setMstKind] = useState<"kruskal" | "prim">("kruskal");
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [liveId, setLiveId] = useState("");
  const [destId, setDestId] = useState("");
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [alternatePath, setAlternatePath] = useState<string[]>([]);
  const [mstEdges] = useState<Edge[]>([]);
  const [currentMapType, setCurrentMapType] = useState<MapType>(initialNetwork.mapType);
  const [algorithmStatus, setAlgorithmStatus] = useState<{
    name: string;
    step: string;
    progress: number;
    details?: string[];
  } | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [deskOpen, setDeskOpen] = useState(false);

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
    } else {
      startSimulation();
    }
  };

  const handleRouteCalculated = (path: string[], alternate: string[]) => {
    setHighlightedPath(path);
    setAlternatePath(alternate);
    setAlgorithmStatus({
      name: "Path",
      step: path.length ? "Path on the board" : "No path",
      progress: path.length ? 100 : 0,
      details: path.length ? [`${path.length} junctions`, path.join(" → ")] : ["Closed or disconnected"],
    });
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

  const toggleSelectedRoad = () => {
    if (!selectedEdge) return;
    setEdges((current) =>
      current.map((edge) => {
        const id = `${edge.from}-${edge.to}`;
        const reverse = `${edge.to}-${edge.from}`;
        if (id === selectedEdge || reverse === selectedEdge) {
          return { ...edge, isBlocked: !edge.isBlocked };
        }
        return edge;
      }),
    );
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setDeskOpen(false);
  };

  const deskControls = (
    <div className="space-y-4">
      <RouteFinder
        nodes={nodes}
        edges={edges}
        liveId={liveId}
        destId={destId}
        onLiveChange={setLiveId}
        onDestChange={setDestId}
        onRouteCalculated={handleRouteCalculated}
        trafficMultipliers={trafficMultipliers}
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
        onClearAccidents={clearAccidents}
        onTrafficLevelChange={setTrafficLevel}
        selectedEdge={selectedEdge}
        onToggleBlock={toggleSelectedRoad}
      />
      <button
        type="button"
        onClick={() => setIsTutorialOpen(true)}
        className="stamp tap-target text-left text-muted-foreground hover:text-foreground"
      >
        How this works
      </button>
    </div>
  );

  return (
    <div className="asphalt-desk flex h-[100dvh] flex-col overflow-hidden">
      <DashboardHeader
        isSimulating={isSimulating}
        networkHealth={networkHealth}
        sectorName={sectorLabel(currentMapType)}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={`hidden flex-shrink-0 overflow-hidden border-r border-border bg-card md:block ${
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
            <div className="hidden overflow-x-auto border-b border-border bg-card px-2 md:block">
              <TabsList className="h-11 w-max justify-start gap-0 rounded-none bg-transparent p-0">
                {[
                  ["map", "Map"],
                  ["route", "Route"],
                  ["mst", "MST"],
                  ["builder", "Builder"],
                  ["cities", "Cities"],
                  ["files", "Files"],
                  ["notes", "Notes"],
                ].map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="h-11 rounded-none border-b-2 border-transparent px-3 font-mono text-[11px] uppercase tracking-wide data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground"
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
                  visitedNodes={new Set()}
                  mapType={currentMapType}
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
                <GraphBuilder
                  nodes={nodes}
                  edges={edges}
                  setNodes={setNodes}
                  setEdges={setEdges}
                />
              </TabsContent>

              <TabsContent value="cities" className="mt-0 h-full overflow-auto p-2 md:p-4">
                <GraphTemplates
                  onLoadTemplate={(templateNodes, templateEdges, mapType) => {
                    setNodes(templateNodes);
                    setEdges(templateEdges);
                    setCurrentMapType(mapType || null);
                    setHighlightedPath([]);
                    setAlternatePath([]);
                    setLiveId("");
                    setDestId("");
                    setActiveTab("map");
                  }}
                />
              </TabsContent>

              <TabsContent value="files" className="mt-0 h-full overflow-auto p-2 md:p-4">
                <GraphImport
                  onImportGraph={(data) => {
                    setNodes(data.nodes);
                    setEdges(
                      data.edges.map((edge) => ({
                        from: edge.from,
                        to: edge.to,
                        weight: edge.weight,
                        traffic: edge.traffic > 0.6 ? "high" : edge.traffic > 0.3 ? "medium" : "low",
                        isBlocked: edge.blocked,
                      })),
                    );
                    setCurrentMapType(null);
                    setActiveTab("map");
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

              <TabsContent value="notes" className="mt-0 h-full overflow-auto p-2 md:p-4">
                <EducationalMode />
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
          className={`hidden flex-shrink-0 overflow-hidden border-l border-border bg-card md:block ${
            rightSidebarOpen ? "w-72 xl:w-80" : "w-0"
          }`}
        >
          <ScrollArea className="h-full">
            <div className="p-3">
              <SystemDashboard
                nodes={nodes}
                edges={edges}
                trafficMultipliers={trafficMultipliers}
                algorithmStatus={algorithmStatus}
              />
            </div>
          </ScrollArea>
        </aside>
      </div>

      <InteractiveTutorial
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        nodes={nodes}
        edges={edges}
        currentTab={activeTab}
        onTabChange={setActiveTab}
      />

      <Drawer open={deskOpen} onOpenChange={setDeskOpen}>
        <DrawerContent className="rounded-none border-border bg-background md:hidden">
          <DrawerHeader className="border-b border-border text-left">
            <DrawerTitle className="font-mono text-sm tracking-[0.18em]">DESK</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="max-h-[70dvh]">
            <div className="space-y-4 p-3 pb-8">
              {deskControls}
              <SystemDashboard
                nodes={nodes}
                edges={edges}
                trafficMultipliers={trafficMultipliers}
                algorithmStatus={algorithmStatus}
              />
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
