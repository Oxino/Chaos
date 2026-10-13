import { describe, expect, it } from "vitest";
import { isShotFinished, isStill, nextStillnessMs, type SettlingThresholds } from "./settling";

const thresholds: SettlingThresholds = {
  linearSleepSpeed: 0.3,
  angularSleepSpeed: 0.5,
  stillnessDurationMs: 4000,
  maxShotDurationMs: 20000,
};

describe("isStill", () => {
  it("accepte les vitesses sous les deux seuils", () => {
    expect(isStill(0.1, 0.2, thresholds)).toBe(true);
    expect(isStill(0.3, 0.5, thresholds)).toBe(true);
  });

  it("refuse si un seul des seuils est depasse", () => {
    expect(isStill(0.4, 0.1, thresholds)).toBe(false);
    expect(isStill(0.1, 0.9, thresholds)).toBe(false);
  });
});

describe("nextStillnessMs", () => {
  it("accumule tant que le personnage reste immobile", () => {
    expect(nextStillnessMs(1200, 300, true)).toBe(1500);
  });

  it("remet a zero des que le personnage rebouge", () => {
    expect(nextStillnessMs(3900, 300, false)).toBe(0);
  });

  it("rejette un delta negatif", () => {
    expect(() => nextStillnessMs(0, -1, true)).toThrow(RangeError);
  });
});

describe("isShotFinished", () => {
  it("termine apres la duree d'immobilite requise", () => {
    expect(isShotFinished(4000, 5000, thresholds)).toBe(true);
    expect(isShotFinished(3999, 5000, thresholds)).toBe(false);
  });

  it("termine via le delai de securite meme sans immobilite", () => {
    expect(isShotFinished(0, 20000, thresholds)).toBe(true);
  });
});
