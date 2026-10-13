import { describe, expect, it } from "vitest";
import type { CharacterDefinition } from "../../data/content/characters/characterDefinition";
import { prototypeRagdoll } from "../../data/content/characters/prototypeRagdoll";
import type { ItemDefinition } from "../../data/content/items/itemCatalog";
import { resolveBuild } from "./buildMath";

const neutralCharacter: CharacterDefinition = {
  id: "c",
  displayName: "C",
  description: "",
  ragdoll: prototypeRagdoll,
  massScale: 1,
  restitution: 0.3,
  friction: 0.5,
  tint: null,
  passive: null,
};

const neutralItem: ItemDefinition = {
  id: "i",
  displayName: "I",
  description: "",
  massScale: 1,
  launchImpulseScale: 1,
  passive: null,
  ability: null,
};

describe("resolveBuild", () => {
  it("laisse les statistiques intactes sans passif", () => {
    expect(resolveBuild(neutralCharacter, neutralItem)).toEqual({
      massScale: 1,
      restitution: 0.3,
      friction: 0.5,
      launchImpulseScale: 1,
      scoreMultiplier: 1,
    });
  });

  it("multiplie les masses du personnage et de l'objet", () => {
    const build = resolveBuild(
      { ...neutralCharacter, massScale: 0.5 },
      { ...neutralItem, massScale: 1.8 },
    );
    expect(build.massScale).toBeCloseTo(0.9);
  });

  it("cumule les deux passifs de rebond", () => {
    const build = resolveBuild(
      { ...neutralCharacter, passive: { kind: "bounce", restitutionBonus: 0.3 } },
      { ...neutralItem, passive: { kind: "bounce", restitutionBonus: -0.2 } },
    );
    expect(build.restitution).toBeCloseTo(0.4);
  });

  it("borne le rebond dans un intervalle jouable", () => {
    const tooHigh = resolveBuild(
      { ...neutralCharacter, passive: { kind: "bounce", restitutionBonus: 5 } },
      neutralItem,
    );
    const tooLow = resolveBuild(
      { ...neutralCharacter, passive: { kind: "bounce", restitutionBonus: -5 } },
      neutralItem,
    );
    expect(tooHigh.restitution).toBe(0.9);
    expect(tooLow.restitution).toBe(0);
  });

  it("applique le multiplicateur de score du personnage", () => {
    const build = resolveBuild(
      { ...neutralCharacter, passive: { kind: "score", multiplier: 2 } },
      neutralItem,
    );
    expect(build.scoreMultiplier).toBe(2);
  });

  it("applique le passif de puissance de l'objet", () => {
    const build = resolveBuild(neutralCharacter, {
      ...neutralItem,
      launchImpulseScale: 0.95,
      passive: { kind: "power", launchImpulseScale: 1.45 },
    });
    expect(build.launchImpulseScale).toBeCloseTo(1.3775);
  });
});
