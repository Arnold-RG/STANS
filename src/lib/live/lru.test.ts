import { describe, expect, it } from "vitest";
import { createLru } from "./nominatim";

describe("Nominatim result cache", () => {
  it("keeps the newest entries and refreshes a key on read", () => {
    const cache = createLru<string>(2);
    cache.set("a", "one");
    cache.set("b", "two");
    expect(cache.get("a")).toBe("one");
    cache.set("c", "three");
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe("one");
    expect(cache.get("c")).toBe("three");
  });
});
