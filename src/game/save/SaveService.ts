import {
  CURRENT_SCHEMA_VERSION,
  createEmptySave,
  isNewRecord,
  migrateSave,
  type SaveData,
  withBestScore,
} from "./saveSchema";

const DATABASE_NAME = "chaos";
const STORE_NAME = "profile";
const RECORD_KEY = "save";

/**
 * Sauvegarde locale en IndexedDB (spec 15.1, 17). En cas d'indisponibilite du stockage,
 * la progression reste en memoire pour la session plutot que de faire echouer le jeu.
 */
export class SaveService {
  private data: SaveData = createEmptySave();
  private database: IDBDatabase | null = null;

  async load(): Promise<SaveData> {
    try {
      this.database = await openDatabase();
      this.data = migrateSave(await readRecord(this.database));
    } catch {
      this.data = createEmptySave();
    }
    return this.data;
  }

  getBestScore(levelId: string): number {
    return this.data.bestScores[levelId] ?? 0;
  }

  /** Renvoie true si le score constitue un nouveau record. */
  async recordBestScore(levelId: string, score: number): Promise<boolean> {
    const record = isNewRecord(this.data, levelId, score);
    if (!record) {
      return false;
    }

    this.data = withBestScore(this.data, levelId, score);
    if (this.database) {
      try {
        await writeRecord(this.database, this.data);
      } catch {
        // La progression reste en memoire : mieux vaut un score non persiste qu'une partie bloquee.
      }
    }
    return true;
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponible"));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, CURRENT_SCHEMA_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Ouverture IndexedDB echouee"));
  });
}

function readRecord(database: IDBDatabase): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(RECORD_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Lecture de sauvegarde echouee"));
  });
}

function writeRecord(database: IDBDatabase, data: SaveData): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(data, RECORD_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Ecriture de sauvegarde echouee"));
  });
}
