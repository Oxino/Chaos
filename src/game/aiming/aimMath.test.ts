import { describe, expect, it } from "vitest";
import {
  clampAngleDeg,
  directionFromYawPitchDeg,
  mapRangeClamped,
  normalizeAngleDeg,
  yawPitchDegFromDirection,
} from "./aimMath";

describe("normalizeAngleDeg", () => {
  it("ramene les angles dans ]-180, 180]", () => {
    expect(normalizeAngleDeg(370)).toBeCloseTo(10);
    expect(normalizeAngleDeg(-190)).toBeCloseTo(170);
    expect(normalizeAngleDeg(45)).toBeCloseTo(45);
  });
});

describe("clampAngleDeg", () => {
  it("laisse passer un angle dans l'amplitude", () => {
    expect(clampAngleDeg(20, 0, 75)).toBeCloseTo(20);
  });

  it("borne a la demi-amplitude de chaque cote", () => {
    expect(clampAngleDeg(60, 0, 75)).toBeCloseTo(37.5);
    expect(clampAngleDeg(-60, 0, 75)).toBeCloseTo(-37.5);
  });

  it("gere le passage par 180 degres", () => {
    expect(clampAngleDeg(-170, 170, 40)).toBeCloseTo(-170);
    expect(clampAngleDeg(-120, 170, 40)).toBeCloseTo(-170);
  });

  it("rejette une amplitude negative", () => {
    expect(() => clampAngleDeg(0, 0, -1)).toThrow(RangeError);
  });
});

describe("directionFromYawPitchDeg", () => {
  it("pointe vers +Z a lacet et tangage nuls", () => {
    const direction = directionFromYawPitchDeg(0, 0);
    expect(direction.x).toBeCloseTo(0);
    expect(direction.y).toBeCloseTo(0);
    expect(direction.z).toBeCloseTo(1);
  });

  it("pointe vers +X a 90 degres de lacet", () => {
    const direction = directionFromYawPitchDeg(90, 0);
    expect(direction.x).toBeCloseTo(1);
    expect(direction.z).toBeCloseTo(0);
  });

  it("produit toujours un vecteur unitaire", () => {
    const direction = directionFromYawPitchDeg(33, 51);
    expect(Math.hypot(direction.x, direction.y, direction.z)).toBeCloseTo(1);
  });
});

describe("yawPitchDegFromDirection", () => {
  it("fait l'aller-retour avec directionFromYawPitchDeg", () => {
    const angles = yawPitchDegFromDirection(directionFromYawPitchDeg(-28, 41));
    expect(angles.yawDeg).toBeCloseTo(-28);
    expect(angles.pitchDeg).toBeCloseTo(41);
  });

  it("rejette le vecteur nul", () => {
    expect(() => yawPitchDegFromDirection({ x: 0, y: 0, z: 0 })).toThrow(RangeError);
  });
});

describe("mapRangeClamped", () => {
  it("interpole lineairement dans l'intervalle", () => {
    expect(mapRangeClamped(65, 45, 85, 60, 10)).toBeCloseTo(35, 1);
  });

  it("borne en dehors de l'intervalle source", () => {
    expect(mapRangeClamped(0, 45, 85, 60, 10)).toBeCloseTo(60);
    expect(mapRangeClamped(200, 45, 85, 60, 10)).toBeCloseTo(10);
  });

  it("rejette un intervalle source vide", () => {
    expect(() => mapRangeClamped(1, 10, 10, 0, 1)).toThrow(RangeError);
  });
});
