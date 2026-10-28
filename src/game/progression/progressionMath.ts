export interface ProgressionConfig {
  /** XP accordee par point de score (spec 9.1). */
  readonly xpPerScorePoint: number;
  /** XP necessaire pour passer du niveau 1 au niveau 2. */
  readonly baseLevelXp: number;
  /** Supplement d'XP demande a chaque palier suivant : cout croissant. */
  readonly levelXpIncrement: number;
  readonly maxLevel: number;
  /** Un point de competence par niveau, et un second tous les N niveaux. */
  readonly bonusSkillPointEvery: number;
}

export interface LevelProgress {
  readonly level: number;
  readonly xpIntoLevel: number;
  /** XP requise pour atteindre le niveau suivant, 0 au niveau maximum. */
  readonly xpForNextLevel: number;
}

/** Cout du passage de `level` a `level + 1`. Croissant par palier. */
export function xpForLevel(level: number, config: ProgressionConfig): number {
  assertLevel(level);
  if (level >= config.maxLevel) {
    return 0;
  }
  return config.baseLevelXp + (level - 1) * config.levelXpIncrement;
}

export function resolveLevel(totalXp: number, config: ProgressionConfig): LevelProgress {
  if (!Number.isFinite(totalXp) || totalXp < 0) {
    throw new RangeError(`totalXp doit etre un nombre positif, recu: ${totalXp}`);
  }

  let level = 1;
  let remaining = Math.floor(totalXp);

  while (level < config.maxLevel) {
    const cost = xpForLevel(level, config);
    if (remaining < cost) {
      break;
    }
    remaining -= cost;
    level += 1;
  }

  return { level, xpIntoLevel: remaining, xpForNextLevel: xpForLevel(level, config) };
}

/** XP totale minimale requise pour commencer un niveau donne. */
export function totalXpForLevel(level: number, config: ProgressionConfig): number {
  assertLevel(level);
  const cappedLevel = Math.min(level, config.maxLevel);
  let total = 0;
  for (let current = 1; current < cappedLevel; current += 1) {
    total += xpForLevel(current, config);
  }
  return total;
}

/** Points gagnes en atteignant ce niveau precis. */
export function skillPointsForLevel(level: number, config: ProgressionConfig): number {
  assertLevel(level);
  if (level === 1) {
    return 0;
  }
  return level % config.bonusSkillPointEvery === 0 ? 2 : 1;
}

export function totalSkillPoints(level: number, config: ProgressionConfig): number {
  assertLevel(level);
  let total = 0;
  for (let current = 2; current <= level; current += 1) {
    total += skillPointsForLevel(current, config);
  }
  return total;
}

export function xpFromScore(score: number, config: ProgressionConfig): number {
  if (score < 0) {
    throw new RangeError(`score ne peut pas etre negatif, recu: ${score}`);
  }
  return Math.round(score * config.xpPerScorePoint);
}

function assertLevel(level: number): void {
  if (!Number.isInteger(level) || level < 1) {
    throw new RangeError(`level doit etre un entier >= 1, recu: ${level}`);
  }
}
