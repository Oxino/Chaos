import type { LevelBlockout } from "../../data/content/levels/levelTypes";

/**
 * Nombre de niveaux accessibles (spec 8.5). Le premier l'est toujours ; chacun des suivants
 * exige d'avoir atteint l'objectif de score du precedent. La progression s'arrete au premier
 * objectif non atteint : on ne peut pas sauter un niveau.
 */
export function unlockedLevelCount(
  levels: readonly LevelBlockout[],
  bestScores: Readonly<Record<string, number>>,
): number {
  if (levels.length === 0) {
    throw new RangeError("La campagne doit comporter au moins un niveau.");
  }

  let unlocked = 1;
  while (unlocked < levels.length) {
    const previous = levels[unlocked - 1];
    if (!previous || (bestScores[previous.id] ?? 0) < previous.targetScore) {
      break;
    }
    unlocked += 1;
  }
  return unlocked;
}

export function isLevelUnlocked(
  levels: readonly LevelBlockout[],
  index: number,
  bestScores: Readonly<Record<string, number>>,
): boolean {
  return index >= 0 && index < unlockedLevelCount(levels, bestScores);
}
