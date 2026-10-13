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
  private launchPowerBonus = 0;
  private bounceBonus = 0;

  /** Bonus issus de l'arbre de competences (spec 9.2). */
  applySkillBonuses(launchPowerBonus: number, bounceBonus: number): void {
    this.launchPowerBonus = launchPowerBonus;
    this.bounceBonus = bounceBonus;
  }

  get character(): CharacterDefinition {
    return characterCatalog[this.characterIndex] as CharacterDefinition;
  }

  get item(): ItemDefinition {
    return itemCatalog[this.itemIndex] as ItemDefinition;
  }

  get resolved(): ResolvedBuild {
    const base = resolveBuild(this.character, this.item);
    return { ...base, restitution: Math.min(0.9, base.restitution + this.bounceBonus) };
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

  /** Vitesse initiale utilisee par l'apercu de trajectoire (spec 5.2), plafonnee. */
  launchSpeed(power: number): number {
    const raw =
      (launcherConfig.maxLaunchImpulse *
        this.resolved.launchImpulseScale *
        (1 + this.launchPowerBonus) *
        power) /
      this.characterMass;
    return Math.min(raw, launcherConfig.maxLaunchSpeed);
  }

  /** L'impulsion derive de la vitesse plafonnee, pour que tir et apercu restent coherents. */
  launchImpulse(power: number): number {
    return this.launchSpeed(power) * this.characterMass;
  }
}
