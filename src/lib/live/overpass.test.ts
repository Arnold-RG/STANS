import { afterEach, describe, expect, it, vi } from "vitest";
import { nearbyAmenities, overpassQuery, readOverpassPayload } from "./overpass";

describe("Overpass replies", () => {
  it("tags every query with the desk address", () => {
    expect(overpassQuery("[out:json];")).toContain("https://arnold-rg.github.io/STANS/");
  });

  it("treats a remark with an empty element list as a failure", () => {
    expect(() =>
      readOverpassPayload({
        elements: [],
        remark: "runtime error: Query timed out in query",
      }),
    ).toThrow(/timed out/i);
  });

  it("keeps a normal empty result", () => {
    expect(readOverpassPayload({ elements: [] })).toEqual([]);
  });

  it("posts the client comment and surfaces a timeout remark", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const raw = String(init?.body ?? "");
      const data = decodeURIComponent(raw.replace(/^data=/, ""));
      expect(data).toContain("arnold-rg.github.io/STANS");
      expect(init?.headers).toMatchObject({ Accept: "application/json" });
      return new Response(JSON.stringify({ elements: [], remark: "runtime error: Query timed out" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(nearbyAmenities({ lat: -1.94, lon: 30.06 })).rejects.toThrow(/timed out/i);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});
