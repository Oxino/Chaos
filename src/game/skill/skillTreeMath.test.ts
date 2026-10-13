import { describe, expect, it } from "vitest";
import type { SkillNode } from "../../data/content/skills/skillTypes";
import {
  prerequisitesMet,
  resolveBonuses,
  sanitizeRanks,
  spentPoints,
  unlockBlocker,
  withRank,
} from "./skillTreeMath";

const root: SkillNode = {
  id: "root",
  name: "Racine",
  description: "",
  branch: "propulsion",
  prerequisiteIds: [],
  cost: 1,
  maxRank: 2,
  effect: { kind: "launchPower", bonusPerRank: 0.1 },
};

const child: SkillNode = {
  ...root,
  id: "child",
  prerequisiteIds: ["root"],
  cost: 2,
  maxRank: 1,
  effect: { kind: "impact", bonusPerRank: 0.2 },
};

const nodes = [root, child];

describe("spentPoints", () => {
  it("multiplie le rang par le cout", () => {
    expect(spentPoints(nodes, { root: 2, child: 1 })).toBe(4);
  });

  it("vaut zero sans rang", () => {
    expect(spentPoints(nodes, {})).toBe(0);
  });
});

describe("prerequisitesMet", () => {
  it("accepte un n\u0153ud sans prerequis", () => {
    expect(prerequisitesMet(root, {})).toBe(true);
  });

  it("exige au moins un rang dans le prerequis", () => {
    expect(prerequisitesMet(child, {})).toBe(false);
    expect(prerequisitesMet(child, { root: 1 })).toBe(true);
  });
});

describe("unlockBlocker", () => {
  it("laisse passer un n\u0153ud accessible", () => {
    expect(unlockBlocker(root, {}, 1)).toBeNull();
  });

  it("bloque au rang maximum", () => {
    expect(unlockBlocker(root, { root: 2 }, 10)).toBe("maxRank");
  });

  it("bloque sans prerequis", () => {
    expect(unlockBlocker(child, {}, 10)).toBe("prerequisite");
  });

  it("bloque sans points suffisants", () => {
    expect(unlockBlocker(child, { root: 1 }, 1)).toBe("points");
  });
});

describe("withRank", () => {
  it("ajoute un rang", () => {
    expect(withRank(root, {}, 1)).toEqual({ root: 1 });
  });

  it("ne change rien si l'amelioration est impossible", () => {
    const ranks = { root: 2 };
    expect(withRank(root, ranks, 10)).toBe(ranks);
  });
});

describe("resolveBonuses", () => {
  it("cumule les effets par rang", () => {
    const bonuses = resolveBonuses(nodes, { root: 2, child: 1 });
    expect(bonuses.launchPower).toBeCloseTo(0.2);
    expect(bonuses.impact).toBeCloseTo(0.2);
    expect(bonuses.bounce).toBe(0);
  });

  it("ignore les n\u0153uds non appris", () => {
    expect(resolveBonuses(nodes, {}).launchPower).toBe(0);
  });
});

describe("sanitizeRanks", () => {
  it("ignore les identifiants inconnus et les valeurs aberrantes", () => {
    expect(sanitizeRanks(nodes, { root: 1, inconnu: 3, child: -2 })).toEqual({ root: 1 });
  });

  it("plafonne au rang maximum", () => {
    expect(sanitizeRanks(nodes, { root: 99 })).toEqual({ root: 2 });
  });

  it("accepte une donnee absente", () => {
    expect(sanitizeRanks(nodes, null)).toEqual({});
  });
});
