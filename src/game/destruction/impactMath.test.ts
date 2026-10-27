import { describe, expect, it } from "vitest";
import { destructibleCatalog } from "../../data/content/destructibles/destructibleCatalog";
import type { DestructibleDefinition } from "../../data/content/destructibles/destructibleTypes";
import {
  maxHealthForDefinition,
  resolveImpact,
  stateForHealth,
  stateForStage,
} from "./impactMath";

const car: DestructibleDefinition = {
  id: "car",
  displayName: "Voiture",
  destructionMode: "crush",
  stages: 1,
  maxHealth: 220,
  minimumImpactThreshold: 220,
  damageScale: 0.01,
  scoreValue: 300,
  staticUntilDestroyed: false,
  dynamicMass: 1200,
  destructionImpulse: 0,
};

const building: DestructibleDefinition = { ...car, id: "building", stages: 4, maxHealth: 880 };

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
      maxHealthForDefinition(configuredCar),
      configuredCar,
    );

    expect(outcome.qualifies).toBe(true);
    expect(outcome.stagesLost).toBe(1);
    expect(outcome.nextHealth).toBe(300);
    expect(outcome.damageApplied).toBe(150);
  });

  it("n'enleve qu'une etape pour un impact juste au-dessus du seuil", () => {
    expect(resolveImpact(230, maxHealthForDefinition(building), building).stagesLost).toBe(1);
  });

  it("retire les degats numeriques sans depasser zero", () => {
    const outcome = resolveImpact(520, maxHealthForDefinition(building), building);
    expect(outcome.damageApplied).toBe(520);
    expect(outcome.nextHealth).toBe(360);
    expect(outcome.destroyed).toBe(false);
  });

  it("ne descend jamais sous zero etape", () => {
    expect(resolveImpact(5000, maxHealthForDefinition(building), building).nextHealth).toBe(0);
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

describe("stateForHealth", () => {
  it("applique les etats selon le pourcentage de vie", () => {
    expect(stateForHealth(100, 100)).toBe("Intact");
    expect(stateForHealth(99, 100)).toBe("Damaged");
    expect(stateForHealth(66, 100)).toBe("Damaged");
    expect(stateForHealth(65, 100)).toBe("Critical");
    expect(stateForHealth(1, 100)).toBe("Critical");
    expect(stateForHealth(0, 100)).toBe("Destroyed");
  });
});
