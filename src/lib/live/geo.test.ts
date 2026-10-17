import { describe, expect, it } from "vitest";
import { formatDuration, formatKm, haversineKm, parseCoordPair } from "./geo";

describe("geo helpers", () => {
  it("formats short and long distances", () => {
    expect(formatKm(0.42)).toBe("420 m");
    expect(formatKm(3.24)).toBe("3.2 km");
    expect(formatKm(18.2)).toBe("18 km");
  });

  it("formats durations down to seconds", () => {
    expect(formatDuration(45)).toBe("45 s");
    expect(formatDuration(90)).toBe("1 min");
    expect(formatDuration(120)).toBe("2 min");
    expect(formatDuration(3700)).toBe("1 h 1 min");
    expect(formatDuration(7200)).toBe("2 h");
  });

  it("parses lon,lat and rejects nonsense", () => {
    expect(parseCoordPair("30.06190,-1.94410")).toEqual({ lon: 30.0619, lat: -1.9441 });
    expect(parseCoordPair("200,10")).toBeNull();
    expect(parseCoordPair("10,95")).toBeNull();
    expect(parseCoordPair("nope")).toBeNull();
    expect(parseCoordPair(null)).toBeNull();
  });

  it("measures a known short hop in kilometres", () => {
    const km = haversineKm({ lon: 30.06, lat: -1.95 }, { lon: 30.07, lat: -1.95 });
    expect(km).toBeGreaterThan(1);
    expect(km).toBeLessThan(1.2);
  });
});
