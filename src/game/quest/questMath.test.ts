import { describe, expect, it } from "vitest";
import type { QuestDefinition } from "../../data/content/quests/questTypes";
import { createEmptyProgress, describeStatus, findNewlyCompleted } from "./questMath";

const scoreQuest: QuestDefinition = {
  id: "q_score",
  name: "Score",
  description: "",
  category: "progression",
  objective: "sessionScore",
  targetValue: 5000,
  scope: "session",
  xpReward: 150,
  hidden: false,
  repeatable: false,
};

const comboQuest: QuestDefinition = { ...scoreQuest, id: "q_combo", objective: "bestCombo", targetValue: 4 };

describe("createEmptyProgress", () => {
  it("part de zero sur tous les objectifs", () => {
    expect(Object.values(createEmptyProgress()).every((value) => value === 0)).toBe(true);
  });
});

describe("findNewlyCompleted", () => {
  it("ne retient rien tant que l'objectif n'est pas atteint", () => {
    const progress = { ...createEmptyProgress(), sessionScore: 4999 };
    expect(findNewlyCompleted([scoreQuest], progress, new Set())).toEqual([]);
  });

  it("retient la quete atteinte au seuil exact", () => {
    const progress = { ...createEmptyProgress(), sessionScore: 5000 };
    expect(findNewlyCompleted([scoreQuest], progress, new Set())).toEqual([scoreQuest]);
  });

  it("ignore une quete non repetable deja accomplie", () => {
    const progress = { ...createEmptyProgress(), sessionScore: 9000 };
    expect(findNewlyCompleted([scoreQuest], progress, new Set(["q_score"]))).toEqual([]);
  });

  it("retient a nouveau une quete repetable", () => {
    const progress = { ...createEmptyProgress(), sessionScore: 9000 };
    const repeatable = { ...scoreQuest, repeatable: true };
    expect(findNewlyCompleted([repeatable], progress, new Set(["q_score"]))).toEqual([repeatable]);
  });

  it("traite plusieurs quetes en une passe", () => {
    const progress = { ...createEmptyProgress(), sessionScore: 6000, bestCombo: 5 };
    expect(findNewlyCompleted([scoreQuest, comboQuest], progress, new Set())).toHaveLength(2);
  });
});

describe("describeStatus", () => {
  it("borne l'avancement affiche a la cible", () => {
    const progress = { ...createEmptyProgress(), sessionScore: 9000 };
    const [status] = describeStatus([scoreQuest], progress, new Set());
    expect(status?.current).toBe(5000);
    expect(status?.completed).toBe(true);
  });

  it("marque accomplie une quete deja enregistree", () => {
    const [status] = describeStatus([scoreQuest], createEmptyProgress(), new Set(["q_score"]));
    expect(status?.completed).toBe(true);
  });
});
