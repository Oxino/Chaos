import { describe, expect, it } from "vitest";
import { comboMultiplier, splitAward } from "./scoreMath";

describe("comboMultiplier", () => {
  it("vaut 1 pour une destruction isolee", () => {
    expect(comboMultiplier(1, 5)).toBe(1);
  });

  it("croit avec la chaine", () => {
    expect(comboMultiplier(3, 5)).toBe(3);
  });

  it("plafonne au multiplicateur maximum", () => {
    expect(comboMultiplier(12, 5)).toBe(5);
  });

  it("rejette des entrees invalides", () => {
    expect(() => comboMultiplier(0, 5)).toThrow(RangeError);
    expect(() => comboMultiplier(1.5, 5)).toThrow(RangeError);
    expect(() => comboMultiplier(1, 0)).toThrow(RangeError);
  });
});

describe("splitAward", () => {
  it("n'attribue aucun bonus sans combo", () => {
    expect(splitAward(300, 1)).toEqual({ direct: 300, combo: 0 });
  });

  it("separe la valeur de base du bonus de chaine", () => {
    expect(splitAward(300, 4)).toEqual({ direct: 300, combo: 900 });
  });

  it("rejette des entrees invalides", () => {
    expect(() => splitAward(-1, 1)).toThrow(RangeError);
    expect(() => splitAward(300, 0)).toThrow(RangeError);
  });
});
