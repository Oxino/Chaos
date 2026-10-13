import { describe, expect, it } from "vitest";
import {
  CURRENT_SCHEMA_VERSION,
  createEmptySave,
  isNewRecord,
  migrateSave,
  withBestScore,
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
