import type { CollectionCategory, SaveData } from "./saveSchema";
import type { ActiveAbility } from "../../data/content/items/abilityTypes";
import type { ResolvedBuild } from "../build/buildMath";

export interface ActiveBuildDebugView {
  readonly launcherId: string;
  readonly characterId: string;
  readonly itemId: string;
  readonly upgrades: Readonly<{ launcher: number; character: number; item: number }>;
  readonly resolved: ResolvedBuild;
  readonly characterMass: number;
  readonly launchSpeedAtFullPower: number;
  readonly launchImpulseAtFullPower: number;
  readonly ability: ActiveAbility | null;
}

export interface ChaosDebugApi {
  save(): SaveData;
  build(): ActiveBuildDebugView;
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