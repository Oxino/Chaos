import { launcherConfig } from "../../data/config/gameplayConfig";
import { characterCatalog } from "../../data/content/characters/characterCatalog";
import { launcherCatalog } from "../../data/content/launchers/launcherCatalog";
import type { LauncherDefinition } from "../../data/content/launchers/launcherCatalog";
import type { CharacterDefinition } from "../../data/content/characters/characterDefinition";
import { totalMassOf } from "../../data/content/characters/characterTypes";
import { itemCatalog, type ItemDefinition } from "../../data/content/items/itemCatalog";
import type { ActiveAbility } from "../../data/content/items/abilityTypes";
import type { CollectionData, UpgradeData } from "../save/saveSchema";
import { collectionConfig } from "../../data/config/collectionConfig";
import { resolveBuild, type ResolvedBuild } from "./buildMath";

/**
 * Build du tir en cours : 1 lanceur + 1 personnage + 1 objet (spec 10.1).
 * Le joueur peut en changer avant chaque tir.
 */
export class BuildSelectionService {
  private characterIndex = 0;
  private itemIndex = 0;
  private launcherIndex = 0;
  private launchPowerBonus = 0;
  private bounceBonus = 0;
  private collectionUpgrades: UpgradeData = { launchers: {}, characters: {}, items: {} };
  private owned: CollectionData = {
    launchers: Object.fromEntries(launcherCatalog.map((entry) => [entry.id, 1])),
    characters: Object.fromEntries(characterCatalog.map((entry) => [entry.id, 1])),
    items: Object.fromEntries(itemCatalog.map((entry) => [entry.id, 1])),
  };

  /** Bonus issus de l'arbre de competences (spec 9.2). */
  applySkillBonuses(launchPowerBonus: number, bounceBonus: number): void {
    this.launchPowerBonus = launchPowerBonus;
    this.bounceBonus = bounceBonus;
  }

  applyCollectionUpgrades(upgrades: UpgradeData): void {
    this.collectionUpgrades = upgrades;
  }

  applyCollectionOwnership(owned: CollectionData): void {
    this.owned = owned;
    this.ensureOwnedSelection();
  }

  get launcher(): LauncherDefinition {
    return launcherCatalog[this.launcherIndex] as LauncherDefinition;
  }

  equip(category: "launchers" | "characters" | "items", id: string): boolean {
    if ((this.owned[category][id] ?? 0) <= 0) {
      return false;
    }
    if (category === "launchers") {
      const index = launcherCatalog.findIndex((entry) => entry.id === id);
      if (index < 0) return false;
      this.launcherIndex = index;
    } else if (category === "characters") {
      const index = characterCatalog.findIndex((entry) => entry.id === id);
      if (index < 0) return false;
      this.characterIndex = index;
    } else {
      const index = itemCatalog.findIndex((entry) => entry.id === id);
      if (index < 0) return false;
      this.itemIndex = index;
    }
    return true;
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
    this.characterIndex = nextOwnedIndex(
      this.characterIndex,
      characterCatalog.map((entry) => entry.id),
      this.owned.characters,
    );
  }

  cycleItem(): void {
    this.itemIndex = nextOwnedIndex(this.itemIndex, itemCatalog.map((entry) => entry.id), this.owned.items);
  }

  cycleLauncher(): void {
    this.launcherIndex = nextOwnedIndex(
      this.launcherIndex,
      launcherCatalog.map((entry) => entry.id),
      this.owned.launchers,
    );
  }

  /** Vitesse initiale utilisee par l'apercu de trajectoire (spec 5.2), plafonnee. */
  launchSpeed(power: number): number {
    const raw =
      (launcherConfig.maxLaunchImpulse *
        this.launcher.launchImpulseScale *
        upgradeMultiplier(this.collectionUpgrades.launchers[this.launcher.id] ?? 0) *
        this.resolved.launchImpulseScale *
        (1 + this.launchPowerBonus) *
        power) /
      this.characterMass;
    return Math.min(raw, this.launcher.maxLaunchSpeed || launcherConfig.maxLaunchSpeed);
  }

  /** L'impulsion derive de la vitesse plafonnee, pour que tir et apercu restent coherents. */
  launchImpulse(power: number): number {
    return this.launchSpeed(power) * this.characterMass;
  }

  private ensureOwnedSelection(): void {
    this.launcherIndex = ownedIndexOrFirst(this.launcherIndex, launcherCatalog.map((entry) => entry.id), this.owned.launchers);
    this.characterIndex = ownedIndexOrFirst(this.characterIndex, characterCatalog.map((entry) => entry.id), this.owned.characters);
    this.itemIndex = ownedIndexOrFirst(this.itemIndex, itemCatalog.map((entry) => entry.id), this.owned.items);
  }
}

export function upgradeMultiplier(level: number): number {
  return 1 + Math.max(0, level) * collectionConfig.duplicateBonusPerLevel;
}

function nextOwnedIndex(
  currentIndex: number,
  ids: readonly string[],
  owned: Readonly<Record<string, number>>,
): number {
  for (let offset = 1; offset <= ids.length; offset += 1) {
    const index = (currentIndex + offset) % ids.length;
    if ((owned[ids[index] ?? ""] ?? 0) > 0) return index;
  }
  return currentIndex;
}

function ownedIndexOrFirst(
  currentIndex: number,
  ids: readonly string[],
  owned: Readonly<Record<string, number>>,
): number {
  if ((owned[ids[currentIndex] ?? ""] ?? 0) > 0) return currentIndex;
  return ids.findIndex((id) => (owned[id] ?? 0) > 0);
}
