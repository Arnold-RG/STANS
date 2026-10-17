import { afterEach, describe, expect, it, vi } from "vitest";
import { printPlain } from "./networkOps";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("printPlain", () => {
  it("opens a blank window, drops the opener, and escapes the title", () => {
    const written: string[] = [];
    const frame = {
      opener: {} as Window | null,
      document: {
        write(html: string) {
          written.push(html);
        },
        close() {},
      },
      focus() {},
      print() {},
    };
    const open = vi.fn(() => frame);
    vi.stubGlobal("window", { open });

    expect(printPlain(`Route <A> & "B"`, ["1 < 2 & 3"])).toBe(true);
    expect(open).toHaveBeenCalledWith("", "_blank");
    expect(frame.opener).toBeNull();
    expect(written[0]).toContain("<title>Route &lt;A&gt; &amp; &quot;B&quot;</title>");
    expect(written[0]).toContain("<h1>Route &lt;A&gt; &amp; &quot;B&quot;</h1>");
    expect(written[0]).toContain("<p>1 &lt; 2 &amp; 3</p>");
  });

  it("returns false when the browser blocks the window", () => {
    vi.stubGlobal("window", { open: () => null });
    expect(printPlain("Sitrep", [])).toBe(false);
  });
});
