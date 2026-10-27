import { collectionConfig } from "../../data/config/collectionConfig";
import { characterCatalog } from "../../data/content/characters/characterCatalog";
import { itemCatalog } from "../../data/content/items/itemCatalog";
import { launcherCatalog } from "../../data/content/launchers/launcherCatalog";
import {
  type CollectionCategory,
  type SaveData,
  withCollectionItem,
  withCollectionUses,
  withCurrency,
  withUpgradeLevel,
} from "../save/saveSchema";
import type { GachaPoolEntry, GachaReward } from "./collectionTypes";

const pools: Record<CollectionCategory, readonly GachaPoolEntry[]> = {
  launchers: launcherCatalog.map(({ id }) => ({ id, category: "launchers" })),
  characters: characterCatalog.map(({ id }) => ({ id, category: "characters" })),
  items: itemCatalog.map(({ id }) => ({ id, category: "items" })),
};

export class GachaService {
  constructor(private readonly random: () => number = Math.random) {}

  draw(save: SaveData, category: CollectionCategory): GachaReward | null {
    if (save.currency < collectionConfig.gachaCost) {
      return null;
    }

    const pool = pools[category];
    if (pool.length === 0) {
      return null;
    }

    const index = Math.min(pool.length - 1, Math.floor(this.random() * pool.length));
    const itemId = pool[index]?.id;
    if (!itemId) {
      return null;
    }

    const duplicate = Object.prototype.hasOwnProperty.call(save.inventory[category], itemId);
    const currentUpgrade = save.upgrades[category][itemId] ?? 0;
    const maxed = currentUpgrade >= collectionConfig.maxDuplicateUpgradeLevel;
    let updated = withCurrency(save, -collectionConfig.gachaCost);
    updated = category === "items"
      ? withCollectionUses(updated, category, itemId, collectionConfig.defaultItemUses)
      : withCollectionItem(updated, category, itemId);
    if (duplicate && !maxed) {
      updated = withUpgradeLevel(
        updated,
        category,
        itemId,
        collectionConfig.maxDuplicateUpgradeLevel,
      );
    } else if (duplicate && maxed) {
      updated = withCurrency(
        updated,
        Math.floor(collectionConfig.gachaCost * collectionConfig.maxDuplicateRefundRatio),
      );
    }

    return {
      category,
      itemId,
      duplicate,
      upgradeLevel: updated.upgrades[category][itemId] ?? 0,
      currencyRemaining: updated.currency,
      save: updated,
    };
  }
}