export interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  lat?: number;
  lon?: number;
}

export function nodeLabel(nodes: GraphNode[], id: string): string {
  return nodes.find((node) => node.id === id)?.label ?? id;
}
