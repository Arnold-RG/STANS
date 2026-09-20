import { useState, useCallback, useEffect, WheelEvent, MouseEvent } from "react";

interface UseCanvasZoomProps {
  baseWidth?: number;
  baseHeight?: number;
  originX?: number;
  originY?: number;
}

interface UseCanvasZoomReturn {
  zoom: number;
  setZoom: (zoom: number) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number }) => void;
  isPanning: boolean;
  viewBox: string;
  scaledWidth: number;
  scaledHeight: number;
  handleWheel: (e: WheelEvent<SVGSVGElement>) => void;
  handleMouseDown: (e: MouseEvent<SVGSVGElement>) => void;
  handleMouseMove: (e: MouseEvent<SVGSVGElement>) => void;
  handleMouseUp: () => void;
  resetView: () => void;
}

export const useCanvasZoom = ({
  baseWidth = 800,
  baseHeight = 500,
  originX = 0,
  originY = 0,
}: UseCanvasZoomProps = {}): UseCanvasZoomReturn => {
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: originX, y: originY });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setPanOffset({ x: originX, y: originY });
    setZoom(100);
  }, [originX, originY, baseWidth, baseHeight]);

  const scaledWidth = baseWidth * (100 / zoom);
  const scaledHeight = baseHeight * (100 / zoom);
  const viewBox = `${panOffset.x} ${panOffset.y} ${scaledWidth} ${scaledHeight}`;

  const handleWheel = useCallback((e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    setZoom(prev => Math.max(25, Math.min(200, prev + delta)));
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent<SVGSVGElement>) => {
    if (!isPanning) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const dx = (e.clientX - panStart.x) * (scaledWidth / rect.width);
    const dy = (e.clientY - panStart.y) * (scaledHeight / rect.height);
    
    setPanOffset(prev => ({
      x: prev.x - dx,
      y: prev.y - dy,
    }));
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart, scaledWidth, scaledHeight]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setZoom(100);
    setPanOffset({ x: originX, y: originY });
  }, [originX, originY]);

  return {
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    isPanning,
    viewBox,
    scaledWidth,
    scaledHeight,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetView,
  };
};
