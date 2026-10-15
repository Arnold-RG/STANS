import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Database, TrendingUp, Zap } from "lucide-react";

const ComplexityAnalysis = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="font-display">Algorithm Complexity Analysis</CardTitle>
          <CardDescription>
            Detailed time and space complexity breakdown for graph algorithms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overview Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-accent/10 border-accent/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold">Time</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Measures operations as input grows
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary/10 border-secondary/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-5 h-5 text-secondary" />
                  <h3 className="font-semibold">Space</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Memory used during execution
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary/10 border-primary/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">V & E</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  V = vertices (nodes), E = edges
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-foreground" />
                  <h3 className="font-semibold">Best Case</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Optimal conditions scenario
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Complexity Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Complexity Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Algorithm</TableHead>
                    <TableHead>Time (Best)</TableHead>
                    <TableHead>Time (Average)</TableHead>
                    <TableHead>Time (Worst)</TableHead>
                    <TableHead>Space</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">Kruskal's MST</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(E log E)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(E log E)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(E log E)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(V)
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Prim's MST</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(E log V)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(E log V)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(E log V)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(V)
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Dijkstra's Shortest Path</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(E + V log V)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O((V+E) log V)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(V²)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(V)
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Union-Find</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(α(n))
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(α(n))
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(log n)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        O(n)
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Kruskal's */}
            <Card className="border-2 border-accent/50">
              <CardHeader>
                <CardTitle className="text-lg font-display text-accent">
                  Kruskal's Algorithm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Operations Breakdown:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>1. Sort edges: <code className="text-xs bg-muted px-1 rounded">O(E log E)</code></li>
                    <li>2. Iterate edges: <code className="text-xs bg-muted px-1 rounded">O(E)</code></li>
                    <li>3. Union-Find per edge: <code className="text-xs bg-muted px-1 rounded">O(α(V))</code></li>
                    <li>4. Total: <code className="text-xs bg-muted px-1 rounded">O(E log E)</code></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Space Usage:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Union-Find arrays: O(V)</li>
                    <li>• Edge array storage: O(E)</li>
                    <li>• MST result array: O(V-1)</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> α(n) is the inverse Ackermann function, 
                    practically constant (≤ 4 for all realistic inputs)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Prim's */}
            <Card className="border-2 border-secondary/50">
              <CardHeader>
                <CardTitle className="text-lg font-display text-secondary">
                  Prim's Algorithm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Operations Breakdown:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>1. Initialize: <code className="text-xs bg-muted px-1 rounded">O(V)</code></li>
                    <li>2. Extract min: <code className="text-xs bg-muted px-1 rounded">O(V log V)</code></li>
                    <li>3. Update neighbors: <code className="text-xs bg-muted px-1 rounded">O(E log V)</code></li>
                    <li>4. Total: <code className="text-xs bg-muted px-1 rounded">O(E log V)</code></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Space Usage:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Priority queue: O(V)</li>
                    <li>• Visited set: O(V)</li>
                    <li>• MST result: O(V-1)</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <strong>Best with:</strong> Dense graphs where E ≈ V². 
                    More efficient than Kruskal's when E is large.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dijkstra's */}
            <Card className="border-2 border-primary/50">
              <CardHeader>
                <CardTitle className="text-lg font-display text-primary">
                  Dijkstra's Algorithm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Operations Breakdown:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>1. Initialize: <code className="text-xs bg-muted px-1 rounded">O(V)</code></li>
                    <li>2. Visit all nodes: <code className="text-xs bg-muted px-1 rounded">O(V)</code></li>
                    <li>3. Update distances: <code className="text-xs bg-muted px-1 rounded">O(E log V)</code></li>
                    <li>4. Total: <code className="text-xs bg-muted px-1 rounded">O((V+E) log V)</code></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Space Usage:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Distance array: O(V)</li>
                    <li>• Previous array: O(V)</li>
                    <li>• Priority queue: O(V)</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <strong>Limitation:</strong> Cannot handle negative edge weights. 
                    Use Bellman-Ford for graphs with negative edges.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Big-O Notation Guide */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg font-display">Big-O Notation Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">O(1)</Badge>
                    <span className="text-muted-foreground">Constant - Direct access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">O(log n)</Badge>
                    <span className="text-muted-foreground">Logarithmic - Binary search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">O(n)</Badge>
                    <span className="text-muted-foreground">Linear - Single loop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">O(n log n)</Badge>
                    <span className="text-muted-foreground">Linearithmic - Efficient sort</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">O(n²)</Badge>
                    <span className="text-muted-foreground">Quadratic - Nested loops</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">O(2ⁿ)</Badge>
                    <span className="text-muted-foreground">Exponential - Recursive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">O(α(n))</Badge>
                    <span className="text-muted-foreground">Inverse Ackermann - Near constant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">O(V+E)</Badge>
                    <span className="text-muted-foreground">Graph traversal - Visit all</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplexityAnalysis;
