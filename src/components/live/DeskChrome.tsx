import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export type DeskSection = "desk" | "notes" | "concepts";

const NAV: { id: DeskSection; label: string; to: string }[] = [
  { id: "desk", label: "Desk", to: "/" },
  { id: "notes", label: "Notes", to: "/docs" },
  { id: "concepts", label: "Concepts", to: "/concepts" },
];

const formatClock = (date: Date) =>
  date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

interface DeskChromeProps {
  section: DeskSection;
  ticker?: ReactNode;
  flush?: boolean;
  children: ReactNode;
}

export function DeskChrome({ section, ticker, flush, children }: DeskChromeProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className={flush ? "asphalt-desk flex h-[100dvh] flex-col overflow-hidden" : "asphalt-desk min-h-[100dvh]"}>
      <a className="skip-link" href={section === "desk" ? "#desk-map" : "#page-main"}>
        {section === "desk" ? "Skip to map" : "Skip to content"}
      </a>
      <header className="desk-header sticky top-0 z-50">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="STANS, live traffic desk">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-11 w-11 shrink-0" />
            <span className="min-w-0">
              <span className="desk-brand block">STANS</span>
              <span className="eyebrow mt-1.5 hidden sm:block">Live traffic desk · OSM ops</span>
            </span>
          </Link>
          <nav
            aria-label="Sections"
            className="order-3 flex w-full items-center justify-between border-t border-border/70 pt-1 sm:order-none sm:ml-2 sm:w-auto sm:justify-start sm:border-0 sm:pt-0"
          >
            {NAV.map((item) => {
              const on = item.id === section;
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  aria-current={on ? "page" : undefined}
                  className={`tap-target inline-flex flex-1 items-center justify-center px-2 text-[0.95rem] sm:flex-none sm:justify-start sm:px-3 ${
                    on ? "desk-nav-on" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <a
              href="https://github.com/Arnold-RG/STANS"
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background/60 px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/50 hover:text-primary sm:text-sm"
              aria-label="STANS source on GitHub"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span className="hidden xs:inline sm:inline">GitHub</span>
            </a>
            <div className="hidden text-right lg:block">
              <time dateTime={now.toISOString()} className="block font-mono text-sm tabular-nums leading-none text-primary">
                {formatClock(now)}
              </time>
              <span className="eyebrow mt-1 block">
                {formatDate(now)} · {zone}
              </span>
            </div>
            <time dateTime={now.toISOString()} className="hidden font-mono text-xs tabular-nums text-muted-foreground sm:inline lg:hidden">
              {formatClock(now).slice(0, 5)}
            </time>
            <ThemeToggle />
          </div>
        </div>
        {ticker ? <div className="hidden border-t border-border/80 md:block">{ticker}</div> : null}
      </header>
      <div className={flush ? "flex min-h-0 flex-1 flex-col" : undefined}>{children}</div>
    </div>
  );
}
