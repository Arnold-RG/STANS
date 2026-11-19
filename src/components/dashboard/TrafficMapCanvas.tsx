import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useCanvasZoom } from "@/hooks/useCanvasZoom";
import CanvasZoomControls from "@/components/CanvasZoomControls";
import type { Edge } from "@/utils/kruskal";
import {
  PakistanOutline,
  KarachiOutline,
  LahoreOutline,
  IslamabadOutline,
  PeshawarOutline,
  QuettaOutline,
  PakistanCityMarkers,
  type MapType
} from "@/components/maps/PakistanMapSVG";

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface TrafficMapCanvasProps {
  nodes: Node[];
  edges: Edge[];
  trafficMultipliers: { [key: string]: number };
  highlightedPath?: string[];
  alternatePath?: string[];
  selectedEdge: string | null;
  onEdgeSelect: (edgeId: string | null) => void;
  onNodeSelect?: (nodeId: string) => void;
  mstEdges?: Edge[];
  visitedNodes?: Set<string>;
  currentNode?: string;
  liveId?: string;
  destId?: string;
  viaId?: string;
  mapType?: MapType;
  onLoadCities?: () => void;
}

const TrafficMapCanvas = ({
  nodes,
  edges,
  trafficMultipliers,
  highlightedPath = [],
  alternatePath = [],
  selectedEdge,
  onEdgeSelect,
  onNodeSelect,
  mstEdges = [],
  visitedNodes = new Set(),
  currentNode,
  liveId,
  destId,
  viaId,
  mapType = null,
  onLoadCities,
}: TrafficMapCanvasProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { x: 0, y: 0, w: 800, h: 480 };
    }
    const pad = 72;
    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    const maxX = Math.max(...xs) + pad;
    const maxY = Math.max(...ys) + pad + 20;
    return {
      x: minX,
      y: minY,
      w: Math.max(maxX - minX, 320),
      h: Math.max(maxY - minY, 240),
    };
  }, [nodes]);

  const {
    zoom,
    setZoom,
    viewBox,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetView,
  } = useCanvasZoom({
    baseWidth: bounds.w,
    baseHeight: bounds.h,
    originX: bounds.x,
    originY: bounds.y,
  });

  // Render appropriate map outline based on mapType
  const renderMapOutline = () => {
    switch (mapType) {
      case 'pakistan':
        return (
          <>
            <PakistanOutline />
            <PakistanCityMarkers />
          </>
        );
      case 'karachi':
        return <KarachiOutline />;
      case 'lahore':
        return <LahoreOutline />;
      case 'islamabad':
        return <IslamabadOutline />;
      case 'peshawar':
        return <PeshawarOutline />;
      case 'quetta':
        return <QuettaOutline />;
      default:
        return null;
    }
  };

  const getEdgeId = (edge: Edge) => `${edge.from}-${edge.to}`;

  const isEdgeInPath = (edge: Edge) => {
    for (let i = 0; i < highlightedPath.length - 1; i++) {
      if (
        (edge.from === highlightedPath[i] && edge.to === highlightedPath[i + 1]) ||
        (edge.to === highlightedPath[i] && edge.from === highlightedPath[i + 1])
      ) {
        return true;
      }
    }
    return false;
  };

  const isEdgeInAlternate = (edge: Edge) => {
    for (let i = 0; i < alternatePath.length - 1; i++) {
      if (
        (edge.from === alternatePath[i] && edge.to === alternatePath[i + 1]) ||
        (edge.to === alternatePath[i] && edge.from === alternatePath[i + 1])
      ) {
        return true;
      }
    }
    return false;
  };

  const isEdgeInMST = (edge: Edge) => {
    return mstEdges.some(
      (mstEdge) =>
        (mstEdge.from === edge.from && mstEdge.to === edge.to) ||
        (mstEdge.from === edge.to && mstEdge.to === edge.from),
    );
  };

  const getEdgeColor = (edge: Edge) => {
    if (edge.isBlocked) return "hsl(var(--road))";
    if (isEdgeInPath(edge)) return "hsl(var(--primary))";
    if (isEdgeInAlternate(edge)) return "hsl(var(--muted-foreground))";
    if (isEdgeInMST(edge)) return "hsl(var(--secondary))";
    
    const multiplier = trafficMultipliers[getEdgeId(edge)] || 1;
    const baseTraffic = edge.traffic === 'high' ? 2 : edge.traffic === 'medium' ? 1.5 : 1;
    const effectiveTraffic = baseTraffic * multiplier;
    
    if (effectiveTraffic > 2.5) return "hsl(var(--traffic-heavy))";
    if (effectiveTraffic > 1.5) return "hsl(var(--traffic-moderate))";
    return "hsl(var(--traffic-clear))";
  };

  const getEdgeWidth = (edge: Edge) => {
    if (isEdgeInPath(edge)) return 5;
    if (isEdgeInAlternate(edge)) return 3;
    if (isEdgeInMST(edge)) return 4;
    if (selectedEdge === getEdgeId(edge)) return 4;
    return 3;
  };

  const getNodeColor = (nodeId: string) => {
    if (liveId === nodeId) return "hsl(var(--primary))";
    if (destId === nodeId) return "hsl(var(--secondary))";
    if (viaId === nodeId) return "hsl(var(--warning))";
    if (currentNode === nodeId) return "hsl(var(--primary))";
    if (highlightedPath.includes(nodeId)) return "hsl(var(--primary))";
    if (visitedNodes.has(nodeId)) return "hsl(var(--secondary))";
    return "hsl(var(--muted-foreground))";
  };

  const getNodeRadius = (nodeId: string) => {
    if (currentNode === nodeId) return 14;
    if (highlightedPath.length > 0 && (highlightedPath[0] === nodeId || highlightedPath[highlightedPath.length - 1] === nodeId)) {
      return 12;
    }
    return 10;
  };

  // Traffic flow animation particles - shows moving dots that slow down with congestion
  const renderTrafficFlow = (edge: Edge, x1: number, y1: number, x2: number, y2: number) => {
    if (edge.isBlocked) return null;
    
    const multiplier = trafficMultipliers[getEdgeId(edge)] || 1;
    const baseTraffic = edge.traffic === 'high' ? 2.5 : edge.traffic === 'medium' ? 1.5 : 1;
    const effectiveTraffic = baseTraffic * multiplier;
    
    // Higher traffic = slower speed (longer duration)
    const baseDuration = 1.5;
    const duration = baseDuration + (effectiveTraffic * 0.8);
    
    // More particles for heavy traffic
    const particleCount = effectiveTraffic > 2 ? 5 : effectiveTraffic > 1.5 ? 4 : 3;
    
    // Color based on traffic level
    const particleColor = effectiveTraffic > 2.5 
      ? "hsl(var(--traffic-heavy))" 
      : effectiveTraffic > 1.5 
        ? "hsl(var(--traffic-moderate))" 
        : "hsl(var(--traffic-clear))";
    
    // Size based on congestion (larger = more congested)
    const particleSize = effectiveTraffic > 2 ? 4 : effectiveTraffic > 1.5 ? 3 : 2.5;
    
    return (
      <g key={`flow-${getEdgeId(edge)}`}>
        {Array.from({ length: particleCount }).map((_, i) => (
          <motion.circle
            key={i}
            r={particleSize}
            fill={particleColor}
            initial={{ 
              cx: x1, 
              cy: y1,
              opacity: 0,
              scale: 0.5
            }}
            animate={{
              cx: [x1, x2],
              cy: [y1, y2],
              opacity: [0, 0.9, 0.9, 0],
              scale: [0.5, 1, 1, 0.5],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: i * (duration / particleCount),
              ease: "linear",
            }}
          />
        ))}
        {/* Reverse direction flow for bi-directional traffic */}
        {Array.from({ length: Math.max(2, particleCount - 1) }).map((_, i) => (
          <motion.circle
            key={`rev-${i}`}
            r={particleSize * 0.8}
            fill={particleColor}
            opacity={0.7}
            initial={{ 
              cx: x2, 
              cy: y2,
              opacity: 0,
              scale: 0.5
            }}
            animate={{
              cx: [x2, x1],
              cy: [y2, y1],
              opacity: [0, 0.7, 0.7, 0],
              scale: [0.5, 0.9, 0.9, 0.5],
            }}
            transition={{
              duration: duration * 1.1,
              repeat: Infinity,
              delay: i * (duration / (particleCount - 1)) + 0.3,
              ease: "linear",
            }}
          />
        ))}
      </g>
    );
  };

  const getNodePosition = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  };

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden border-0 bg-card city-grid">
      {/* Canvas Controls */}
      <CanvasZoomControls
        zoom={zoom}
        setZoom={setZoom}
        resetView={resetView}
      />

      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid Pattern Overlay */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path 
              d="M 40 0 L 0 0 0 40" 
              fill="none" 
              stroke="hsl(var(--border))" 
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Map Outline */}
        {renderMapOutline()}

        {/* Edges (Roads) */}
        {edges.map(edge => {
          const fromPos = getNodePosition(edge.from);
          const toPos = getNodePosition(edge.to);
          const edgeId = getEdgeId(edge);
          const isSelected = selectedEdge === edgeId;
          const inPath = isEdgeInPath(edge);
          
          return (
            <g key={edgeId}>
              {/* Road shadow */}
              <line
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="hsl(var(--foreground))"
                strokeWidth={getEdgeWidth(edge) + 4}
                strokeLinecap="round"
                opacity={0.1}
              />
              
              {/* Main road */}
              <line
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke={getEdgeColor(edge)}
                strokeWidth={getEdgeWidth(edge)}
                strokeLinecap="round"
                strokeDasharray={isEdgeInAlternate(edge) && !inPath ? "6 4" : undefined}
                className="cursor-pointer"
                onClick={() => onEdgeSelect(isSelected ? null : edgeId)}
              />
              
              {/* Traffic flow particles */}
              {!edge.isBlocked && renderTrafficFlow(edge, fromPos.x, fromPos.y, toPos.x, toPos.y)}
              
              {isSelected && (
                <g transform={`translate(${(fromPos.x + toPos.x) / 2}, ${(fromPos.y + toPos.y) / 2})`}>
                  <rect
                    x={-16}
                    y={-9}
                    width={32}
                    height={16}
                    fill="hsl(var(--background))"
                    stroke={getEdgeColor(edge)}
                    strokeWidth={1}
                  />
                  <text
                    textAnchor="middle"
                    dy="4"
                    className="fill-foreground font-mono text-[10px]"
                  >
                    {edge.weight} min
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Nodes (Intersections) */}
        {nodes.map(node => {
          const isInPath = highlightedPath.includes(node.id);
          const isStart = liveId === node.id || highlightedPath[0] === node.id;
          const isEnd = destId === node.id || highlightedPath[highlightedPath.length - 1] === node.id;
          const isVia = viaId === node.id;
          const isCurrent = currentNode === node.id;
          
          return (
            <g 
              key={node.id}
              className="cursor-pointer"
              onClick={() => onNodeSelect?.(node.id)}
            >
              {/* Ripple effect for current node */}
              {isCurrent && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={getNodeRadius(node.id)}
                  fill="none"
                  stroke={getNodeColor(node.id)}
                  strokeWidth={2}
                  initial={{ r: getNodeRadius(node.id), opacity: 0.8 }}
                  animate={{ r: getNodeRadius(node.id) * 2, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
              
              {/* Node shadow */}
              <circle
                cx={node.x}
                cy={node.y + 2}
                r={getNodeRadius(node.id)}
                fill="hsl(var(--foreground))"
                opacity={0.15}
              />
              
              {/* Main node */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={getNodeRadius(node.id)}
                fill={getNodeColor(node.id)}
                stroke="hsl(var(--background))"
                strokeWidth={3}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              />
              
              {/* Start/End indicators */}
              {isStart && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={5}
                  fill="hsl(var(--background))"
                />
              )}
              {isEnd && (
                <polygon
                  points={`${node.x},${node.y - 4} ${node.x + 4},${node.y + 3} ${node.x - 4},${node.y + 3}`}
                  fill="hsl(var(--background))"
                />
              )}
              
              <text
                x={node.x}
                y={node.y + getNodeRadius(node.id) + 14}
                textAnchor="middle"
                className="fill-foreground font-sans text-[10px]"
              >
                {node.label}
              </text>
            </g>
          );
        })}

      </svg>

      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div className="pointer-events-auto dashboard-card max-w-md px-6 py-8 text-center">
            <p className="stamp mb-2">Empty board</p>
            <h2 className="mb-2 font-mono text-lg tracking-[0.18em]">NO SECTOR LOADED</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              The desk starts dark. Load a city template, import a graph, or draw junctions in Builder.
            </p>
            <button
              type="button"
              onClick={onLoadCities}
              className="h-11 w-full rounded-sm border border-primary bg-primary px-4 font-mono text-[11px] uppercase tracking-[0.16em] text-primary-foreground"
            >
              Open city templates
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficMapCanvas;
