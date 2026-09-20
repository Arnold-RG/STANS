import { useEffect, useRef, useState } from "react";
import { searchPlaces, type Place } from "@/lib/live/nominatim";

interface PlaceSearchProps {
  label: string;
  value: Place | null;
  onSelect: (place: Place) => void;
  onClear: () => void;
}

const PlaceSearch = ({ label, value, onSelect, onClear }: PlaceSearchProps) => {
  const [query, setQuery] = useState(value?.name ?? "");
  const [hits, setHits] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || (value && q === value.name)) {
      setHits([]);
      return;
    }
    const id = window.setTimeout(async () => {
      setBusy(true);
      try {
        const next = await searchPlaces(q);
        setHits(next);
        setOpen(true);
      } catch {
        setHits([]);
      } finally {
        setBusy(false);
      }
    }, 420);
    return () => window.clearTimeout(id);
  }, [query, value]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <label className="stamp mb-1 block">{label}</label>
      <div className="flex gap-1">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => hits.length && setOpen(true)}
          placeholder="Street, area, city…"
          className="h-10 w-full rounded-sm border border-border bg-background px-2 font-mono text-xs text-foreground outline-none focus:border-primary"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onClear();
              setQuery("");
              setHits([]);
            }}
            className="stamp h-10 border border-border px-2"
          >
            CLR
          </button>
        ) : null}
      </div>
      {busy ? <p className="stamp mt-1">Looking up OSM…</p> : null}
      {open && hits.length > 0 ? (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto border border-border bg-card shadow-lg">
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                className="block w-full border-b border-border/60 px-2 py-2 text-left last:border-0 hover:bg-muted"
                onClick={() => {
                  onSelect(hit);
                  setQuery(hit.name);
                  setOpen(false);
                }}
              >
                <div className="text-sm text-foreground">{hit.name}</div>
                <div className="truncate font-mono text-[10px] text-muted-foreground">{hit.detail}</div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default PlaceSearch;
