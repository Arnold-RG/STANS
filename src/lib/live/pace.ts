export interface PaceClock {
  now: () => number;
  wait: (ms: number) => Promise<void>;
}

export const systemClock: PaceClock = {
  now: () => Date.now(),
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/** One in-flight task at a time, with a minimum gap between tasks that actually start. */
export function createPacer(minGapMs: number, clock: PaceClock = systemClock) {
  let tail: Promise<void> = Promise.resolve();
  let nextAt = 0;

  return function pace<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    const job = tail.then(async () => {
      while (clock.now() < nextAt) {
        if (signal?.aborted) throw abortError();
        const slice = Math.max(0, Math.min(50, nextAt - clock.now()));
        await clock.wait(slice);
      }
      if (signal?.aborted) throw abortError();
      nextAt = clock.now() + minGapMs;
      return task();
    });
    tail = job.then(
      () => undefined,
      () => undefined,
    );
    return job;
  };
}

export function abortError(): DOMException {
  return new DOMException("The operation was aborted.", "AbortError");
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  if (!signal) return timeout;
  if (typeof AbortSignal.any === "function") return AbortSignal.any([signal, timeout]);
  return signal;
}
