import { launcherConfig } from "../../data/config/gameplayConfig";
import { characterCatalog } from "../../data/content/characters/characterCatalog";
import type { CharacterDefinition } from "../../data/content/characters/characterDefinition";
import { totalMassOf } from "../../data/content/characters/characterTypes";
import { itemCatalog, type ItemDefinition } from "../../data/content/items/itemCatalog";
import { resolveBuild, type ResolvedBuild } from "./buildMath";

/**
 * Build du tir en cours : 1 lanceur + 1 personnage + 1 objet (spec 10.1).
 * Le joueur peut en changer avant chaque tir.
 */
export class BuildSelectionService {
  private characterIndex = 0;
  private itemIndex = 0;

  get character(): CharacterDefinition {
    return characterCatalog[this.characterIndex] as CharacterDefinition;
  }

  get item(): ItemDefinition {
    return itemCatalog[this.itemIndex] as ItemDefinition;
  }

  get resolved(): ResolvedBuild {
    return resolveBuild(this.character, this.item);
  }

  get characterMass(): number {
    return totalMassOf(this.character.ragdoll) * this.resolved.massScale;
  }

  cycleCharacter(): void {
    this.characterIndex = (this.characterIndex + 1) % characterCatalog.length;
  }

  cycleItem(): void {
    this.itemIndex = (this.itemIndex + 1) % itemCatalog.length;
  }

  launchImpulse(power: number): number {
    return launcherConfig.maxLaunchImpulse * this.resolved.launchImpulseScale * power;
  }

  /** Vitesse initiale utilisee par l'apercu de trajectoire (spec 5.2). */
  launchSpeed(power: number): number {
    return this.launchImpulse(power) / this.characterMass;
  }
}
