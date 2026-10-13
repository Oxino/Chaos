import { describe, expect, it } from "vitest";
import { directionFromYawPitchDeg } from "../aiming/aimMath";
import { computeTrajectory } from "./trajectory";

const baseInput = {
  origin: { x: 0, y: 0, z: 0 },
  direction: { x: 0, y: 0, z: 1 },
  speed: 20,
  gravity: 9.81,
  groundY: 0,
  sampleCount: 30,
};

describe("computeTrajectory", () => {
  it("retrouve la portee balistique theorique a 45 degres", () => {
    const result = computeTrajectory({
      ...baseInput,
      direction: directionFromYawPitchDeg(0, 45),
    });
    const expectedRange = (baseInput.speed * baseInput.speed) / baseInput.gravity;
    expect(result.range).toBeCloseTo(expectedRange, 1);
  });

  it("termine exactement au niveau du sol", () => {
    const result = computeTrajectory({
      ...baseInput,
      origin: { x: 0, y: 12, z: 0 },
      direction: directionFromYawPitchDeg(0, 30),
    });
    expect(result.impact.y).toBeCloseTo(0, 6);
  });

  it("produit le nombre d'echantillons demande en partant de l'origine", () => {
    const result = computeTrajectory({ ...baseInput, origin: { x: 1, y: 5, z: 2 } });
    expect(result.points).toHaveLength(30);
    expect(result.points[0]).toEqual({ x: 1, y: 5, z: 2 });
  });

  it("augmente la portee avec la vitesse", () => {
    const direction = directionFromYawPitchDeg(0, 35);
    const slow = computeTrajectory({ ...baseInput, direction, speed: 10 });
    const fast = computeTrajectory({ ...baseInput, direction, speed: 30 });
    expect(fast.range).toBeGreaterThan(slow.range);
  });

  it("suit le lacet demande", () => {
    const result = computeTrajectory({
      ...baseInput,
      origin: { x: 0, y: 4, z: 0 },
      direction: directionFromYawPitchDeg(90, 20),
    });
    expect(result.impact.x).toBeGreaterThan(0);
    expect(result.impact.z).toBeCloseTo(0, 6);
  });

  it("rejette les entrees invalides", () => {
    expect(() => computeTrajectory({ ...baseInput, gravity: 0 })).toThrow(RangeError);
    expect(() => computeTrajectory({ ...baseInput, sampleCount: 1 })).toThrow(RangeError);
    expect(() => computeTrajectory({ ...baseInput, groundY: 10 })).toThrow(RangeError);
  });
});
