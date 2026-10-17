import { afterEach, describe, expect, it, vi } from "vitest";
import type { Place } from "./nominatim";
import { buildGpx, pushRecentPlace, readSavedTrips, writeSavedTrips, type SavedLiveTrip } from "./storage";

function memoryStorage() {
  const mem = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => (mem.has(key) ? mem.get(key)! : null),
    setItem: (key: string, value: string) => {
      mem.set(key, value);
    },
    removeItem: (key: string) => {
      mem.delete(key);
    },
    clear: () => mem.clear(),
  });
}

const place = (name: string): Place => ({
  id: name,
  name,
  detail: name,
  lon: 30,
  lat: -1.9,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("trips kept on this device", () => {
  it("keeps a via point and ignores broken JSON", () => {
    memoryStorage();
    const trip: SavedLiveTrip = {
      id: "1",
      label: "A → B → C",
      from: place("A"),
      to: place("C"),
      via: place("B"),
      mode: "walking",
      savedAt: "2026-10-17T00:00:00.000Z",
    };
    writeSavedTrips([trip]);
    expect(readSavedTrips()[0].via?.name).toBe("B");
    localStorage.setItem("stans.liveTrips.v2", "{");
    expect(readSavedTrips()).toEqual([]);
  });

  it("dedupes recent places and escapes GPX names", () => {
    memoryStorage();
    pushRecentPlace(place("Market"));
    const recent = pushRecentPlace(place("Market"));
    expect(recent).toHaveLength(1);
    const gpx = buildGpx("A & B <town>", [{ lat: -1.9, lon: 30 }]);
    expect(gpx).toContain("A &amp; B &lt;town&gt;");
    expect(gpx).toContain('lat="-1.900000"');
  });
});
