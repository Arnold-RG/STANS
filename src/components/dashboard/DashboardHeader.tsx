import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardHeaderProps {
  isSimulating: boolean;
  networkHealth: "optimal" | "strained" | "congested";
  sectorName?: string;
  shiftLabel?: string;
  junctionCount?: number;
  linkCount?: number;
  liveId?: string;
  destId?: string;
  onCommand?: () => void;
}

const formatClock = (date: Date) =>
  date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).toUpperCase();

const DashboardHeader = ({
  isSimulating,
  networkHealth,
  sectorName = "NO SECTOR LOADED",
  shiftLabel = "NIGHT",
  junctionCount = 0,
  linkCount = 0,
  liveId = "",
  destId = "",
  onCommand,
}: DashboardHeaderProps) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const healthLabel =
    networkHealth === "optimal" ? "CLEAR" : networkHealth === "strained" ? "DELAYED" : "HEAVY";

  const chips = [
    ["SECTOR", sectorName],
    ["SHIFT", shiftLabel],
    ["JCT", String(junctionCount).padStart(2, "0")],
    ["LNK", String(linkCount).padStart(2, "0")],
    ["LIVE", liveId || "—"],
    ["DEST", destId || "—"],
    ["NET", healthLabel],
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-12 items-center justify-between gap-3 px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/logo.svg" alt="STANS" className="h-8 w-8 shrink-0 rounded-sm" />
          <div className="min-w-0">
            <h1 className="font-mono text-sm font-semibold tracking-[0.28em] text-foreground">
              STANS
            </h1>
            <p className="stamp hidden truncate sm:block">Traffic operations desk</p>
          </div>
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-sm ${
                isSimulating ? "bg-primary animate-lamp-live" : "bg-traffic-blocked"
              }`}
              aria-hidden
            />
            <span className="stamp text-foreground">
              {isSimulating ? "Board live" : "Desk idle"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden text-right sm:block">
            <time dateTime={now.toISOString()} className="block font-mono text-sm tabular-nums leading-none">
              {formatClock(now)}
            </time>
            <span className="stamp">{formatDate(now)}</span>
          </div>
          <button
            type="button"
            onClick={onCommand}
            className="stamp hidden h-9 items-center border border-border px-2 text-muted-foreground hover:text-foreground md:inline-flex"
          >
            ⌘K
          </button>
          <Link
            to="/docs"
            className="stamp tap-target inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            Docs
          </Link>
          <ThemeToggle />
        </div>
      </div>
      <div className="desk-ticker hidden overflow-x-auto border-t border-border md:block">
        <div className="flex min-w-max items-stretch">
          {chips.map(([label, value], index) => (
            <div
              key={label}
              className={`flex items-center gap-2 px-3 py-1.5 ${index ? "border-l border-border/80" : ""}`}
            >
              <span className="stamp">{label}</span>
              <span className="font-mono text-[11px] tracking-wide text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
