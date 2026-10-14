import { withCurrency, type SaveData } from "../save/saveSchema";

/** Economie a monnaie unique. Les montants viennent des recompenses de contenu. */
export class EconomyService {
  balance(save: SaveData): number {
    return save.currency;
  }

  canAfford(save: SaveData, cost: number): boolean {
    return Number.isFinite(cost) && cost >= 0 && save.currency >= cost;
  }

  grant(save: SaveData, amount: number): SaveData {
    return withCurrency(save, amount);
  }

  spend(save: SaveData, amount: number): SaveData {
    if (!this.canAfford(save, amount)) {
      return save;
    }
    return withCurrency(save, -amount);
  }
}