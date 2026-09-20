import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Props {
  status: string;
  modeLabel: string;
  fromLabel: string;
  toLabel: string;
  gpsLabel: string;
  weatherLabel: string;
  asset: string;
}

const formatClock = (date: Date) =>
  date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

const LiveHeader = ({ status, modeLabel, fromLabel, toLabel, gpsLabel, weatherLabel, asset }: Props) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const chips = [
    ["FEED", status],
    ["MODE", modeLabel],
    ["FROM", fromLabel],
    ["TO", toLabel],
    ["GPS", gpsLabel],
    ["WX", weatherLabel],
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95">
      <div className="flex h-12 items-center justify-between gap-3 px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="STANS" className="h-8 w-8 shrink-0 rounded-sm" />
          <div className="min-w-0">
            <h1 className="font-mono text-sm font-semibold tracking-[0.28em] text-foreground">STANS</h1>
            <p className="stamp hidden truncate sm:block">Live traffic desk</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden text-right sm:block">
            <time dateTime={now.toISOString()} className="block font-mono text-sm tabular-nums leading-none">
              {formatClock(now)}
            </time>
            <span className="stamp">{formatDate(now)} · {asset}</span>
          </div>
          <Link to="/docs" className="stamp tap-target inline-flex items-center text-muted-foreground hover:text-foreground">
            Notes
          </Link>
          <ThemeToggle />
        </div>
      </div>
      <div className="desk-ticker hidden overflow-x-auto border-t border-border md:block">
        <div className="flex min-w-max items-stretch">
          {chips.map(([label, value], index) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-1.5 ${index ? "border-l border-border/80" : ""}`}>
              <span className="stamp">{label}</span>
              <span className="max-w-[14rem] truncate font-mono text-[11px] tracking-wide text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};

export default LiveHeader;
