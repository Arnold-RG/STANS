import { afterEach, describe, expect, it, vi } from "vitest";
import { searchPlaces } from "./nominatim";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Nominatim search", () => {
  it("does not call the network for a one-letter query", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(searchPlaces("K")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps a hit and asks for json", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const parsed = new URL(url);
      expect(parsed.hostname).toBe("nominatim.openstreetmap.org");
      expect(parsed.searchParams.get("q")).toBe("Kigali");
      expect(init?.headers).toMatchObject({ Accept: "application/json" });
      return new Response(
        JSON.stringify([
          {
            place_id: 42,
            display_name: "Kigali, Rwanda",
            lat: "-1.9441",
            lon: "30.0619",
            name: "Kigali",
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const places = await searchPlaces("Kigali");
    expect(places[0]).toMatchObject({ id: "42", name: "Kigali", lat: -1.9441, lon: 30.0619 });
  });

  it("reports a rate-limit status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("slow down", { status: 429 })),
    );
    await expect(searchPlaces("Kigali")).rejects.toThrow(/429/);
  });
});
