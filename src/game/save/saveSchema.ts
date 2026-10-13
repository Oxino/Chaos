export const CURRENT_SCHEMA_VERSION = 1;

export interface SaveData {
  readonly schemaVersion: number;
  readonly bestScores: Readonly<Record<string, number>>;
}

export function createEmptySave(): SaveData {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, bestScores: {} };
}

/**
 * Lit une sauvegarde de version inconnue et la ramene au schema courant (spec 17).
 * Toute entree corrompue, negative ou non numerique est ignoree plutot que de faire echouer
 * le chargement : une progression partielle vaut mieux qu'une progression perdue.
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

  return { schemaVersion: CURRENT_SCHEMA_VERSION, bestScores };
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

  return {
    schemaVersion: save.schemaVersion,
    bestScores: { ...save.bestScores, [levelId]: Math.floor(score) },
  };
}

export function isNewRecord(save: SaveData, levelId: string, score: number): boolean {
  return isValidScore(score) && score > (save.bestScores[levelId] ?? 0);
}

function isValidScore(score: unknown): score is number {
  return typeof score === "number" && Number.isFinite(score) && score >= 0;
}
