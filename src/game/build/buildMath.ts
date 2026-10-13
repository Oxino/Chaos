import type { CharacterDefinition } from "../../data/content/characters/characterDefinition";
import type { ItemDefinition } from "../../data/content/items/itemCatalog";
import type { PassiveEffect } from "../../data/content/passives/passiveTypes";

export interface ResolvedBuild {
  readonly massScale: number;
  readonly restitution: number;
  readonly friction: number;
  readonly launchImpulseScale: number;
  readonly scoreMultiplier: number;
}

const MIN_RESTITUTION = 0;
const MAX_RESTITUTION = 0.9;

/**
 * Combine les statistiques d'un personnage et d'un objet avec leurs passifs (spec 10.1, 10.5).
 * Au plus deux passifs interviennent : un du personnage, un de l'objet.
 */
export function resolveBuild(
  character: CharacterDefinition,
  item: ItemDefinition,
): ResolvedBuild {
  let build: ResolvedBuild = {
    massScale: character.massScale * item.massScale,
    restitution: character.restitution,
    friction: character.friction,
    launchImpulseScale: item.launchImpulseScale,
    scoreMultiplier: 1,
  };

  build = applyPassive(build, character.passive);
  build = applyPassive(build, item.passive);

  return { ...build, restitution: clampRestitution(build.restitution) };
}

function applyPassive(build: ResolvedBuild, passive: PassiveEffect | null): ResolvedBuild {
  if (!passive) {
    return build;
  }
  switch (passive.kind) {
    case "bounce":
      return { ...build, restitution: build.restitution + passive.restitutionBonus };
    case "score":
      return { ...build, scoreMultiplier: build.scoreMultiplier * passive.multiplier };
    case "weight":
      return { ...build, massScale: build.massScale * passive.massScale };
    case "power":
      return {
        ...build,
        launchImpulseScale: build.launchImpulseScale * passive.launchImpulseScale,
      };
  }
}

function clampRestitution(value: number): number {
  return Math.min(Math.max(value, MIN_RESTITUTION), MAX_RESTITUTION);
}
