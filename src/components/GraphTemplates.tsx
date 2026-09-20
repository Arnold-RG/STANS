import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Edge } from "@/utils/kruskal";
import type { MapType } from "@/components/maps/PakistanMapSVG";
import { cloneKarachiNetwork } from "@/data/karachiNetwork";

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface GraphTemplatesProps {
  onLoadTemplate: (nodes: Node[], edges: Edge[], mapType?: MapType) => void;
}

const GraphTemplates = ({ onLoadTemplate }: GraphTemplatesProps) => {
  // ===== GRAPH TEMPLATES =====
  const generateGrid = () => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const gridSize = 4;
    const spacing = 100;
    const offsetX = 50;
    const offsetY = 50;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const id = String.fromCharCode(65 + row * gridSize + col);
        nodes.push({
          id,
          x: offsetX + col * spacing,
          y: offsetY + row * spacing,
          label: `Node ${id}`,
        });
      }
    }

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const currentId = String.fromCharCode(65 + row * gridSize + col);
        if (col < gridSize - 1) {
          const rightId = String.fromCharCode(65 + row * gridSize + col + 1);
          edges.push({
            from: currentId,
            to: rightId,
            weight: Math.floor(Math.random() * 10) + 3,
            traffic: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as "low" | "medium" | "high",
            isBlocked: false,
          });
        }
        if (row < gridSize - 1) {
          const downId = String.fromCharCode(65 + (row + 1) * gridSize + col);
          edges.push({
            from: currentId,
            to: downId,
            weight: Math.floor(Math.random() * 10) + 3,
            traffic: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as "low" | "medium" | "high",
            isBlocked: false,
          });
        }
      }
    }

    onLoadTemplate(nodes, edges);
    toast.success("Grid topology loaded");
  };

  const generateTree = () => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const levels = 4;
    const baseSpacing = 200;

    let nodeIndex = 0;
    
    for (let level = 0; level < levels; level++) {
      const nodesInLevel = Math.pow(2, level);
      const levelSpacing = baseSpacing / Math.pow(2, level);
      const startX = 400 - (levelSpacing * (nodesInLevel - 1)) / 2;

      for (let i = 0; i < nodesInLevel && nodeIndex < 15; i++) {
        const id = String.fromCharCode(65 + nodeIndex);
        nodes.push({
          id,
          x: startX + i * levelSpacing,
          y: 50 + level * 100,
          label: `Node ${id}`,
        });

        if (level > 0) {
          const parentIndex = Math.floor((nodeIndex - Math.pow(2, level) + 1) / 2) + Math.pow(2, level - 1) - 1;
          if (parentIndex >= 0 && parentIndex < nodeIndex) {
            const parentId = String.fromCharCode(65 + parentIndex);
            edges.push({
              from: parentId,
              to: id,
              weight: Math.floor(Math.random() * 8) + 2,
              traffic: ["low", "medium"][Math.floor(Math.random() * 2)] as "low" | "medium",
              isBlocked: false,
            });
          }
        }

        nodeIndex++;
      }
    }

    onLoadTemplate(nodes, edges);
    toast.success("Tree topology loaded");
  };

  const generateComplete = () => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeCount = 6;
    const radius = 150;
    const centerX = 400;
    const centerY = 200;

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i * 2 * Math.PI) / nodeCount - Math.PI / 2;
      const id = String.fromCharCode(65 + i);
      nodes.push({
        id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        label: `Node ${id}`,
      });
    }

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        edges.push({
          from: String.fromCharCode(65 + i),
          to: String.fromCharCode(65 + j),
          weight: Math.floor(Math.random() * 12) + 2,
          traffic: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as "low" | "medium" | "high",
          isBlocked: Math.random() < 0.1,
        });
      }
    }

    onLoadTemplate(nodes, edges);
    toast.success("Complete graph loaded");
  };

  const generateBipartite = () => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const setACount = 4;
    const setBCount = 5;
    const spacingY = 80;
    const offsetXA = 150;
    const offsetXB = 550;
    const startY = 80;

    for (let i = 0; i < setACount; i++) {
      const id = String.fromCharCode(65 + i);
      nodes.push({
        id,
        x: offsetXA,
        y: startY + i * spacingY,
        label: `Node ${id}`,
      });
    }

    for (let i = 0; i < setBCount; i++) {
      const id = String.fromCharCode(65 + setACount + i);
      nodes.push({
        id,
        x: offsetXB,
        y: startY + i * spacingY - 40,
        label: `Node ${id}`,
      });
    }

    for (let i = 0; i < setACount; i++) {
      for (let j = 0; j < setBCount; j++) {
        if (Math.random() < 0.6) {
          edges.push({
            from: String.fromCharCode(65 + i),
            to: String.fromCharCode(65 + setACount + j),
            weight: Math.floor(Math.random() * 10) + 3,
            traffic: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as "low" | "medium" | "high",
            isBlocked: false,
          });
        }
      }
    }

    onLoadTemplate(nodes, edges);
    toast.success("Bipartite graph loaded");
  };

  const generateStar = () => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const outerNodes = 8;
    const radius = 180;
    const centerX = 400;
    const centerY = 200;

    nodes.push({
      id: "A",
      x: centerX,
      y: centerY,
      label: "Node A",
    });

    for (let i = 0; i < outerNodes; i++) {
      const angle = (i * 2 * Math.PI) / outerNodes;
      const id = String.fromCharCode(66 + i);
      nodes.push({
        id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        label: `Node ${id}`,
      });

      edges.push({
        from: "A",
        to: id,
        weight: Math.floor(Math.random() * 10) + 2,
        traffic: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as "low" | "medium" | "high",
        isBlocked: false,
      });
    }

    onLoadTemplate(nodes, edges);
    toast.success("Star topology loaded");
  };

  // ===== PAKISTAN MAPS =====
  const generatePakistanMap = () => {
    const nodes: Node[] = [
      { id: "KHI", x: 680, y: 420, label: "Karachi" },
      { id: "LHR", x: 480, y: 200, label: "Lahore" },
      { id: "ISB", x: 420, y: 120, label: "Islamabad" },
      { id: "RWP", x: 430, y: 110, label: "Rawalpindi" },
      { id: "FSD", x: 400, y: 220, label: "Faisalabad" },
      { id: "MUL", x: 350, y: 300, label: "Multan" },
      { id: "PSH", x: 300, y: 80, label: "Peshawar" },
      { id: "QTA", x: 180, y: 280, label: "Quetta" },
      { id: "HYD", x: 600, y: 380, label: "Hyderabad" },
      { id: "SKT", x: 460, y: 170, label: "Sialkot" },
      { id: "GUJ", x: 440, y: 180, label: "Gujranwala" },
      { id: "BWP", x: 320, y: 340, label: "Bahawalpur" },
      { id: "SGD", x: 380, y: 210, label: "Sargodha" },
      { id: "SKR", x: 530, y: 320, label: "Sukkur" },
    ];

    const edges: Edge[] = [
      { from: "KHI", to: "HYD", weight: 165, traffic: "high", isBlocked: false },
      { from: "KHI", to: "SKR", weight: 450, traffic: "medium", isBlocked: false },
      { from: "LHR", to: "ISB", weight: 380, traffic: "high", isBlocked: false },
      { from: "LHR", to: "FSD", weight: 130, traffic: "high", isBlocked: false },
      { from: "LHR", to: "MUL", weight: 350, traffic: "medium", isBlocked: false },
      { from: "ISB", to: "RWP", weight: 15, traffic: "high", isBlocked: false },
      { from: "ISB", to: "PSH", weight: 180, traffic: "high", isBlocked: false },
      { from: "FSD", to: "MUL", weight: 240, traffic: "medium", isBlocked: false },
      { from: "FSD", to: "SKT", weight: 220, traffic: "medium", isBlocked: false },
      { from: "MUL", to: "BWP", weight: 90, traffic: "low", isBlocked: false },
      { from: "QTA", to: "MUL", weight: 600, traffic: "low", isBlocked: false },
      { from: "QTA", to: "KHI", weight: 700, traffic: "medium", isBlocked: false },
      { from: "HYD", to: "SKR", weight: 300, traffic: "medium", isBlocked: false },
      { from: "SKT", to: "GUJ", weight: 50, traffic: "medium", isBlocked: false },
      { from: "GUJ", to: "LHR", weight: 70, traffic: "high", isBlocked: false },
      { from: "SKR", to: "MUL", weight: 400, traffic: "medium", isBlocked: false },
      { from: "SGD", to: "FSD", weight: 110, traffic: "medium", isBlocked: false },
      { from: "SGD", to: "LHR", weight: 190, traffic: "medium", isBlocked: false },
    ];

    onLoadTemplate(nodes, edges, 'pakistan');
    toast.success("Pakistan road network loaded");
  };

  const generateKarachiMap = () => {
    const { nodes, edges, mapType } = cloneKarachiNetwork();
    onLoadTemplate(nodes, edges, mapType);
    toast.success("Karachi is on the board");
  };

  // Lahore City Map
  const generateLahoreMap = () => {
    const nodes: Node[] = [
      { id: "GLB", x: 300, y: 200, label: "Gulberg" },
      { id: "DHA", x: 200, y: 350, label: "DHA" },
      { id: "MDL", x: 350, y: 150, label: "Model Town" },
      { id: "JHR", x: 450, y: 200, label: "Johar Town" },
      { id: "TWN", x: 500, y: 280, label: "Township" },
      { id: "GAR", x: 380, y: 80, label: "Garden Town" },
      { id: "IQB", x: 280, y: 100, label: "Iqbal Town" },
      { id: "WAP", x: 400, y: 350, label: "Wapda Town" },
      { id: "CAN", x: 150, y: 200, label: "Cantt" },
      { id: "FRT", x: 220, y: 120, label: "Ferozepur Road" },
      { id: "SHD", x: 550, y: 150, label: "Shahdara" },
      { id: "BDP", x: 500, y: 100, label: "Badami Bagh" },
      { id: "LCO", x: 320, y: 50, label: "Lahore Old City" },
      { id: "ANR", x: 180, y: 50, label: "Anarkali" },
      { id: "SHL", x: 100, y: 120, label: "Shalimar" },
      { id: "RVN", x: 250, y: 280, label: "Ravi Town" },
      { id: "ALM", x: 350, y: 280, label: "Allama Iqbal Town" },
      { id: "PKT", x: 130, y: 280, label: "Pak Town" },
    ];

    const edges: Edge[] = [
      { from: "GLB", to: "DHA", weight: 10, traffic: "high", isBlocked: false },
      { from: "GLB", to: "MDL", weight: 6, traffic: "high", isBlocked: false },
      { from: "GLB", to: "CAN", weight: 8, traffic: "high", isBlocked: false },
      { from: "GLB", to: "FRT", weight: 5, traffic: "medium", isBlocked: false },
      { from: "DHA", to: "CAN", weight: 7, traffic: "medium", isBlocked: false },
      { from: "DHA", to: "PKT", weight: 6, traffic: "low", isBlocked: false },
      { from: "DHA", to: "RVN", weight: 8, traffic: "medium", isBlocked: false },
      { from: "MDL", to: "JHR", weight: 7, traffic: "high", isBlocked: false },
      { from: "MDL", to: "GAR", weight: 5, traffic: "medium", isBlocked: false },
      { from: "JHR", to: "TWN", weight: 8, traffic: "high", isBlocked: false },
      { from: "JHR", to: "WAP", weight: 6, traffic: "medium", isBlocked: false },
      { from: "GAR", to: "IQB", weight: 5, traffic: "medium", isBlocked: false },
      { from: "GAR", to: "LCO", weight: 7, traffic: "high", isBlocked: false },
      { from: "IQB", to: "FRT", weight: 4, traffic: "medium", isBlocked: false },
      { from: "IQB", to: "ANR", weight: 6, traffic: "high", isBlocked: false },
      { from: "LCO", to: "BDP", weight: 5, traffic: "medium", isBlocked: false },
      { from: "LCO", to: "ANR", weight: 4, traffic: "high", isBlocked: false },
      { from: "BDP", to: "SHD", weight: 6, traffic: "medium", isBlocked: false },
      { from: "SHD", to: "TWN", weight: 10, traffic: "medium", isBlocked: false },
      { from: "ANR", to: "SHL", weight: 6, traffic: "medium", isBlocked: false },
      { from: "CAN", to: "SHL", weight: 8, traffic: "low", isBlocked: false },
      { from: "RVN", to: "ALM", weight: 5, traffic: "medium", isBlocked: false },
      { from: "ALM", to: "WAP", weight: 6, traffic: "medium", isBlocked: false },
      { from: "ALM", to: "JHR", weight: 7, traffic: "high", isBlocked: false },
      { from: "TWN", to: "WAP", weight: 5, traffic: "medium", isBlocked: false },
    ];

    onLoadTemplate(nodes, edges, 'lahore');
    toast.success("Lahore city map loaded");
  };

  // Islamabad City Map
  const generateIslamabadMap = () => {
    const nodes: Node[] = [
      { id: "F6", x: 200, y: 150, label: "F-6 (Super Market)" },
      { id: "F7", x: 280, y: 150, label: "F-7 (Jinnah Super)" },
      { id: "F8", x: 360, y: 150, label: "F-8" },
      { id: "F10", x: 440, y: 150, label: "F-10" },
      { id: "F11", x: 520, y: 150, label: "F-11" },
      { id: "G6", x: 200, y: 230, label: "G-6" },
      { id: "G7", x: 280, y: 230, label: "G-7" },
      { id: "G8", x: 360, y: 230, label: "G-8" },
      { id: "G9", x: 440, y: 230, label: "G-9" },
      { id: "G10", x: 520, y: 230, label: "G-10" },
      { id: "G11", x: 600, y: 230, label: "G-11" },
      { id: "I8", x: 360, y: 310, label: "I-8" },
      { id: "I9", x: 440, y: 310, label: "I-9" },
      { id: "I10", x: 520, y: 310, label: "I-10" },
      { id: "BLU", x: 240, y: 80, label: "Blue Area" },
      { id: "E7", x: 130, y: 150, label: "E-7" },
      { id: "D12", x: 600, y: 150, label: "D-12" },
      { id: "H8", x: 360, y: 390, label: "H-8" },
      { id: "H9", x: 440, y: 390, label: "H-9" },
      { id: "PWD", x: 600, y: 310, label: "PWD" },
    ];

    const edges: Edge[] = [
      { from: "BLU", to: "F6", weight: 4, traffic: "high", isBlocked: false },
      { from: "BLU", to: "F7", weight: 5, traffic: "high", isBlocked: false },
      { from: "E7", to: "F6", weight: 3, traffic: "medium", isBlocked: false },
      { from: "F6", to: "F7", weight: 3, traffic: "high", isBlocked: false },
      { from: "F6", to: "G6", weight: 4, traffic: "medium", isBlocked: false },
      { from: "F7", to: "F8", weight: 3, traffic: "high", isBlocked: false },
      { from: "F7", to: "G7", weight: 4, traffic: "medium", isBlocked: false },
      { from: "F8", to: "F10", weight: 4, traffic: "medium", isBlocked: false },
      { from: "F8", to: "G8", weight: 4, traffic: "medium", isBlocked: false },
      { from: "F10", to: "F11", weight: 3, traffic: "medium", isBlocked: false },
      { from: "F10", to: "G9", weight: 5, traffic: "medium", isBlocked: false },
      { from: "F11", to: "D12", weight: 4, traffic: "low", isBlocked: false },
      { from: "F11", to: "G10", weight: 5, traffic: "medium", isBlocked: false },
      { from: "G6", to: "G7", weight: 3, traffic: "medium", isBlocked: false },
      { from: "G7", to: "G8", weight: 3, traffic: "medium", isBlocked: false },
      { from: "G8", to: "G9", weight: 3, traffic: "medium", isBlocked: false },
      { from: "G8", to: "I8", weight: 4, traffic: "medium", isBlocked: false },
      { from: "G9", to: "G10", weight: 3, traffic: "medium", isBlocked: false },
      { from: "G9", to: "I9", weight: 4, traffic: "medium", isBlocked: false },
      { from: "G10", to: "G11", weight: 3, traffic: "medium", isBlocked: false },
      { from: "G10", to: "I10", weight: 4, traffic: "medium", isBlocked: false },
      { from: "G11", to: "PWD", weight: 6, traffic: "low", isBlocked: false },
      { from: "I8", to: "I9", weight: 3, traffic: "medium", isBlocked: false },
      { from: "I8", to: "H8", weight: 4, traffic: "low", isBlocked: false },
      { from: "I9", to: "I10", weight: 3, traffic: "medium", isBlocked: false },
      { from: "I9", to: "H9", weight: 4, traffic: "low", isBlocked: false },
      { from: "I10", to: "PWD", weight: 5, traffic: "medium", isBlocked: false },
      { from: "H8", to: "H9", weight: 3, traffic: "low", isBlocked: false },
      { from: "D12", to: "G11", weight: 5, traffic: "low", isBlocked: false },
    ];

    onLoadTemplate(nodes, edges, 'islamabad');
    toast.success("Islamabad city map loaded");
  };

  // Peshawar City Map
  const generatePeshawarMap = () => {
    const nodes: Node[] = [
      { id: "HYT", x: 100, y: 200, label: "Hayatabad" },
      { id: "UNI", x: 200, y: 150, label: "University Town" },
      { id: "SAD", x: 350, y: 100, label: "Saddar" },
      { id: "CAN", x: 400, y: 180, label: "Cantonment" },
      { id: "OLD", x: 450, y: 100, label: "Old City" },
      { id: "GLG", x: 300, y: 200, label: "Gulbahar" },
      { id: "BRD", x: 250, y: 280, label: "Board Bazaar" },
      { id: "NSH", x: 350, y: 300, label: "Nasir Bagh" },
      { id: "KKP", x: 150, y: 100, label: "Kohat Road" },
      { id: "RGI", x: 500, y: 200, label: "Ring Road" },
      { id: "PSU", x: 180, y: 220, label: "Peshawar Uni" },
      { id: "WRS", x: 400, y: 280, label: "Warsak Road" },
      { id: "CHK", x: 280, y: 100, label: "Chowk Yadgar" },
      { id: "QSB", x: 500, y: 120, label: "Qissa Khwani" },
      { id: "DLZ", x: 150, y: 300, label: "Dalazak Road" },
    ];

    const edges: Edge[] = [
      { from: "HYT", to: "UNI", weight: 8, traffic: "medium", isBlocked: false },
      { from: "HYT", to: "KKP", weight: 10, traffic: "medium", isBlocked: false },
      { from: "HYT", to: "PSU", weight: 5, traffic: "low", isBlocked: false },
      { from: "UNI", to: "GLG", weight: 6, traffic: "high", isBlocked: false },
      { from: "UNI", to: "SAD", weight: 7, traffic: "high", isBlocked: false },
      { from: "SAD", to: "CHK", weight: 4, traffic: "high", isBlocked: false },
      { from: "SAD", to: "CAN", weight: 5, traffic: "medium", isBlocked: false },
      { from: "CHK", to: "OLD", weight: 3, traffic: "high", isBlocked: false },
      { from: "OLD", to: "QSB", weight: 4, traffic: "high", isBlocked: false },
      { from: "OLD", to: "CAN", weight: 5, traffic: "medium", isBlocked: false },
      { from: "CAN", to: "RGI", weight: 6, traffic: "medium", isBlocked: false },
      { from: "CAN", to: "WRS", weight: 7, traffic: "medium", isBlocked: false },
      { from: "GLG", to: "BRD", weight: 5, traffic: "high", isBlocked: false },
      { from: "GLG", to: "NSH", weight: 6, traffic: "medium", isBlocked: false },
      { from: "BRD", to: "DLZ", weight: 7, traffic: "medium", isBlocked: false },
      { from: "BRD", to: "NSH", weight: 5, traffic: "medium", isBlocked: false },
      { from: "NSH", to: "WRS", weight: 6, traffic: "medium", isBlocked: false },
      { from: "PSU", to: "BRD", weight: 6, traffic: "low", isBlocked: false },
      { from: "KKP", to: "CHK", weight: 8, traffic: "medium", isBlocked: false },
      { from: "RGI", to: "QSB", weight: 5, traffic: "low", isBlocked: false },
      { from: "WRS", to: "RGI", weight: 8, traffic: "low", isBlocked: false },
      { from: "DLZ", to: "PSU", weight: 6, traffic: "low", isBlocked: false },
    ];

    onLoadTemplate(nodes, edges, 'peshawar');
    toast.success("Peshawar city map loaded");
  };

  // Quetta City Map
  const generateQuettaMap = () => {
    const nodes: Node[] = [
      { id: "SAT", x: 300, y: 150, label: "Satellite Town" },
      { id: "JNH", x: 400, y: 200, label: "Jinnah Town" },
      { id: "CAN", x: 250, y: 250, label: "Cantonment" },
      { id: "QDR", x: 350, y: 100, label: "Quaidabad" },
      { id: "SRM", x: 200, y: 180, label: "Sariab Road" },
      { id: "JNR", x: 450, y: 120, label: "Jinnah Road" },
      { id: "ARW", x: 150, y: 100, label: "Arbab Karam Khan" },
      { id: "BWL", x: 500, y: 200, label: "Brewery Road" },
      { id: "SMG", x: 350, y: 300, label: "Samungli" },
      { id: "AIR", x: 500, y: 300, label: "Airport Road" },
      { id: "HAN", x: 180, y: 300, label: "Hanna Road" },
      { id: "ZRG", x: 280, y: 50, label: "Zarghoon Road" },
      { id: "BLC", x: 420, y: 350, label: "Baleli" },
      { id: "CHM", x: 100, y: 200, label: "Chaman Road" },
    ];

    const edges: Edge[] = [
      { from: "SAT", to: "JNH", weight: 6, traffic: "medium", isBlocked: false },
      { from: "SAT", to: "QDR", weight: 5, traffic: "medium", isBlocked: false },
      { from: "SAT", to: "CAN", weight: 7, traffic: "high", isBlocked: false },
      { from: "SAT", to: "SRM", weight: 6, traffic: "medium", isBlocked: false },
      { from: "JNH", to: "JNR", weight: 4, traffic: "high", isBlocked: false },
      { from: "JNH", to: "BWL", weight: 5, traffic: "medium", isBlocked: false },
      { from: "JNH", to: "SMG", weight: 8, traffic: "low", isBlocked: false },
      { from: "QDR", to: "JNR", weight: 5, traffic: "medium", isBlocked: false },
      { from: "QDR", to: "ZRG", weight: 6, traffic: "medium", isBlocked: false },
      { from: "SRM", to: "ARW", weight: 6, traffic: "medium", isBlocked: false },
      { from: "SRM", to: "CAN", weight: 5, traffic: "medium", isBlocked: false },
      { from: "CAN", to: "HAN", weight: 7, traffic: "low", isBlocked: false },
      { from: "CAN", to: "SMG", weight: 6, traffic: "medium", isBlocked: false },
      { from: "BWL", to: "AIR", weight: 6, traffic: "low", isBlocked: false },
      { from: "BWL", to: "JNR", weight: 5, traffic: "medium", isBlocked: false },
      { from: "SMG", to: "AIR", weight: 7, traffic: "low", isBlocked: false },
      { from: "SMG", to: "BLC", weight: 6, traffic: "low", isBlocked: false },
      { from: "ARW", to: "ZRG", weight: 8, traffic: "medium", isBlocked: false },
      { from: "ARW", to: "CHM", weight: 7, traffic: "low", isBlocked: false },
      { from: "CHM", to: "HAN", weight: 9, traffic: "low", isBlocked: false },
      { from: "HAN", to: "SMG", weight: 10, traffic: "low", isBlocked: false },
      { from: "AIR", to: "BLC", weight: 5, traffic: "low", isBlocked: false },
    ];

    onLoadTemplate(nodes, edges, 'quetta');
    toast.success("Quetta city map loaded");
  };

  // Faisalabad City Map
  const generateFaisalabadMap = () => {
    const nodes: Node[] = [
      { id: "D12", x: 300, y: 150, label: "D Ground" },
      { id: "PL5", x: 400, y: 120, label: "Peoples Colony" },
      { id: "MAD", x: 200, y: 200, label: "Madina Town" },
      { id: "SAT", x: 350, y: 230, label: "Samanabad" },
      { id: "JNP", x: 450, y: 200, label: "Jinnah Colony" },
      { id: "GHB", x: 250, y: 100, label: "Ghulam Muhammad Abad" },
      { id: "BWT", x: 150, y: 150, label: "Batala Colony" },
      { id: "SUS", x: 500, y: 280, label: "Susan Road" },
      { id: "JAR", x: 350, y: 320, label: "Jaranwala Road" },
      { id: "SRG", x: 180, y: 280, label: "Sargodha Road" },
      { id: "GLQ", x: 420, y: 350, label: "Gulberg" },
      { id: "CLK", x: 280, y: 50, label: "Clock Tower" },
      { id: "SAT2", x: 100, y: 220, label: "Satellite Town" },
      { id: "MIL", x: 530, y: 150, label: "Millat Town" },
      { id: "CIV", x: 320, y: 400, label: "Civil Lines" },
    ];

    const edges: Edge[] = [
      { from: "D12", to: "PL5", weight: 5, traffic: "high", isBlocked: false },
      { from: "D12", to: "MAD", weight: 6, traffic: "medium", isBlocked: false },
      { from: "D12", to: "SAT", weight: 4, traffic: "high", isBlocked: false },
      { from: "D12", to: "GHB", weight: 5, traffic: "medium", isBlocked: false },
      { from: "PL5", to: "JNP", weight: 4, traffic: "medium", isBlocked: false },
      { from: "PL5", to: "MIL", weight: 6, traffic: "low", isBlocked: false },
      { from: "MAD", to: "BWT", weight: 5, traffic: "medium", isBlocked: false },
      { from: "MAD", to: "SAT2", weight: 7, traffic: "low", isBlocked: false },
      { from: "MAD", to: "SRG", weight: 6, traffic: "medium", isBlocked: false },
      { from: "SAT", to: "JNP", weight: 5, traffic: "high", isBlocked: false },
      { from: "SAT", to: "JAR", weight: 6, traffic: "medium", isBlocked: false },
      { from: "JNP", to: "SUS", weight: 5, traffic: "medium", isBlocked: false },
      { from: "GHB", to: "CLK", weight: 4, traffic: "high", isBlocked: false },
      { from: "GHB", to: "BWT", weight: 6, traffic: "medium", isBlocked: false },
      { from: "SUS", to: "GLQ", weight: 5, traffic: "medium", isBlocked: false },
      { from: "JAR", to: "GLQ", weight: 4, traffic: "high", isBlocked: false },
      { from: "JAR", to: "SRG", weight: 8, traffic: "medium", isBlocked: false },
      { from: "GLQ", to: "CIV", weight: 5, traffic: "medium", isBlocked: false },
      { from: "SAT2", to: "SRG", weight: 6, traffic: "low", isBlocked: false },
      { from: "CLK", to: "D12", weight: 5, traffic: "high", isBlocked: false },
      { from: "MIL", to: "SUS", weight: 7, traffic: "low", isBlocked: false },
    ];

    onLoadTemplate(nodes, edges, 'faisalabad');
    toast.success("Faisalabad city map loaded");
  };

  // Multan City Map
  const generateMultanMap = () => {
    const nodes: Node[] = [
      { id: "CAN", x: 300, y: 150, label: "Cantt" },
      { id: "BWP", x: 400, y: 200, label: "Bosan Road" },
      { id: "GAD", x: 200, y: 180, label: "Gulgasht Colony" },
      { id: "SHA", x: 350, y: 280, label: "Shah Rukn-e-Alam" },
      { id: "DHA", x: 450, y: 120, label: "DHA Multan" },
      { id: "VHR", x: 250, y: 100, label: "Vehari Road" },
      { id: "SHJ", x: 150, y: 200, label: "Shujabad Road" },
      { id: "NBP", x: 500, y: 280, label: "Nishtar Road" },
      { id: "CHK", x: 320, y: 350, label: "Chowk Kumharanwala" },
      { id: "LMQ", x: 180, y: 300, label: "LMQ Road" },
      { id: "MOD", x: 420, y: 350, label: "Model Town" },
      { id: "WAP", x: 280, y: 50, label: "Wapda Town" },
      { id: "SAM", x: 100, y: 250, label: "Sameejabad" },
      { id: "NWS", x: 530, y: 200, label: "New Shalimar" },
    ];

    const edges: Edge[] = [
      { from: "CAN", to: "BWP", weight: 6, traffic: "high", isBlocked: false },
      { from: "CAN", to: "GAD", weight: 5, traffic: "medium", isBlocked: false },
      { from: "CAN", to: "VHR", weight: 4, traffic: "high", isBlocked: false },
      { from: "BWP", to: "DHA", weight: 5, traffic: "medium", isBlocked: false },
      { from: "BWP", to: "SHA", weight: 6, traffic: "high", isBlocked: false },
      { from: "BWP", to: "NWS", weight: 7, traffic: "low", isBlocked: false },
      { from: "GAD", to: "SHJ", weight: 5, traffic: "medium", isBlocked: false },
      { from: "GAD", to: "LMQ", weight: 7, traffic: "low", isBlocked: false },
      { from: "SHA", to: "CHK", weight: 5, traffic: "high", isBlocked: false },
      { from: "SHA", to: "NBP", weight: 6, traffic: "medium", isBlocked: false },
      { from: "DHA", to: "NWS", weight: 4, traffic: "low", isBlocked: false },
      { from: "VHR", to: "WAP", weight: 5, traffic: "medium", isBlocked: false },
      { from: "SHJ", to: "SAM", weight: 6, traffic: "low", isBlocked: false },
      { from: "SHJ", to: "LMQ", weight: 5, traffic: "medium", isBlocked: false },
      { from: "NBP", to: "MOD", weight: 5, traffic: "medium", isBlocked: false },
      { from: "CHK", to: "MOD", weight: 4, traffic: "high", isBlocked: false },
      { from: "CHK", to: "LMQ", weight: 7, traffic: "medium", isBlocked: false },
      { from: "SAM", to: "LMQ", weight: 6, traffic: "low", isBlocked: false },
      { from: "WAP", to: "CAN", weight: 6, traffic: "medium", isBlocked: false },
    ];

    onLoadTemplate(nodes, edges, 'multan');
    toast.success("Multan city map loaded");
  };

  // Rawalpindi City Map
  const generateRawalpindiMap = () => {
    const nodes: Node[] = [
      { id: "SAD", x: 300, y: 150, label: "Saddar" },
      { id: "COM", x: 400, y: 120, label: "Commercial Market" },
      { id: "RAJ", x: 200, y: 180, label: "Raja Bazaar" },
      { id: "SAT", x: 350, y: 230, label: "Satellite Town" },
      { id: "CHA", x: 450, y: 200, label: "Chaklala" },
      { id: "WES", x: 250, y: 100, label: "Westridge" },
      { id: "CAN", x: 150, y: 150, label: "Cantonment" },
      { id: "BAH", x: 500, y: 280, label: "Bahria Town" },
      { id: "ADY", x: 350, y: 320, label: "Adiala Road" },
      { id: "SHM", x: 180, y: 280, label: "Shamsabad" },
      { id: "GUL", x: 420, y: 350, label: "Gulzar-e-Quaid" },
      { id: "MUR", x: 280, y: 50, label: "Murree Road" },
      { id: "DHK", x: 100, y: 220, label: "Dhoke Syedan" },
      { id: "AIR", x: 530, y: 150, label: "Airport" },
      { id: "6TH", x: 320, y: 400, label: "6th Road" },
    ];

    const edges: Edge[] = [
      { from: "SAD", to: "COM", weight: 4, traffic: "high", isBlocked: false },
      { from: "SAD", to: "RAJ", weight: 5, traffic: "high", isBlocked: false },
      { from: "SAD", to: "SAT", weight: 6, traffic: "medium", isBlocked: false },
      { from: "SAD", to: "WES", weight: 5, traffic: "medium", isBlocked: false },
      { from: "COM", to: "CHA", weight: 4, traffic: "medium", isBlocked: false },
      { from: "COM", to: "AIR", weight: 7, traffic: "low", isBlocked: false },
      { from: "RAJ", to: "CAN", weight: 5, traffic: "medium", isBlocked: false },
      { from: "RAJ", to: "SHM", weight: 6, traffic: "medium", isBlocked: false },
      { from: "SAT", to: "CHA", weight: 5, traffic: "high", isBlocked: false },
      { from: "SAT", to: "ADY", weight: 6, traffic: "medium", isBlocked: false },
      { from: "CHA", to: "BAH", weight: 8, traffic: "medium", isBlocked: false },
      { from: "CHA", to: "AIR", weight: 5, traffic: "low", isBlocked: false },
      { from: "WES", to: "MUR", weight: 4, traffic: "high", isBlocked: false },
      { from: "WES", to: "CAN", weight: 5, traffic: "medium", isBlocked: false },
      { from: "CAN", to: "DHK", weight: 6, traffic: "low", isBlocked: false },
      { from: "BAH", to: "GUL", weight: 5, traffic: "medium", isBlocked: false },
      { from: "ADY", to: "GUL", weight: 4, traffic: "high", isBlocked: false },
      { from: "ADY", to: "SHM", weight: 7, traffic: "medium", isBlocked: false },
      { from: "GUL", to: "6TH", weight: 5, traffic: "medium", isBlocked: false },
      { from: "DHK", to: "SHM", weight: 6, traffic: "low", isBlocked: false },
      { from: "MUR", to: "SAD", weight: 5, traffic: "high", isBlocked: false },
    ];

    onLoadTemplate(nodes, edges, 'rawalpindi');
    toast.success("Rawalpindi city map loaded");
  };

  const graphTemplates = [
    {
      name: "Grid Network",
      description: "4x4 grid representing city streets",
      action: generateGrid,
    },
    {
      name: "Tree Topology",
      description: "Hierarchical binary tree structure",
      action: generateTree,
    },
    {
      name: "Complete Graph",
      description: "All nodes connected to each other",
      action: generateComplete,
    },
    {
      name: "Bipartite Graph",
      description: "Two distinct sets with cross-connections",
      action: generateBipartite,
    },
    {
      name: "Star Topology",
      description: "Central hub with radial connections",
      action: generateStar,
    },
  ];

  const mapTemplates = [
    {
      name: "Pakistan",
      description: "Major cities road network of Pakistan",
      action: generatePakistanMap,
    },
    {
      name: "Karachi",
      description: "20 major areas including Clifton, DHA, Gulshan, Korangi",
      action: generateKarachiMap,
    },
    {
      name: "Lahore",
      description: "18 areas including Gulberg, DHA, Model Town, Johar Town",
      action: generateLahoreMap,
    },
    {
      name: "Islamabad",
      description: "20 sectors including F-6, F-7, G-9, Blue Area",
      action: generateIslamabadMap,
    },
    {
      name: "Peshawar",
      description: "15 areas including Hayatabad, University Town, Saddar",
      action: generatePeshawarMap,
    },
    {
      name: "Quetta",
      description: "14 areas including Satellite Town, Jinnah Town, Cantonment",
      action: generateQuettaMap,
    },
    {
      name: "Faisalabad",
      description: "15 areas including D Ground, Peoples Colony, Madina Town",
      action: generateFaisalabadMap,
    },
    {
      name: "Multan",
      description: "14 areas including Cantt, DHA, Shah Rukn-e-Alam, Model Town",
      action: generateMultanMap,
    },
    {
      name: "Rawalpindi",
      description: "15 areas including Saddar, Bahria Town, Chaklala, Raja Bazaar",
      action: generateRawalpindiMap,
    },
  ];

  return (
    <section className="dashboard-card p-4">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="stamp">Sector library</p>
          <h2 className="font-mono text-lg tracking-[0.16em]">LOAD A NETWORK</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            The board stays empty until you pick a city or an abstract topology. Nothing is preloaded.
          </p>
        </div>
      </div>
      <Tabs defaultValue="maps" className="w-full">
        <TabsList className="mb-4 h-11 w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger
            value="maps"
            className="h-11 rounded-none border-b-2 border-transparent px-4 font-mono text-[11px] uppercase tracking-[0.16em] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Cities
          </TabsTrigger>
          <TabsTrigger
            value="graphs"
            className="h-11 rounded-none border-b-2 border-transparent px-4 font-mono text-[11px] uppercase tracking-[0.16em] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Topologies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maps" className="mt-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mapTemplates.map((template, index) => (
              <button
                key={template.name}
                type="button"
                onClick={template.action}
                className="dashboard-card tap-target p-4 text-left hover:border-primary"
              >
                <p className="stamp mb-2">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="font-mono text-sm tracking-[0.12em]">{template.name.toUpperCase()}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                <span className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                  Load sector
                </span>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="graphs" className="mt-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {graphTemplates.map((template, index) => (
              <button
                key={template.name}
                type="button"
                onClick={template.action}
                className="dashboard-card tap-target p-4 text-left hover:border-primary"
              >
                <p className="stamp mb-2">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="font-mono text-sm tracking-[0.12em]">{template.name.toUpperCase()}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                <span className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                  Load topology
                </span>
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default GraphTemplates;
