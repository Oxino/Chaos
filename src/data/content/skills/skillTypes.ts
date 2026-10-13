/** Branches du \u00a79.2. L'\u00e9l\u00e9mentaire attend des effets de feu, electricite et cryogenie. */
export type SkillBranch = "propulsion" | "impact" | "bounce" | "explosive" | "chaos";

/**
 * Effet d'un n\u0153ud, exprime par rang. Aucun effet ne permet de piloter librement la
 * trajectoire en vol : c'est interdit par le \u00a79.2.
 */
export type SkillEffect =
  | { readonly kind: "launchPower"; readonly bonusPerRank: number }
  | { readonly kind: "impact"; readonly bonusPerRank: number }
  | { readonly kind: "bounce"; readonly bonusPerRank: number }
  | { readonly kind: "explosionRadius"; readonly bonusPerRank: number }
  | { readonly kind: "destructionScore"; readonly bonusPerRank: number }
  | { readonly kind: "comboScore"; readonly bonusPerRank: number };

export interface SkillNode {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly branch: SkillBranch;
  readonly prerequisiteIds: readonly string[];
  /** Cout en points de competence, par rang. */
  readonly cost: number;
  readonly maxRank: number;
  readonly effect: SkillEffect;
}

export interface SkillBonuses {
  readonly launchPower: number;
  readonly impact: number;
  readonly bounce: number;
  readonly explosionRadius: number;
  readonly destructionScore: number;
  readonly comboScore: number;
}

export function createEmptyBonuses(): SkillBonuses {
  return {
    launchPower: 0,
    impact: 0,
    bounce: 0,
    explosionRadius: 0,
    destructionScore: 0,
    comboScore: 0,
  };
}
