import { describe, expect, it } from "vitest";
import { collectionConfig } from "../../data/config/collectionConfig";
import { createEmptySave, withCurrency } from "../save/saveSchema";
import { GachaService } from "./GachaService";

describe("GachaService", () => {
  it("refuse un tirage sans monnaie suffisante", () => {
    expect(new GachaService(() => 0).draw(createEmptySave(), "items")).toBeNull();
  });

  it("tire dans le pool de la categorie demandee et debite le cout", () => {
    const save = withCurrency(createEmptySave(), collectionConfig.gachaCost);
    const reward = new GachaService(() => 0).draw(save, "items");

    expect(reward?.category).toBe("items");
    expect(reward?.itemId).toBe("item_stone");
    expect(reward?.duplicate).toBe(false);
    expect(reward?.currencyRemaining).toBe(0);
    expect(reward?.save.inventory.items.item_stone).toBe(1);
    expect(reward?.upgradeLevel).toBe(0);
  });

  it("transforme un doublon en petite amelioration plafonnee", () => {
    let save = withCurrency(createEmptySave(), collectionConfig.gachaCost * 10);
    const gacha = new GachaService(() => 0);

    for (let index = 0; index < collectionConfig.maxDuplicateUpgradeLevel + 2; index += 1) {
      save = gacha.draw(save, "items")?.save ?? save;
    }

    const reward = gacha.draw(save, "items");
    expect(reward?.duplicate).toBe(true);
    expect(reward?.upgradeLevel).toBe(collectionConfig.maxDuplicateUpgradeLevel);
    expect(reward?.save.upgrades.items.item_stone).toBe(collectionConfig.maxDuplicateUpgradeLevel);
  });

  it("rembourse la moitie du tirage au niveau maximal", () => {
    const save = {
      ...withCurrency(createEmptySave(), collectionConfig.gachaCost),
      inventory: { launchers: {}, characters: {}, items: { item_stone: 1 } },
      upgrades: {
        launchers: {},
        characters: {},
        items: { item_stone: collectionConfig.maxDuplicateUpgradeLevel },
      },
    };
    const reward = new GachaService(() => 0).draw(save, "items");

    expect(reward?.upgradeLevel).toBe(collectionConfig.maxDuplicateUpgradeLevel);
    expect(reward?.currencyRemaining).toBe(
      collectionConfig.gachaCost * collectionConfig.maxDuplicateRefundRatio,
    );
  });
});