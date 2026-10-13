import { describe, expect, it } from "vitest";
import { computeLaunchImpulse, normalizeDirection } from "./launchMath";

const magnitude = (v: { x: number; y: number; z: number }): number =>
  Math.hypot(v.x, v.y, v.z);

describe("normalizeDirection", () => {
  it("ramene le vecteur a une longueur de 1", () => {
    expect(magnitude(normalizeDirection({ x: 3, y: 0, z: 4 }))).toBeCloseTo(1);
  });

  it("rejette le vecteur nul", () => {
    expect(() => normalizeDirection({ x: 0, y: 0, z: 0 })).toThrow(RangeError);
  });
});

describe("computeLaunchImpulse", () => {
  it("applique la puissance maximale a pleine puissance", () => {
    const impulse = computeLaunchImpulse({ x: 0, y: 0, z: 1 }, 1, 2000);
    expect(impulse).toEqual({ x: 0, y: 0, z: 2000 });
  });

  it("met l'impulsion a l'echelle de la puissance", () => {
    expect(magnitude(computeLaunchImpulse({ x: 1, y: 1, z: 0 }, 0.5, 1000))).toBeCloseTo(500);
  });

  it("borne une puissance hors de l'intervalle 0..1", () => {
    expect(magnitude(computeLaunchImpulse({ x: 0, y: 0, z: 1 }, 5, 1000))).toBeCloseTo(1000);
    expect(magnitude(computeLaunchImpulse({ x: 0, y: 0, z: 1 }, -3, 1000))).toBeCloseTo(0);
  });

  it("conserve la direction independamment de la norme fournie", () => {
    const a = computeLaunchImpulse({ x: 0, y: 1, z: 1 }, 1, 100);
    const b = computeLaunchImpulse({ x: 0, y: 10, z: 10 }, 1, 100);
    expect(a.y).toBeCloseTo(b.y);
    expect(a.z).toBeCloseTo(b.z);
  });

  it("rejette une puissance non finie ou une impulsion maximale nulle", () => {
    expect(() => computeLaunchImpulse({ x: 0, y: 0, z: 1 }, Number.NaN, 100)).toThrow(RangeError);
    expect(() => computeLaunchImpulse({ x: 0, y: 0, z: 1 }, 1, 0)).toThrow(RangeError);
  });
});
