import { describe, expect, it } from "vitest";
import { climbFromSamples, weatherLabel } from "./meteo";

describe("weather helpers", () => {
  it("names common WMO codes and keeps unknown ones visible", () => {
    expect(weatherLabel(0)).toBe("Clear");
    expect(weatherLabel(63)).toBe("Rain");
    expect(weatherLabel(123)).toBe("Code 123");
  });

  it("sums climb and loss along a sampled route", () => {
    expect(climbFromSamples([1400, 1450, 1420, 1500])).toEqual({
      gain: 130,
      loss: 30,
      min: 1400,
      max: 1500,
    });
  });
});
