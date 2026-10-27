import { describe, expect, it } from "vitest";
import { destructibleCatalog } from "../../data/content/destructibles/destructibleCatalog";
import type { DestructibleDefinition } from "../../data/content/destructibles/destructibleTypes";
import { requiredImpactForStages, resolveImpact, stateForStage } from "./impactMath";

const car: DestructibleDefinition = {
  id: "car",
  displayName: "Voiture",
  destructionMode: "crush",
  stages: 1,
  minimumImpactThreshold: 220,
  damageScale: 0.01,
  scoreValue: 300,
  staticUntilDestroyed: false,
  dynamicMass: 1200,
  destructionImpulse: 0,
};

const building: DestructibleDefinition = { ...car, id: "building", stages: 4 };

describe("resolveImpact", () => {
  it("ignore un impact sous le seuil", () => {
    const outcome = resolveImpact(219, 1, car);
    expect(outcome.qualifies).toBe(false);
    expect(outcome.nextStage).toBe(1);
  });

  it("detruit la voiture des le premier impact qualifiant", () => {
    const outcome = resolveImpact(220, 1, car);
    expect(outcome.qualifies).toBe(true);
    expect(outcome.destroyed).toBe(true);
    expect(outcome.nextStage).toBe(0);
  });

  it("conserve une etape de degats sur une voiture a 150 N.s", () => {
    const configuredCar = destructibleCatalog.car;
    expect(configuredCar).toBeDefined();
    if (!configuredCar) {
      throw new Error("Configuration de voiture introuvable");
    }
    const outcome = resolveImpact(
      150,
      configuredCar.stages,
      configuredCar,
    );

    expect(outcome.qualifies).toBe(true);
    expect(outcome.stagesLost).toBe(1);
    expect(outcome.nextStage).toBe(2);
  });

  it("n'enleve qu'une etape pour un impact juste au-dessus du seuil", () => {
    expect(resolveImpact(230, 4, building).stagesLost).toBe(1);
  });

  it("enleve davantage d'etapes pour un impact violent", () => {
    expect(resolveImpact(520, 4, building).stagesLost).toBe(4);
    expect(resolveImpact(520, 4, building).destroyed).toBe(true);
  });

  it("ne descend jamais sous zero etape", () => {
    expect(resolveImpact(5000, 2, building).nextStage).toBe(0);
  });

  it("ignore tout impact sur un objet deja detruit", () => {
    expect(resolveImpact(5000, 0, car).qualifies).toBe(false);
  });
});

describe("stateForStage", () => {
  it("decrit les etats intermediaires", () => {
    expect(stateForStage(4, 4)).toBe("Intact");
    expect(stateForStage(3, 4)).toBe("Damaged");
    expect(stateForStage(1, 4)).toBe("Critical");
    expect(stateForStage(0, 4)).toBe("Destroyed");
  });
});

describe("requiredImpactForStages", () => {
  it("calcule le seuil pour toutes les etapes restantes", () => {
    expect(requiredImpactForStages(4, 220, 0.01)).toBe(520);
    expect(requiredImpactForStages(1, 220, 0.01)).toBe(220);
    expect(requiredImpactForStages(0, 220, 0.01)).toBe(0);
  });
});
