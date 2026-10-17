import { describe, expect, it } from "vitest";
import { corridorLabel, describeManeuver, type RouteStep } from "./osrm";

describe("route language", () => {
  it("turns maneuvers into sentences", () => {
    expect(describeManeuver({ name: "KN 5 Rd", maneuver: { type: "depart" } })).toBe("Leave on KN 5 Rd");
    expect(describeManeuver({ name: "KN 3 Rd", maneuver: { type: "turn", modifier: "left" } })).toBe("left turn · KN 3 Rd");
    expect(describeManeuver({ name: "Airport Rd", maneuver: { type: "roundabout" } })).toBe("Roundabout onto Airport Rd");
    expect(describeManeuver({ name: "", maneuver: { type: "arrive" } })).toBe("Arrive");
  });

  it("collapses a corridor onto the long named roads", () => {
    const steps: RouteStep[] = [
      { text: "", distanceM: 400, durationS: 40, name: "KN 5 Rd" },
      { text: "", distanceM: 800, durationS: 70, name: "KN 5 Rd" },
      { text: "", distanceM: 40, durationS: 8, name: "unnamed road" },
      { text: "", distanceM: 1500, durationS: 120, name: "KG 11 Ave" },
    ];
    expect(corridorLabel(steps)).toBe("KN 5 Rd (1.2 km) → KG 11 Ave (1.5 km)");
  });
});
