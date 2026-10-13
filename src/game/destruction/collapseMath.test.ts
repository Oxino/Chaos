import { describe, expect, it } from "vitest";
import { debrisToFreeze, shouldCollapse } from "./collapseMath";

describe("shouldCollapse", () => {
  it("ne s'effondre pas tant que le seuil n'est pas atteint", () => {
    expect(shouldCollapse(1, 6, 0.34)).toBe(false);
    expect(shouldCollapse(2, 6, 0.34)).toBe(false);
  });

  it("s'effondre des que la proportion est atteinte", () => {
    expect(shouldCollapse(3, 6, 0.34)).toBe(true);
    expect(shouldCollapse(6, 6, 0.34)).toBe(true);
  });

  it("accepte un effondrement a la destruction complete", () => {
    expect(shouldCollapse(5, 6, 1)).toBe(false);
    expect(shouldCollapse(6, 6, 1)).toBe(true);
  });

  it("rejette des parametres invalides", () => {
    expect(() => shouldCollapse(0, 0, 0.5)).toThrow(RangeError);
    expect(() => shouldCollapse(1, 6, 0)).toThrow(RangeError);
    expect(() => shouldCollapse(1, 6, 1.5)).toThrow(RangeError);
  });
});

describe("debrisToFreeze", () => {
  it("ne fige rien sous le budget", () => {
    expect(debrisToFreeze(30, 60)).toBe(0);
    expect(debrisToFreeze(60, 60)).toBe(0);
  });

  it("fige le surplus", () => {
    expect(debrisToFreeze(73, 60)).toBe(13);
  });

  it("rejette un budget negatif", () => {
    expect(() => debrisToFreeze(10, -1)).toThrow(RangeError);
  });
});
