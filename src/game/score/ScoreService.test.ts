import { describe, expect, it } from "vitest";
import { ScoreService } from "./ScoreService";

describe("ScoreService", () => {
  it("demarre a zero", () => {
    expect(new ScoreService().breakdown).toEqual({ direct: 0, combo: 0, total: 0 });
  });

  it("cumule les degats directs et les bonus de chaine", () => {
    const score = new ScoreService();
    score.award("car_1", 300, 1);
    score.award("car_2", 300, 3);
    expect(score.breakdown).toEqual({ direct: 600, combo: 600, total: 1200 });
  });

  it("refuse de recompenser deux fois le meme objet", () => {
    const score = new ScoreService();
    expect(score.award("car_1", 300, 1)).toBe(true);
    expect(score.award("car_1", 300, 5)).toBe(false);
    expect(score.total).toBe(300);
  });

  it("se remet a zero et autorise a nouveau les memes identifiants", () => {
    const score = new ScoreService();
    score.award("car_1", 300, 1);
    score.reset();
    expect(score.total).toBe(0);
    expect(score.award("car_1", 300, 1)).toBe(true);
  });
});
