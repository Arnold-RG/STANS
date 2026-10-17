import { describe, expect, it } from "vitest";
import { kindsForGroups, rankAmenities } from "./poi";

describe("POI filters", () => {
  it("turns hospital off without hiding fuel", () => {
    const kinds = kindsForGroups({ medical: false, police: true, fire: true, fuel: true });
    expect(kinds.has("hospital")).toBe(false);
    expect(kinds.has("clinic")).toBe(false);
    expect(kinds.has("fuel")).toBe(true);
  });

  it("sorts places by distance from the anchor", () => {
    const ranked = rankAmenities(
      [
        { id: "far", kind: "fuel", name: "Far", lat: -1.98, lon: 30.1 },
        { id: "near", kind: "hospital", name: "Near", lat: -1.945, lon: 30.062 },
      ],
      { lat: -1.944, lon: 30.061 },
    );
    expect(ranked.map((item) => item.id)).toEqual(["near", "far"]);
    expect(ranked[0].distanceKm).toBeLessThan(1);
  });
});
