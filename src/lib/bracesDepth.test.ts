import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const braces = require("braces") as (pattern: string, options?: { expand?: boolean }) => string[];

describe("braces depth guard", () => {
  it("expands a normal set", () => {
    expect(braces("./src/**/*.{ts,tsx}", { expand: true })).toEqual(["./src/**/*.ts", "./src/**/*.tsx"]);
  });

  it("rejects brace nesting past the guard", () => {
    let pattern = "a";
    for (let i = 0; i < 101; i += 1) pattern = `{a,${pattern}}`;
    expect(() => braces(pattern, { expand: true })).toThrow(/depth/i);
  });
});
