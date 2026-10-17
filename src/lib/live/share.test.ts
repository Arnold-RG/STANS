import { describe, expect, it } from "vitest";
import { buildDeskSearch, deskSearchEqual, parseDeskSearch, parseZoom } from "./share";

describe("desk links", () => {
  it("round-trips a trip, the chosen alternate, and the map", () => {
    const params = buildDeskSearch({
      from: { lon: 30.0619, lat: -1.9441 },
      to: { lon: 30.1044, lat: -1.9706 },
      via: { lon: 30.08, lat: -1.96 },
      mode: "cycling",
      alt: 1,
      center: { lon: 30.08, lat: -1.95 },
      zoom: 14,
      base: "sat",
    });
    expect(parseDeskSearch(params)).toEqual({
      from: { lon: 30.0619, lat: -1.9441 },
      to: { lon: 30.1044, lat: -1.9706 },
      via: { lon: 30.08, lat: -1.96 },
      mode: "cycling",
      alt: 1,
      center: { lon: 30.08, lat: -1.95 },
      zoom: 14,
      base: "sat",
    });
    expect(deskSearchEqual(params, buildDeskSearch(parseDeskSearch(params)))).toBe(true);
  });

  it("drops a primary route index and an unlocked basemap", () => {
    const params = buildDeskSearch({
      from: null,
      to: null,
      via: null,
      mode: "driving",
      alt: 0,
      center: null,
      zoom: null,
      base: null,
    });
    expect(params.toString()).toBe("mode=driving");
  });

  it("ignores zoom and coordinates that cannot be a map", () => {
    expect(parseZoom("1")).toBeNull();
    expect(parseZoom("14.4")).toBeNull();
    expect(parseZoom("14")).toBe(14);
    const parsed = parseDeskSearch(new URLSearchParams("mode=fly&base=paper&alt=9&z=99&from=abc"));
    expect(parsed.mode).toBe("driving");
    expect(parsed.base).toBeNull();
    expect(parsed.alt).toBe(0);
    expect(parsed.zoom).toBeNull();
    expect(parsed.from).toBeNull();
  });
});
