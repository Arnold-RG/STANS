import { describe, expect, it } from "vitest";
import { createPacer, type PaceClock } from "./pace";

function fakeClock(): PaceClock & { time: number } {
  const clock = {
    time: 0,
    now() {
      return clock.time;
    },
    async wait(ms: number) {
      clock.time += ms;
    },
  };
  return clock;
}

describe("createPacer", () => {
  it("starts the next call only after the gap", async () => {
    const clock = fakeClock();
    const pace = createPacer(1000, clock);
    const stamps: number[] = [];
    await Promise.all([
      pace(async () => {
        stamps.push(clock.now());
      }),
      pace(async () => {
        stamps.push(clock.now());
      }),
    ]);
    expect(stamps).toEqual([0, 1000]);
  });

  it("does not spend a slot on a call that was already aborted", async () => {
    const clock = fakeClock();
    const pace = createPacer(1000, clock);
    const ac = new AbortController();
    ac.abort();
    await expect(pace(async () => "skipped", ac.signal)).rejects.toMatchObject({ name: "AbortError" });
    const stamp = await pace(async () => clock.now());
    expect(stamp).toBe(0);
  });
});
