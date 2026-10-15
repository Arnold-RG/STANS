import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Circle, MousePointer2 } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  isOnline: boolean;
}

interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

const CollaborativeGraph = () => {
  const [roomId, setRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [localCursor, setLocalCursor] = useState({ x: 0, y: 0 });

  // Simulated collaborative functionality.
  // A production build would sync rooms over a realtime backend.
  
  const generateUserId = () => `user-${Math.random().toString(36).substr(2, 9)}`;
  const generateUserColor = () => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const joinRoom = () => {
    if (!roomId.trim()) {
      toast.error("Please enter a room ID");
      return;
    }

    // Simulate joining a room
    const currentUser: User = {
      id: generateUserId(),
      name: `User ${Math.floor(Math.random() * 1000)}`,
      color: generateUserColor(),
      isOnline: true,
    };

    // Simulate other users in the room
    const mockUsers: User[] = [
      currentUser,
      {
        id: 'user-demo-1',
        name: 'Alice',
        color: '#3b82f6',
        cursor: { x: 150, y: 200 },
        isOnline: true,
      },
      {
        id: 'user-demo-2',
        name: 'Bob',
        color: '#10b981',
        cursor: { x: 400, y: 150 },
        isOnline: true,
      },
    ];

    setUsers(mockUsers);
    setIsConnected(true);
    
    // Simulate initial graph data
    setNodes([
      { id: 'A', x: 200, y: 150, label: 'A' },
      { id: 'B', x: 400, y: 150, label: 'B' },
      { id: 'C', x: 300, y: 300, label: 'C' },
    ]);
    
    setEdges([
      { from: 'A', to: 'B', weight: 5 },
      { from: 'B', to: 'C', weight: 3 },
      { from: 'C', to: 'A', weight: 7 },
    ]);

    toast.success(`Connected to room: ${roomId}`);
  };

  const leaveRoom = () => {
    setIsConnected(false);
    setUsers([]);
    setNodes([]);
    setEdges([]);
    toast.info("Left the room");
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLocalCursor({ x, y });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            Real-Time Collaborative Editing
          </CardTitle>
          <CardDescription>
            Work on the same graph simultaneously with multiple users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter room ID (e.g., graph-session-123)"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                />
                <Button onClick={joinRoom}>Join Room</Button>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This desk shows the collaboration interface with simulated users.
                  A live room would sync over a realtime backend.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                    Connected to: {roomId}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {users.map(user => (
                      <Avatar key={user.id} className="w-8 h-8" style={{ borderColor: user.color, borderWidth: 2 }}>
                        <AvatarFallback style={{ backgroundColor: user.color, color: 'white' }}>
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
                <Button variant="destructive" onClick={leaveRoom}>Leave Room</Button>
              </div>

              <Card className="border-2">
                <CardContent className="p-0">
                  <svg 
                    width="100%" 
                    height="500" 
                    className="bg-background"
                    onMouseMove={handleMouseMove}
                  >
                    {/* Draw edges */}
                    {edges.map((edge, idx) => {
                      const fromNode = nodes.find(n => n.id === edge.from);
                      const toNode = nodes.find(n => n.id === edge.to);
                      if (!fromNode || !toNode) return null;
                      
                      return (
                        <g key={idx}>
                          <line
                            x1={fromNode.x}
                            y1={fromNode.y}
                            x2={toNode.x}
                            y2={toNode.y}
                            stroke="hsl(var(--border))"
                            strokeWidth="2"
                          />
                          <text
                            x={(fromNode.x + toNode.x) / 2}
                            y={(fromNode.y + toNode.y) / 2}
                            fill="hsl(var(--foreground))"
                            fontSize="12"
                            textAnchor="middle"
                          >
                            {edge.weight}
                          </text>
                        </g>
                      );
                    })}

                    {/* Draw nodes */}
                    {nodes.map(node => (
                      <g key={node.id}>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="25"
                          fill="hsl(var(--primary))"
                          stroke="hsl(var(--primary-foreground))"
                          strokeWidth="2"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        />
                        <text
                          x={node.x}
                          y={node.y}
                          fill="hsl(var(--primary-foreground))"
                          fontSize="16"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {node.label}
                        </text>
                      </g>
                    ))}

                    {/* Draw user cursors */}
                    {users.map(user => user.cursor && user.id !== users[0].id && (
                      <g key={user.id}>
                        <MousePointer2
                          x={user.cursor.x}
                          y={user.cursor.y}
                          width="20"
                          height="20"
                          fill={user.color}
                          className="drop-shadow-lg"
                        />
                        <text
                          x={user.cursor.x + 25}
                          y={user.cursor.y}
                          fill={user.color}
                          fontSize="12"
                          fontWeight="bold"
                          className="drop-shadow"
                        >
                          {user.name}
                        </text>
                      </g>
                    ))}
                  </svg>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {users.map(user => (
                        <div key={user.id} className="flex items-center gap-2">
                          <Circle 
                            className="w-2 h-2 fill-current" 
                            style={{ color: user.color }}
                          />
                          <span className="text-sm">{user.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Recent Changes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• Alice added node D</p>
                      <p>• Bob modified edge A-B</p>
                      <p>• You joined the session</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>Click to add nodes</p>
                    <p>Drag between nodes to add edges</p>
                    <p>Right-click to delete</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isConnected && (
        <Card className="border-accent">
          <CardHeader>
            <CardTitle className="text-sm">Enable Real-Time Collaboration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Real-time collaborative editing with live pointer positions would connect
              to a realtime backend. This view is a local demonstration.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Planned room features:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Real-time cursor tracking for all users</li>
                <li>Synchronized graph modifications</li>
                <li>User presence detection</li>
                <li>Persistent room sessions</li>
                <li>Change history and undo/redo</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CollaborativeGraph;