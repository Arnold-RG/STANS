import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere } from '@react-three/drei';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import * as THREE from 'three';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface Edge {
  from: string;
  to: string;
  weight: number;
  traffic: number;
  blocked: boolean;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface Graph3DProps {
  graphData?: GraphData;
}

const Node3D: React.FC<{ 
  position: [number, number, number]; 
  label: string; 
  color: string;
  isHighlighted?: boolean;
}> = ({ position, label, color, isHighlighted }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current && isHighlighted) {
      meshRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.1);
    }
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[0.3, 32, 32]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isHighlighted ? 0.5 : 0.2} />
      </Sphere>
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

const Edge3D: React.FC<{ 
  start: [number, number, number]; 
  end: [number, number, number];
  color: string;
  weight: number;
  traffic: number;
}> = ({ start, end, color, weight, traffic }) => {
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  const midpoint = new THREE.Vector3(
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2 + 0.2
  );

  return (
    <group>
      <Line points={points} color={color} lineWidth={2 + traffic * 3} />
      <Text
        position={[midpoint.x, midpoint.y, midpoint.z]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {weight}
      </Text>
    </group>
  );
};

const Scene: React.FC<{ graphData: GraphData }> = ({ graphData }) => {
  // Convert 2D positions to 3D (normalize and center)
  const maxX = Math.max(...graphData.nodes.map(n => n.x));
  const maxY = Math.max(...graphData.nodes.map(n => n.y));
  const scale = 5;

  const getNode3DPosition = (node: Node): [number, number, number] => {
    const x = (node.x / maxX - 0.5) * scale;
    const y = (node.y / maxY - 0.5) * scale;
    const z = Math.sin(node.x * 0.5) * 2; // Add Z variation for 3D effect
    return [x, y, z];
  };

  const getTrafficColor = (traffic: number, blocked: boolean) => {
    if (blocked) return '#ef4444';
    if (traffic > 0.7) return '#f59e0b';
    if (traffic > 0.4) return '#10b981';
    return '#3b82f6';
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {graphData.edges.map((edge, idx) => {
        const fromNode = graphData.nodes.find(n => n.id === edge.from);
        const toNode = graphData.nodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) return null;

        const startPos = getNode3DPosition(fromNode);
        const endPos = getNode3DPosition(toNode);
        const color = getTrafficColor(edge.traffic, edge.blocked);

        return (
          <Edge3D
            key={idx}
            start={startPos}
            end={endPos}
            color={color}
            weight={edge.weight}
            traffic={edge.traffic}
          />
        );
      })}

      {graphData.nodes.map((node) => (
        <Node3D
          key={node.id}
          position={getNode3DPosition(node)}
          label={node.label}
          color="#06b6d4"
        />
      ))}

      <OrbitControls 
        enableDamping 
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={5}
        maxDistance={20}
      />
    </>
  );
};

const Graph3D: React.FC<Graph3DProps> = ({ graphData }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Default graph data if none provided
  const defaultGraphData: GraphData = {
    nodes: [
      { id: 'A', label: 'A', x: 100, y: 100 },
      { id: 'B', label: 'B', x: 300, y: 100 },
      { id: 'C', label: 'C', x: 500, y: 100 },
      { id: 'D', label: 'D', x: 200, y: 300 },
      { id: 'E', label: 'E', x: 400, y: 300 },
      { id: 'F', label: 'F', x: 300, y: 500 },
    ],
    edges: [
      { from: 'A', to: 'B', weight: 4, traffic: 0.3, blocked: false },
      { from: 'A', to: 'D', weight: 6, traffic: 0.5, blocked: false },
      { from: 'B', to: 'C', weight: 5, traffic: 0.7, blocked: false },
      { from: 'B', to: 'E', weight: 7, traffic: 0.4, blocked: false },
      { from: 'C', to: 'E', weight: 3, traffic: 0.2, blocked: false },
      { from: 'D', to: 'E', weight: 8, traffic: 0.6, blocked: false },
      { from: 'D', to: 'F', weight: 9, traffic: 0.8, blocked: false },
      { from: 'E', to: 'F', weight: 4, traffic: 0.3, blocked: false },
    ],
  };

  const data = graphData || defaultGraphData;

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'space-y-6'}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            3D Network Visualization
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive 3D view of multi-layer traffic network
          </p>
        </div>
        <Button
          onClick={() => setIsFullscreen(!isFullscreen)}
          variant="outline"
          size="sm"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      <Card className="p-6 border-traffic-medium/20 bg-background/50 backdrop-blur">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
              Low Traffic
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 border-green-500/20">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
              Moderate Traffic
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20">
              <div className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
              Heavy Traffic
            </Badge>
            <Badge variant="outline" className="bg-red-500/10 border-red-500/20">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
              Blocked
            </Badge>
          </div>

          <div className={isFullscreen ? 'h-screen' : 'h-[600px]'} style={{ background: 'linear-gradient(to bottom, hsl(var(--background)), hsl(var(--background-secondary)))' }}>
            <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
              <Scene graphData={data} />
            </Canvas>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="font-semibold text-primary">{data.nodes.length}</div>
              <div className="text-muted-foreground">Nodes</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="font-semibold text-primary">{data.edges.length}</div>
              <div className="text-muted-foreground">Edges</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="font-semibold text-primary">
                {data.edges.filter(e => e.blocked).length}
              </div>
              <div className="text-muted-foreground">Blocked</div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>Left Click + Drag:</strong> Rotate view</p>
            <p>• <strong>Right Click + Drag:</strong> Pan view</p>
            <p>• <strong>Scroll:</strong> Zoom in/out</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Graph3D;
