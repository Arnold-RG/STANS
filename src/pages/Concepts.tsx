import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DeskChrome } from "@/components/live/DeskChrome";
import { usePageTitle } from "@/hooks/usePageTitle";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

const algorithms = [
  {
    id: "kruskal",
    name: "Kruskal's Algorithm",
    realWorldAnalogy: "Imagine you're a city planner tasked with connecting all neighborhoods with roads, but you have a limited budget. Kruskal's algorithm helps you build the cheapest possible road network that still connects every neighborhood. You start by listing all possible roads sorted by cost, then add the cheapest roads one by one—but only if they connect previously unconnected areas.",
    pseudoCode: `function Kruskal(Graph G):
    MST = empty set
    Sort all edges by weight (ascending)
    Initialize Union-Find structure
    
    for each edge (u, v) in sorted edges:
        if Find(u) ≠ Find(v):
            Add edge (u, v) to MST
            Union(u, v)
    
    return MST`,
    codeSnippet: `// From src/utils/kruskal.ts
const sortedEdges = [...edges]
  .filter(e => !e.isBlocked)
  .sort((a, b) => getEffectiveWeight(a) - getEffectiveWeight(b));

for (const edge of sortedEdges) {
  if (uf.find(edge.from) !== uf.find(edge.to)) {
    uf.union(edge.from, edge.to);
    currentMST.push(edge);
    // Edge accepted into MST
  }
}`,
    explanations: [
      { line: "Sort edges by weight", concept: "Greedy approach - always pick the smallest edge first" },
      { line: "find(edge.from) !== find(edge.to)", concept: "Union-Find check - ensures no cycles are formed" },
      { line: "union(edge.from, edge.to)", concept: "Merge the two components into one" },
    ],
    complexity: { time: "O(E log E)", space: "O(V)" },
  },
  {
    id: "dijkstra",
    name: "Dijkstra's Algorithm",
    realWorldAnalogy: "Think of GPS navigation. When you ask for directions, Dijkstra's algorithm explores outward from your location like ripples in a pond. It keeps track of the shortest known distance to each intersection, always expanding from the closest unvisited point. This guarantees finding the absolute shortest path to your destination.",
    pseudoCode: `function Dijkstra(Graph G, source s):
    dist[v] = ∞ for all v
    dist[s] = 0
    PriorityQueue Q = all vertices
    
    while Q is not empty:
        u = vertex with min dist in Q
        for each neighbor v of u:
            alt = dist[u] + weight(u, v)
            if alt < dist[v]:
                dist[v] = alt
                prev[v] = u
    
    return dist, prev`,
    codeSnippet: `// From src/utils/dijkstra.ts
while (unvisited.size > 0) {
  // Find minimum distance node
  let minNode = null;
  let minDist = Infinity;
  for (const node of unvisited) {
    if (distances.get(node)! < minDist) {
      minDist = distances.get(node)!;
      minNode = node;
    }
  }
  
  // Update neighbor distances
  for (const { neighbor, edge } of getNeighbors(current, edges)) {
    const alt = distances.get(current)! + getEffectiveWeight(edge);
    if (alt < distances.get(neighbor)!) {
      distances.set(neighbor, alt);
      previous.set(neighbor, current);
    }
  }
}`,
    explanations: [
      { line: "Find minimum distance node", concept: "Greedy selection - always process closest node first" },
      { line: "alt = dist + weight", concept: "Relaxation - check if new path is shorter" },
      { line: "previous.set(neighbor, current)", concept: "Track path for reconstruction" },
    ],
    complexity: { time: "O(V² or O(E log V) with heap)", space: "O(V)" },
  },
  {
    id: "prim",
    name: "Prim's Algorithm",
    realWorldAnalogy: "Like growing a tree from a seed. You start at one intersection and grow your road network outward, always adding the cheapest road that connects a new neighborhood to your existing network. Unlike Kruskal's which considers all roads globally, Prim's grows from a single point.",
    pseudoCode: `function Prim(Graph G, start s):
    MST = empty set
    visited = {s}
    
    while visited ≠ all vertices:
        Find minimum edge (u,v) where:
            u ∈ visited AND v ∉ visited
        Add edge (u,v) to MST
        Add v to visited
    
    return MST`,
    codeSnippet: `// From src/utils/prim.ts
while (visited.size < nodes.length) {
  let minEdge = null;
  let minWeight = Infinity;
  
  for (const edge of edges) {
    const fromVisited = visited.has(edge.from);
    const toVisited = visited.has(edge.to);
    
    // One end visited, one not
    if (fromVisited !== toVisited) {
      const weight = getEffectiveWeight(edge);
      if (weight < minWeight) {
        minWeight = weight;
        minEdge = edge;
      }
    }
  }
  
  visited.add(newNode);
  currentMST.push(minEdge);
}`,
    explanations: [
      { line: "fromVisited !== toVisited", concept: "Edge must connect visited to unvisited" },
      { line: "Find minimum weight edge", concept: "Greedy - pick cheapest connection" },
      { line: "visited.add(newNode)", concept: "Grow the tree by one node" },
    ],
    complexity: { time: "O(V² or O(E log V) with heap)", space: "O(V)" },
  },
];

