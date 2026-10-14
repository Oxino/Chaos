import type { CollectionCategory, SaveData } from "../save/saveSchema";

export type { CollectionCategory };

export interface GachaPoolEntry {
  readonly id: string;
  readonly category: CollectionCategory;
}

export interface GachaReward {
  readonly category: CollectionCategory;
  readonly itemId: string;
  readonly duplicate: boolean;
  readonly upgradeLevel: number;
  readonly currencyRemaining: number;
  readonly save: SaveData;
}