import { splitAward } from "./scoreMath";

export interface ScoreBreakdown {
  readonly direct: number;
  readonly combo: number;
  readonly total: number;
}

/**
 * Cumule le score de la partie (spec 8.1). Chaque recompense porte un identifiant unique :
 * un objet deja compte ne peut jamais rapporter deux fois (spec 6.5, 15.5).
 */
export class ScoreService {
  private readonly awardedIds = new Set<string>();
  private directPoints = 0;
  private comboPoints = 0;

  get breakdown(): ScoreBreakdown {
    return {
      direct: this.directPoints,
      combo: this.comboPoints,
      total: this.directPoints + this.comboPoints,
    };
  }

  get total(): number {
    return this.directPoints + this.comboPoints;
  }

  /** Renvoie false si l'identifiant a deja ete recompense. */
  award(id: string, baseValue: number, multiplier: number): boolean {
    if (this.awardedIds.has(id)) {
      return false;
    }
    this.awardedIds.add(id);

    const { direct, combo } = splitAward(baseValue, multiplier);
    this.directPoints += direct;
    this.comboPoints += combo;
    return true;
  }

  reset(): void {
    this.awardedIds.clear();
    this.directPoints = 0;
    this.comboPoints = 0;
  }
}
