interface CanvasZoomControlsProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  resetView: () => void;
}

const CanvasZoomControls = ({ zoom, setZoom, resetView }: CanvasZoomControlsProps) => {
  return (
    <div className="absolute left-2 top-2 z-10 flex flex-wrap items-center gap-2 border border-border bg-card/95 px-2 py-1.5">
      <button
        type="button"
        className="tap-target px-2 font-mono text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setZoom(Math.max(25, zoom - 10))}
      >
        −
      </button>
      <span className="metric-num min-w-10 text-xs">{zoom}%</span>
      <button
        type="button"
        className="tap-target px-2 font-mono text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setZoom(Math.min(200, zoom + 10))}
      >
        +
      </button>
      <button
        type="button"
        className="tap-target px-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
        onClick={resetView}
      >
        Reset
      </button>
    </div>
  );
};

export default CanvasZoomControls;
