import { describe, expect, it } from "vitest";
import type { LevelBlockout } from "../../data/content/levels/levelTypes";
import { isLevelUnlocked, unlockedLevelCount } from "./levelProgress";

function level(id: string, targetScore: number): LevelBlockout {
  return {
    id,
    displayName: id,
    shotsAllowed: 3,
    targetScore,
    groundSize: 100,
    groundColor: "#000000",
    launcher: { position: { x: 0, y: 0, z: 0 }, restDirection: { x: 0, y: 0, z: 1 } },
    boxes: [],
    buildings: [],
    secrets: [],
  };
}

const campaign = [level("a", 1000), level("b", 2000), level("c", 3000)];

describe("unlockedLevelCount", () => {
  it("donne toujours acces au premier niveau", () => {
    expect(unlockedLevelCount(campaign, {})).toBe(1);
  });

  it("n'ouvre pas le suivant sous l'objectif", () => {
    expect(unlockedLevelCount(campaign, { a: 999 })).toBe(1);
  });

  it("ouvre le suivant au score exact", () => {
    expect(unlockedLevelCount(campaign, { a: 1000 })).toBe(2);
  });

  it("ouvre en cascade", () => {
    expect(unlockedLevelCount(campaign, { a: 1500, b: 2500 })).toBe(3);
  });

  it("interdit de sauter un niveau", () => {
    expect(unlockedLevelCount(campaign, { b: 9999 })).toBe(1);
  });

  it("rejette une campagne vide", () => {
    expect(() => unlockedLevelCount([], {})).toThrow(RangeError);
  });
});

describe("isLevelUnlocked", () => {
  it("borne les index", () => {
    expect(isLevelUnlocked(campaign, 0, {})).toBe(true);
    expect(isLevelUnlocked(campaign, 1, {})).toBe(false);
    expect(isLevelUnlocked(campaign, -1, {})).toBe(false);
    expect(isLevelUnlocked(campaign, 99, { a: 5000, b: 5000 })).toBe(false);
  });
});
