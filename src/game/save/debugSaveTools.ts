import type { CollectionCategory, SaveData } from "./saveSchema";

export interface ChaosDebugApi {
  save(): SaveData;
  setCurrency(amount: number): Promise<SaveData>;
  addCurrency(amount: number): Promise<SaveData>;
  setXp(totalXp: number): Promise<SaveData>;
  addItem(category: CollectionCategory, itemId: string, count?: number): Promise<SaveData>;
  setSkillRank(skillId: string, rank: number): Promise<SaveData>;
  reset(): Promise<SaveData>;
}

declare global {
  interface Window {
    chaosDebug?: ChaosDebugApi;
  }
}

export function installChaosDebugApi(api: ChaosDebugApi): void {
  window.chaosDebug = api;
}

export function removeChaosDebugApi(): void {
  delete window.chaosDebug;
}