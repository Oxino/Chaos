import { describe, expect, it } from "vitest";
import { lerpAngleRad, pullInRadius, shortestAngleDeltaRad } from "./cameraMath";

describe("shortestAngleDeltaRad", () => {
  it("renvoie l'ecart direct dans le meme tour", () => {
    expect(shortestAngleDeltaRad(0, 1)).toBeCloseTo(1);
  });

  it("passe par le chemin court au lieu de faire le tour", () => {
    expect(shortestAngleDeltaRad(3, -3)).toBeCloseTo(0.2832, 3);
    expect(shortestAngleDeltaRad(-3, 3)).toBeCloseTo(-0.2832, 3);
  });

  it("ignore les tours complets", () => {
    expect(shortestAngleDeltaRad(0, Math.PI * 2)).toBeCloseTo(0);
  });
});

describe("lerpAngleRad", () => {
  it("n'avance pas a melange nul", () => {
    expect(lerpAngleRad(1.2, 2.4, 0)).toBeCloseTo(1.2);
  });

  it("atteint la cible a melange complet", () => {
    expect(lerpAngleRad(1.2, 2.4, 1)).toBeCloseTo(2.4);
  });

  it("traverse la discontinuite sans faire le tour", () => {
    const result = lerpAngleRad(3.1, -3.1, 0.5);
    expect(Math.abs(result)).toBeGreaterThan(3.1);
  });
});

describe("pullInRadius", () => {
  it("conserve la distance voulue quand l'obstacle est plus loin", () => {
    expect(pullInRadius(22, 40, 1.2, 4)).toBe(22);
  });

  it("rapproche la camera devant l'obstacle", () => {
    expect(pullInRadius(22, 12, 1.2, 4)).toBeCloseTo(10.8);
  });

  it("ne descend jamais sous la distance minimale", () => {
    expect(pullInRadius(22, 2, 1.2, 4)).toBe(4);
  });

  it("rejette des bornes negatives", () => {
    expect(() => pullInRadius(22, 12, -1, 4)).toThrow(RangeError);
  });
});
