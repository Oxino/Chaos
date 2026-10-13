import { describe, expect, it } from "vitest";
import { explosionFalloff } from "./explosionMath";

describe("explosionFalloff", () => {
  it("vaut 1 au centre", () => {
    expect(explosionFalloff(0, 18)).toBe(1);
  });

  it("decroit lineairement", () => {
    expect(explosionFalloff(9, 18)).toBeCloseTo(0.5);
  });

  it("s'annule au bord et au-dela", () => {
    expect(explosionFalloff(18, 18)).toBe(0);
    expect(explosionFalloff(50, 18)).toBe(0);
  });

  it("rejette des parametres invalides", () => {
    expect(() => explosionFalloff(1, 0)).toThrow(RangeError);
    expect(() => explosionFalloff(-1, 18)).toThrow(RangeError);
  });
});
