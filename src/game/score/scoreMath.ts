/**
 * Multiplicateur applique a une destruction selon la longueur de la chaine en cours (spec 8.3).
 * Le plafond evite qu'une cascade incontrolee fasse exploser le score.
 */
export function comboMultiplier(chainLength: number, maxMultiplier: number): number {
  if (!Number.isInteger(chainLength) || chainLength < 1) {
    throw new RangeError(`chainLength doit etre un entier >= 1, recu: ${chainLength}`);
  }
  if (maxMultiplier < 1) {
    throw new RangeError(`maxMultiplier doit valoir au moins 1, recu: ${maxMultiplier}`);
  }
  return Math.min(chainLength, maxMultiplier);
}

export interface AwardSplit {
  /** Valeur de base de l'objet detruit (spec 8.2). */
  readonly direct: number;
  /** Bonus apporte par la reaction en chaine (spec 8.3). */
  readonly combo: number;
}

export function splitAward(baseValue: number, multiplier: number): AwardSplit {
  if (baseValue < 0) {
    throw new RangeError(`baseValue ne peut pas etre negatif, recu: ${baseValue}`);
  }
  if (multiplier < 1) {
    throw new RangeError(`multiplier doit valoir au moins 1, recu: ${multiplier}`);
  }
  return { direct: baseValue, combo: baseValue * (multiplier - 1) };
}
