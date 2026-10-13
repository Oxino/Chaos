import type { Vector3Like } from "../levels/levelTypes";

/**
 * Secret d'un niveau (spec 7.3). Trois a quatre par niveau, jamais necessaires pour atteindre
 * l'objectif de score.
 *
 * Simplification assumee du prototype : le secret est une zone a traverser en vol, marquee par
 * un anneau visible. Les secrets reellement dissimules viendront avec le contenu de la Phase 7.
 */
export interface SecretDefinition {
  readonly id: string;
  readonly name: string;
  readonly position: Vector3Like;
  readonly radius: number;
  readonly xpReward: number;
  readonly scoreBonus: number;
}
