import { describe, expect, it } from "vitest";
import { CONTRAST_PAIRS } from "./tokens";
import { contrastRatio } from "./contrast";

describe("design token contrast (WCAG 2.2 AA)", () => {
  it.each(CONTRAST_PAIRS.map((pair) => [pair.name, pair]))(
    "%s meets the minimum ratio",
    (_name, pair) => {
      const ratio = contrastRatio(pair.fg, pair.bg);
      expect(
        ratio,
        `${pair.name}: ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(pair.min);
    },
  );

  it("documents gold as a non-text accent on white only, never as text", () => {
    expect(contrastRatio("#D4A72C", "#FFFFFF")).toBeLessThan(3);
  });
});
