import { launcherConfig } from "../../data/config/gameplayConfig";
import { characterCatalog } from "../../data/content/characters/characterCatalog";
import type { CharacterDefinition } from "../../data/content/characters/characterDefinition";
import { totalMassOf } from "../../data/content/characters/characterTypes";
import { itemCatalog, type ItemDefinition } from "../../data/content/items/itemCatalog";
import type { ActiveAbility } from "../../data/content/items/abilityTypes";
import type { UpgradeData } from "../save/saveSchema";
import { collectionConfig } from "../../data/config/collectionConfig";
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
  private collectionUpgrades: UpgradeData = { launchers: {}, characters: {}, items: {} };

  /** Bonus issus de l'arbre de competences (spec 9.2). */
  applySkillBonuses(launchPowerBonus: number, bounceBonus: number): void {
    this.launchPowerBonus = launchPowerBonus;
    this.bounceBonus = bounceBonus;
  }

  applyCollectionUpgrades(upgrades: UpgradeData): void {
    this.collectionUpgrades = upgrades;
  }

  get character(): CharacterDefinition {
    return characterCatalog[this.characterIndex] as CharacterDefinition;
  }

  get item(): ItemDefinition {
    return itemCatalog[this.itemIndex] as ItemDefinition;
  }

  get resolved(): ResolvedBuild {
    const base = resolveBuild(this.character, this.item);
    const characterUpgrade = upgradeMultiplier(
      this.collectionUpgrades.characters[this.character.id] ?? 0,
    );
    const itemUpgrade = upgradeMultiplier(this.collectionUpgrades.items[this.item.id] ?? 0);
    return {
      ...base,
      restitution: Math.min(0.9, base.restitution * characterUpgrade + this.bounceBonus),
      launchImpulseScale: base.launchImpulseScale * itemUpgrade,
      scoreMultiplier: base.scoreMultiplier * characterUpgrade,
    };
  }

  get ability(): ActiveAbility | null {
    const ability = this.item.ability;
    if (!ability) {
      return null;
    }
    const multiplier = upgradeMultiplier(this.collectionUpgrades.items[this.item.id] ?? 0);
    if (ability.kind === "bomb") {
      return {
        ...ability,
        radius: ability.radius * multiplier,
        impulse: ability.impulse * multiplier,
        impactStrength: ability.impactStrength * multiplier,
      };
    }
    return { ...ability, impulsePerSecond: ability.impulsePerSecond * multiplier };
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
        upgradeMultiplier(this.collectionUpgrades.launchers.launcher_giant_slingshot ?? 0) *
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

export function upgradeMultiplier(level: number): number {
  return 1 + Math.max(0, level) * collectionConfig.duplicateBonusPerLevel;
}
