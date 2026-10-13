import { describe, expect, it } from "vitest";
import {
  type ProgressionConfig,
  resolveLevel,
  skillPointsForLevel,
  totalSkillPoints,
  xpForLevel,
  xpFromScore,
} from "./progressionMath";

const config: ProgressionConfig = {
  xpPerScorePoint: 0.1,
  baseLevelXp: 800,
  levelXpIncrement: 400,
  maxLevel: 10,
  bonusSkillPointEvery: 5,
};

describe("xpForLevel", () => {
  it("augmente a chaque palier", () => {
    expect(xpForLevel(1, config)).toBe(800);
    expect(xpForLevel(2, config)).toBe(1200);
    expect(xpForLevel(3, config)).toBe(1600);
  });

  it("vaut zero au niveau maximum", () => {
    expect(xpForLevel(10, config)).toBe(0);
  });

  it("rejette un niveau invalide", () => {
    expect(() => xpForLevel(0, config)).toThrow(RangeError);
  });
});

describe("resolveLevel", () => {
  it("demarre au niveau 1", () => {
    expect(resolveLevel(0, config)).toEqual({
      level: 1,
      xpIntoLevel: 0,
      xpForNextLevel: 800,
    });
  });

  it("ne monte pas d'un niveau avant le seuil", () => {
    expect(resolveLevel(799, config).level).toBe(1);
  });

  it("monte au niveau 2 au seuil exact", () => {
    expect(resolveLevel(800, config)).toEqual({
      level: 2,
      xpIntoLevel: 0,
      xpForNextLevel: 1200,
    });
  });

  it("conserve le reste d'XP dans le niveau courant", () => {
    expect(resolveLevel(2300, config)).toEqual({
      level: 3,
      xpIntoLevel: 300,
      xpForNextLevel: 1600,
    });
  });

  it("plafonne au niveau maximum", () => {
    const progress = resolveLevel(10_000_000, config);
    expect(progress.level).toBe(10);
    expect(progress.xpForNextLevel).toBe(0);
  });

  it("rejette une XP invalide", () => {
    expect(() => resolveLevel(-1, config)).toThrow(RangeError);
  });
});

describe("skillPointsForLevel", () => {
  it("n'accorde rien au niveau de depart", () => {
    expect(skillPointsForLevel(1, config)).toBe(0);
  });

  it("accorde un point par niveau", () => {
    expect(skillPointsForLevel(2, config)).toBe(1);
    expect(skillPointsForLevel(4, config)).toBe(1);
  });

  it("accorde un point supplementaire tous les cinq niveaux", () => {
    expect(skillPointsForLevel(5, config)).toBe(2);
    expect(skillPointsForLevel(10, config)).toBe(2);
  });
});

describe("totalSkillPoints", () => {
  it("cumule les points gagnes", () => {
    expect(totalSkillPoints(1, config)).toBe(0);
    expect(totalSkillPoints(4, config)).toBe(3);
    expect(totalSkillPoints(5, config)).toBe(5);
  });
});

describe("xpFromScore", () => {
  it("convertit le score en XP", () => {
    expect(xpFromScore(15_000, config)).toBe(1500);
  });

  it("rejette un score negatif", () => {
    expect(() => xpFromScore(-1, config)).toThrow(RangeError);
  });
});
