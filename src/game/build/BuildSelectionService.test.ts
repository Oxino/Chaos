import { describe, expect, it } from "vitest";
import { BuildSelectionService } from "./BuildSelectionService";

const emptyUpgrades = {
  launchers: {},
  characters: {},
  items: {},
};

describe("BuildSelectionService collection upgrades", () => {
  it("augmente la vitesse du lanceur avec ses doublons", () => {
    const build = new BuildSelectionService();
    const baseSpeed = build.launchSpeed(1);

    build.applyCollectionUpgrades({
      ...emptyUpgrades,
      launchers: { launcher_giant_slingshot: 3 },
    });

    expect(build.launchSpeed(1)).toBeCloseTo(baseSpeed * 1.15);
  });

  it("applique le niveau du personnage au rebond et au score", () => {
    const build = new BuildSelectionService();
    build.cycleCharacter();
    build.cycleCharacter();
    const base = build.resolved;

    build.applyCollectionUpgrades({
      ...emptyUpgrades,
      characters: { character_safe: 3 },
    });

    expect(build.resolved.restitution).toBeCloseTo(Math.min(0.9, base.restitution * 1.15));
    expect(build.resolved.scoreMultiplier).toBeCloseTo(base.scoreMultiplier * 1.15);
  });

  it("augmente les statistiques de la capacite de l'objet", () => {
    const build = new BuildSelectionService();
    for (let index = 0; index < 4; index += 1) {
      build.cycleItem();
    }
    const baseAbility = build.ability;
    if (!baseAbility || baseAbility.kind !== "bomb") {
      throw new Error("Le catalogue attendu doit selectionner la bombe");
    }

    build.applyCollectionUpgrades({
      ...emptyUpgrades,
      items: { item_bomb: 3 },
    });
    const upgradedAbility = build.ability;
    if (!upgradedAbility || upgradedAbility.kind !== "bomb") {
      throw new Error("La bombe amelioree est introuvable");
    }

    expect(upgradedAbility.radius).toBeCloseTo(baseAbility.radius * 1.15);
    expect(upgradedAbility.impulse).toBeCloseTo(baseAbility.impulse * 1.15);
    expect(upgradedAbility.impactStrength).toBeCloseTo(baseAbility.impactStrength * 1.15);
  });

  it("permet de desequiper l'objet puis de revenir au premier objet", () => {
    const build = new BuildSelectionService();
    for (let index = 0; index < 5; index += 1) {
      build.cycleItem();
    }

    expect(build.item).toBeNull();
    expect(build.ability).toBeNull();

    build.cycleItem();
    expect(build.item?.id).toBe("item_stone");
  });
});
