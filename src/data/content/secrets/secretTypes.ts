import type { Vector3Like } from "../levels/levelTypes";

/**
 * Secret d'un niveau (spec 7.3). Trois a quatre par niveau, jamais necessaires pour atteindre
 * l'objectif de score. La zone reste invisible jusqu'a sa decouverte par un personnage.
 */
export interface SecretDefinition {
  readonly id: string;
  readonly name: string;
  readonly position: Vector3Like;
  readonly radius: number;
  readonly xpReward: number;
  readonly scoreBonus: number;
}