const Concepts = () => {
  usePageTitle("Concepts — STANS");

  return (
    <DeskChrome section="concepts">
      <main id="page-main" className="reading">
        <p className="eyebrow">Concepts</p>
        <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">Three ways to read a road network</h1>
        <p className="reading-prose mt-5 text-lg leading-relaxed text-muted-foreground">
          Kruskal, Dijkstra, and Prim, in plain language, with the code that actually runs in{" "}
          <code className="font-mono text-[0.9em] text-foreground">src/utils</code>. On the desk they
          run after you extract the highways in view.
        </p>

        <div className="mt-14 space-y-10">
          {algorithms.map((algo) => (
            <Card key={algo.id} className="overflow-hidden border-border bg-card/80">
              <CardHeader className="border-b border-border px-6 py-6 sm:px-8">
                <p className="eyebrow">{algo.complexity.time}</p>
                <CardTitle className="mt-2 font-display text-3xl font-medium tracking-tight">{algo.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
                <p className="max-w-3xl text-[1.02rem] leading-relaxed">{algo.realWorldAnalogy}</p>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="pseudo">
                    <AccordionTrigger className="text-base">Pseudocode</AccordionTrigger>
                    <AccordionContent>
                      <SyntaxHighlighter language="plaintext" style={atomOneDark} className="rounded-sm text-sm">
                        {algo.pseudoCode}
                      </SyntaxHighlighter>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="code">
                    <AccordionTrigger className="text-base">In this repository</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <SyntaxHighlighter language="typescript" style={atomOneDark} className="rounded-sm text-sm" showLineNumbers>
                        {algo.codeSnippet}
                      </SyntaxHighlighter>
                      <div className="space-y-3">
                        {algo.explanations.map((exp) => (
                          <p key={exp.line} className="text-sm leading-relaxed">
                            <span className="font-medium text-foreground">{exp.line}.</span>{" "}
                            <span className="text-muted-foreground">{exp.concept}</span>
                          </p>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <dl className="flex flex-wrap gap-8 border-t border-border pt-4">
                  <div>
                    <dt className="eyebrow">Time</dt>
                    <dd className="mt-1">
                      <Badge variant="secondary">{algo.complexity.time}</Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Space</dt>
                    <dd className="mt-1">
                      <Badge variant="secondary">{algo.complexity.space}</Badge>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-14 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The snippets above are from <code className="font-mono text-foreground">src/utils</code>. Extract highways
          on the desk and Dijkstra and Kruskal run on that graph.
        </p>
      </main>
    </DeskChrome>
  );
};

export default Concepts;
