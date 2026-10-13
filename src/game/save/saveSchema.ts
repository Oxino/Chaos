export const CURRENT_SCHEMA_VERSION = 4;

export interface SaveData {
  readonly schemaVersion: number;
  readonly bestScores: Readonly<Record<string, number>>;
  readonly totalXp: number;
  readonly completedQuestIds: readonly string[];
  readonly discoveredSecretIds: readonly string[];
  /** Rangs bruts : ils sont valides contre le catalogue au chargement. */
  readonly skillRanks: Readonly<Record<string, number>>;
}

export function createEmptySave(): SaveData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    bestScores: {},
    totalXp: 0,
    completedQuestIds: [],
    discoveredSecretIds: [],
    skillRanks: {},
  };
}

/**
 * Lit une sauvegarde de version inconnue et la ramene au schema courant (spec 17).
 * Toute entree corrompue, negative ou non numerique est ignoree plutot que de faire echouer
 * le chargement : une progression partielle vaut mieux qu'une progression perdue.
 * Les champs apparus en version 2 prennent une valeur neutre quand ils sont absents.
 */
export function migrateSave(raw: unknown): SaveData {
  if (typeof raw !== "object" || raw === null) {
    return createEmptySave();
  }

  const candidate = raw as Partial<SaveData>;
  const bestScores: Record<string, number> = {};

  if (typeof candidate.bestScores === "object" && candidate.bestScores !== null) {
    for (const [levelId, score] of Object.entries(candidate.bestScores)) {
      if (isValidScore(score)) {
        bestScores[levelId] = Math.floor(score);
      }
    }
  }

  const completedQuestIds = readStringList(candidate.completedQuestIds);
  const discoveredSecretIds = readStringList(candidate.discoveredSecretIds);

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    bestScores,
    totalXp: isValidScore(candidate.totalXp) ? Math.floor(candidate.totalXp) : 0,
    completedQuestIds,
    discoveredSecretIds,
    skillRanks: readRankMap(candidate.skillRanks),
  };
}

function readRankMap(value: unknown): Readonly<Record<string, number>> {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  const cleaned: Record<string, number> = {};
  for (const [id, rank] of Object.entries(value as Record<string, unknown>)) {
    if (typeof rank === "number" && Number.isFinite(rank) && rank >= 1) {
      cleaned[id] = Math.floor(rank);
    }
  }
  return cleaned;
}

function readStringList(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.filter((entry): entry is string => typeof entry === "string"))];
}

/** Ne conserve que le meilleur score : rejouer un niveau ne peut jamais faire regresser. */
export function withBestScore(save: SaveData, levelId: string, score: number): SaveData {
  if (!isValidScore(score)) {
    return save;
  }

  const previous = save.bestScores[levelId] ?? 0;
  if (score <= previous) {
    return save;
  }

  return { ...save, bestScores: { ...save.bestScores, [levelId]: Math.floor(score) } };
}

export function withXp(save: SaveData, gainedXp: number): SaveData {
  if (!isValidScore(gainedXp) || gainedXp === 0) {
    return save;
  }
  return { ...save, totalXp: save.totalXp + Math.floor(gainedXp) };
}

export function withCompletedQuests(save: SaveData, questIds: readonly string[]): SaveData {
  if (questIds.length === 0) {
    return save;
  }
  return {
    ...save,
    completedQuestIds: [...new Set([...save.completedQuestIds, ...questIds])],
  };
}

export function withDiscoveredSecrets(save: SaveData, secretIds: readonly string[]): SaveData {
  if (secretIds.length === 0) {
    return save;
  }
  return {
    ...save,
    discoveredSecretIds: [...new Set([...save.discoveredSecretIds, ...secretIds])],
  };
}

export function withSkillRanks(
  save: SaveData,
  skillRanks: Readonly<Record<string, number>>,
): SaveData {
  return { ...save, skillRanks: { ...skillRanks } };
}

export function isNewRecord(save: SaveData, levelId: string, score: number): boolean {
  return isValidScore(score) && score > (save.bestScores[levelId] ?? 0);
}

function isValidScore(score: unknown): score is number {
  return typeof score === "number" && Number.isFinite(score) && score >= 0;
}
