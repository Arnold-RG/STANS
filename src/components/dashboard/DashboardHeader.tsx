import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardHeaderProps {
  isSimulating: boolean;
  networkHealth: "optimal" | "strained" | "congested";
  sectorName?: string;
}

const formatClock = (date: Date) =>
  date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

const DashboardHeader = ({
  isSimulating,
  networkHealth,
  sectorName = "KARACHI · SECTOR 04",
}: DashboardHeaderProps) => {
  const [clock, setClock] = useState(() => formatClock(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => {
      setClock(formatClock(new Date()));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const healthLabel =
    networkHealth === "optimal" ? "CLEAR" : networkHealth === "strained" ? "DELAYED" : "HEAVY";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="flex h-12 items-center justify-between gap-3 px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/logo.svg" alt="STANS" className="h-8 w-8 shrink-0 rounded-sm" />
          <div className="min-w-0">
            <h1 className="font-mono text-sm font-semibold tracking-widest text-foreground">
              STANS
            </h1>
            <p className="stamp hidden truncate sm:block">{sectorName}</p>
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-sm ${
                isSimulating
                  ? "bg-primary animate-lamp-live"
                  : "bg-traffic-blocked"
              }`}
              aria-hidden
            />
            <span className="stamp text-foreground">
              {isSimulating ? "Karachi is running" : "Desk idle"}
            </span>
          </div>
          <span className="stamp">{healthLabel}</span>
        </div>

        <div className="flex items-center gap-3">
          <time
            dateTime={clock}
            className="font-mono text-xs tabular-nums text-foreground md:text-sm"
          >
            {clock}
          </time>
          <Link
            to="/docs"
            className="stamp tap-target inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            Docs
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
