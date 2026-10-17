import { useEffect, useId, useRef, useState } from "react";
import { isAbortError } from "@/lib/live/pace";
import { searchPlaces, type Place } from "@/lib/live/nominatim";

interface PlaceSearchProps {
  label: string;
  value: Place | null;
  onSelect: (place: Place) => void;
  onClear: () => void;
}

const PlaceSearch = ({ label, value, onSelect, onClear }: PlaceSearchProps) => {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState(value?.name ?? "");
  const [hits, setHits] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || (value && q === value.name)) {
      setHits([]);
      setOpen(false);
      setError(null);
      return;
    }
    const ac = new AbortController();
    const id = window.setTimeout(async () => {
      setBusy(true);
      setError(null);
      try {
        const next = await searchPlaces(q, ac.signal);
        setHits(next);
        setActive(0);
        setOpen(next.length > 0);
        if (!next.length) setError("No places matched. Try a more specific name.");
      } catch (err) {
        if (isAbortError(err)) return;
        setHits([]);
        setOpen(false);
        const status = err instanceof Error && /\((\d+)\)/.exec(err.message)?.[1];
        if (status === "429" || status === "503") {
          setError("Nominatim is busy or rate-limiting. Wait a few seconds, then search again.");
        } else if (err instanceof Error && err.name === "TimeoutError") {
          setError("Nominatim took too long. Wait a second, then search again.");
        } else {
          setError(err instanceof Error ? err.message : "Place search failed. Try again shortly.");
        }
      } finally {
        if (!ac.signal.aborted) setBusy(false);
      }
    }, 420);
    return () => {
      window.clearTimeout(id);
      ac.abort();
    };
  }, [query, value]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (place: Place) => {
    onSelect(place);
    setQuery(place.name);
    setOpen(false);
    setError(null);
  };

  return (
    <div ref={boxRef} className="relative">
      <label htmlFor={inputId} className="eyebrow mb-2 block">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && hits[active] ? `${listId}-${active}` : undefined}
          value={query}
          maxLength={200}
          onChange={(event) => setQuery(event.target.value.slice(0, 200))}
          onFocus={() => hits.length && setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((index) => Math.min(index + 1, Math.max(hits.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && open && hits[active]) {
              event.preventDefault();
              choose(hits[active]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Street, neighbourhood, city"
          autoComplete="off"
          className="h-11 w-full border border-border bg-background/70 px-3 text-base text-foreground outline-none md:text-[0.95rem]"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onClear();
              setQuery("");
              setHits([]);
              setOpen(false);
              setError(null);
            }}
            className="desk-btn shrink-0"
            aria-label={`Clear ${label}`}
          >
            Clear
          </button>
        ) : null}
      </div>
      {busy ? <p className="eyebrow mt-2">Looking up Nominatim…</p> : null}
      {error && !busy ? (
        <p className="desk-error mt-2 text-xs" role="status">
          {error}
        </p>
      ) : null}
      {open && hits.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto border border-border bg-card shadow-[0_18px_40px_hsl(214_40%_2%/0.35)]"
        >
          {hits.map((hit, index) => (
            <li key={hit.id} id={`${listId}-${index}`} role="option" aria-selected={index === active}>
              <button
                type="button"
                className={`block w-full border-b border-border/60 px-3 py-2.5 text-left last:border-0 ${
                  index === active ? "bg-muted" : "hover:bg-muted/70"
                }`}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(hit)}
              >
                <div className="text-[0.98rem] text-foreground">{hit.name}</div>
                <div className="truncate font-mono text-xs text-muted-foreground">{hit.detail}</div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default PlaceSearch;
