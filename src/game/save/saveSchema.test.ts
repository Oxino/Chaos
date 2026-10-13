import { describe, expect, it } from "vitest";
import {
  CURRENT_SCHEMA_VERSION,
  createEmptySave,
  isNewRecord,
  migrateSave,
  withBestScore,
  withCompletedQuests,
  withXp,
} from "./saveSchema";

describe("migrateSave", () => {
  it("renvoie une sauvegarde vide pour une donnee absente ou invalide", () => {
    expect(migrateSave(null)).toEqual(createEmptySave());
    expect(migrateSave("corrompu")).toEqual(createEmptySave());
    expect(migrateSave(42)).toEqual(createEmptySave());
  });

  it("conserve les scores valides et ramene au schema courant", () => {
    const migrated = migrateSave({ schemaVersion: 0, bestScores: { level_1: 1200 } });
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.bestScores).toEqual({ level_1: 1200 });
  });

  it("ignore les entrees corrompues sans perdre les autres", () => {
    const migrated = migrateSave({
      bestScores: { ok: 500, negatif: -10, texte: "abc", infini: Number.POSITIVE_INFINITY },
    });
    expect(migrated.bestScores).toEqual({ ok: 500 });
  });

  it("tronque les scores fractionnaires", () => {
    expect(migrateSave({ bestScores: { a: 99.9 } }).bestScores).toEqual({ a: 99 });
  });

  it("complete une sauvegarde de version 1 sans perdre les scores", () => {
    const migrated = migrateSave({ schemaVersion: 1, bestScores: { level_1: 4000 } });
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.bestScores).toEqual({ level_1: 4000 });
    expect(migrated.totalXp).toBe(0);
    expect(migrated.completedQuestIds).toEqual([]);
  });

  it("nettoie les identifiants de quetes invalides et les doublons", () => {
    const migrated = migrateSave({ completedQuestIds: ["a", "a", 42, null, "b"] });
    expect(migrated.completedQuestIds).toEqual(["a", "b"]);
  });

  it("ignore une XP corrompue", () => {
    expect(migrateSave({ totalXp: -50 }).totalXp).toBe(0);
    expect(migrateSave({ totalXp: "beaucoup" }).totalXp).toBe(0);
  });
});

describe("withXp", () => {
  it("cumule l'XP gagnee", () => {
    expect(withXp(withXp(createEmptySave(), 150), 200).totalXp).toBe(350);
  });

  it("ignore un gain nul ou invalide", () => {
    const save = createEmptySave();
    expect(withXp(save, 0)).toBe(save);
    expect(withXp(save, -10)).toBe(save);
  });
});

describe("withCompletedQuests", () => {
  it("enregistre les quetes sans doublon", () => {
    let save = withCompletedQuests(createEmptySave(), ["q1", "q2"]);
    save = withCompletedQuests(save, ["q2", "q3"]);
    expect(save.completedQuestIds).toEqual(["q1", "q2", "q3"]);
  });

  it("ne modifie rien sans quete", () => {
    const save = createEmptySave();
    expect(withCompletedQuests(save, [])).toBe(save);
  });
});

describe("withBestScore", () => {
  it("enregistre un premier score", () => {
    expect(withBestScore(createEmptySave(), "level_1", 800).bestScores).toEqual({ level_1: 800 });
  });

  it("ne remplace que si le score est meilleur", () => {
    const save = withBestScore(createEmptySave(), "level_1", 800);
    expect(withBestScore(save, "level_1", 500).bestScores).toEqual({ level_1: 800 });
    expect(withBestScore(save, "level_1", 900).bestScores).toEqual({ level_1: 900 });
  });

  it("ignore un score invalide", () => {
    const save = withBestScore(createEmptySave(), "level_1", 800);
    expect(withBestScore(save, "level_1", Number.NaN)).toBe(save);
    expect(withBestScore(save, "level_1", -1)).toBe(save);
  });

  it("n'ecrase pas les autres niveaux", () => {
    let save = withBestScore(createEmptySave(), "level_1", 800);
    save = withBestScore(save, "level_2", 300);
    expect(save.bestScores).toEqual({ level_1: 800, level_2: 300 });
  });
});

describe("isNewRecord", () => {
  it("detecte un record et refuse une egalite", () => {
    const save = withBestScore(createEmptySave(), "level_1", 800);
    expect(isNewRecord(save, "level_1", 900)).toBe(true);
    expect(isNewRecord(save, "level_1", 800)).toBe(false);
    expect(isNewRecord(save, "level_2", 10)).toBe(true);
  });
});
