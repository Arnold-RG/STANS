import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Map, FileJson, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GraphData {
  nodes: Array<{ id: string; label: string; x: number; y: number }>;
  edges: Array<{ from: string; to: string; weight: number; traffic: number; blocked: boolean }>;
}

interface GraphImportProps {
  onImportGraph?: (data: GraphData) => void;
  currentGraph?: GraphData;
}

const GraphImport: React.FC<GraphImportProps> = ({ onImportGraph, currentGraph }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let data: GraphData;

        if (file.name.endsWith('.json')) {
          data = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          data = parseCSV(content);
        } else {
          throw new Error('Unsupported file format');
        }

        validateGraphData(data);
        onImportGraph?.(data);
        toast.success(`Graph imported successfully from ${file.name}`);
      } catch (error) {
        toast.error(`Failed to import graph: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (content: string): GraphData => {
    const lines = content.split('\n').filter(line => line.trim());
    const nodes: GraphData['nodes'] = [];
    const edges: GraphData['edges'] = [];
    
    let parsingNodes = true;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      if (line.toLowerCase().includes('edges')) {
        parsingNodes = false;
        continue;
      }
      
      const parts = line.split(',').map(p => p.trim());
      
      if (parsingNodes) {
        // Format: id, label, x, y
        if (parts.length >= 4) {
          nodes.push({
            id: parts[0],
            label: parts[1],
            x: parseFloat(parts[2]),
            y: parseFloat(parts[3]),
          });
        }
      } else {
        // Format: from, to, weight, traffic, blocked
        if (parts.length >= 3) {
          edges.push({
            from: parts[0],
            to: parts[1],
            weight: parseFloat(parts[2]),
            traffic: parts.length >= 4 ? parseFloat(parts[3]) : 0.5,
            blocked: parts.length >= 5 ? parts[4].toLowerCase() === 'true' : false,
          });
        }
      }
    }
    
    return { nodes, edges };
  };

  const validateGraphData = (data: GraphData) => {
    if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      throw new Error('Invalid graph data: nodes array is missing or empty');
    }
    if (!data.edges || !Array.isArray(data.edges)) {
      throw new Error('Invalid graph data: edges array is missing');
    }
    
    // Validate node structure
    for (const node of data.nodes) {
      if (!node.id || !node.label || typeof node.x !== 'number' || typeof node.y !== 'number') {
        throw new Error('Invalid node structure');
      }
    }
    
    // Validate edge structure
    for (const edge of data.edges) {
      if (!edge.from || !edge.to || typeof edge.weight !== 'number') {
        throw new Error('Invalid edge structure');
      }
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    if (!currentGraph) {
      toast.error('No graph data to export');
      return;
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(currentGraph, null, 2);
      filename = 'graph-export.json';
      mimeType = 'application/json';
    } else {
      content = exportToCSV(currentGraph);
      filename = 'graph-export.csv';
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Graph exported as ${format.toUpperCase()}`);
  };

  const exportToCSV = (data: GraphData): string => {
    let csv = 'Nodes\nid,label,x,y\n';
    for (const node of data.nodes) {
      csv += `${node.id},${node.label},${node.x},${node.y}\n`;
    }
    
    csv += '\nEdges\nfrom,to,weight,traffic,blocked\n';
    for (const edge of data.edges) {
      csv += `${edge.from},${edge.to},${edge.weight},${edge.traffic},${edge.blocked}\n`;
    }
    
    return csv;
  };

  const handleFetchTrafficData = async () => {
    if (!apiKey) {
      toast.error('Please enter an API key');
      return;
    }

    setIsLoadingTraffic(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoadingTraffic(false);
      toast.success('Traffic data fetched successfully (simulated)');
      
      // In a real implementation, this would update the graph with real traffic data
      if (onImportGraph && currentGraph) {
        const updatedGraph = {
          ...currentGraph,
          edges: currentGraph.edges.map(edge => ({
            ...edge,
            traffic: Math.random(),
          })),
        };
        onImportGraph(updatedGraph);
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Import & Export Graph Data
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Load graph data from files or fetch real-time traffic information
        </p>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="traffic">Traffic API</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card className="p-6 border-traffic-medium/20 bg-background/50 backdrop-blur">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Upload Graph File</h3>
                <div className="border-2 border-dashed border-traffic-medium/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports JSON and CSV formats
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>JSON Format:</strong> {`{ "nodes": [...], "edges": [...] }`}
                  <br />
                  <strong>CSV Format:</strong> Separate sections for nodes and edges with headers
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Sample Data Structure</h4>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "nodes": [
    { "id": "A", "label": "Node A", "x": 100, "y": 100 }
  ],
  "edges": [
    { 
      "from": "A", 
      "to": "B", 
      "weight": 5, 
      "traffic": 0.7, 
      "blocked": false 
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card className="p-6 border-traffic-medium/20 bg-background/50 backdrop-blur">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Export Current Graph</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Download your current graph data in your preferred format
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 border-traffic-medium/20 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => handleExport('json')}>
                  <FileJson className="h-8 w-8 mb-3 text-primary" />
                  <h4 className="font-semibold mb-2">Export as JSON</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Machine-readable format with full data structure
                  </p>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                </Card>

                <Card className="p-6 border-traffic-medium/20 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => handleExport('csv')}>
                  <FileSpreadsheet className="h-8 w-8 mb-3 text-primary" />
                  <h4 className="font-semibold mb-2">Export as CSV</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Spreadsheet format for easy editing
                  </p>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </Card>
              </div>

              {currentGraph && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="font-semibold text-primary">{currentGraph.nodes.length}</div>
                    <div className="text-muted-foreground">Nodes</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="font-semibold text-primary">{currentGraph.edges.length}</div>
                    <div className="text-muted-foreground">Edges</div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <Card className="p-6 border-traffic-medium/20 bg-background/50 backdrop-blur">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Real-Time Traffic Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Connect to traffic APIs to get real-time traffic data for your routes
                </p>
              </div>

              <Alert>
                <Map className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  This feature integrates with Google Maps, OpenStreetMap, and other traffic APIs.
                  In this demo, traffic data is simulated.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="apiKey">API Key (Optional for Demo)</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your Google Maps API key..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Get your API key from{' '}
                    <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Google Cloud Console
                    </a>
                  </p>
                </div>

                <Button
                  onClick={handleFetchTrafficData}
                  disabled={isLoadingTraffic}
                  className="w-full"
                >
                  <Map className="h-4 w-4 mr-2" />
                  {isLoadingTraffic ? 'Fetching Traffic Data...' : 'Fetch Real-Time Traffic'}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-xs text-muted-foreground mb-1">Low Traffic</div>
                  <div className="font-semibold text-green-400">45%</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="text-xs text-muted-foreground mb-1">Moderate</div>
                  <div className="font-semibold text-amber-400">35%</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-xs text-muted-foreground mb-1">Heavy</div>
                  <div className="font-semibold text-red-400">20%</div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GraphImport;
