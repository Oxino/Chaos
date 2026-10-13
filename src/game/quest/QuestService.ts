import { questCatalog } from "../../data/content/quests/questCatalog";
import type { QuestDefinition, QuestObjective } from "../../data/content/quests/questTypes";
import {
  createEmptyProgress,
  describeStatus,
  findNewlyCompleted,
  type QuestProgressSnapshot,
  type QuestStatus,
} from "./questMath";

/**
 * Suit l'avancement des quetes de la partie en cours (spec 8.7) et signale celles qui
 * viennent d'etre accomplies. Les quetes deja valides dans la sauvegarde ne sont jamais
 * recompensees une seconde fois.
 */
export class QuestService {
  private progress: Record<QuestObjective, number> = { ...createEmptyProgress() };
  private readonly completedThisSession = new Set<string>();

  constructor(private alreadyCompleted: ReadonlySet<string> = new Set()) {}

  get snapshot(): QuestProgressSnapshot {
    return this.progress;
  }

  get statuses(): readonly QuestStatus[] {
    return describeStatus(questCatalog, this.progress, this.knownCompleted());
  }

  setKnownCompleted(ids: ReadonlySet<string>): void {
    this.alreadyCompleted = ids;
  }

  /** `value` remplace la valeur courante pour les objectifs de type maximum. */
  report(objective: QuestObjective, value: number): void {
    this.progress[objective] = Math.max(this.progress[objective], value);
  }

  increment(objective: QuestObjective, amount = 1): void {
    this.progress[objective] += amount;
  }

  /** Renvoie les quetes accomplies depuis le dernier appel. */
  collectNewlyCompleted(): readonly QuestDefinition[] {
    const completed = findNewlyCompleted(questCatalog, this.progress, this.knownCompleted());
    for (const quest of completed) {
      this.completedThisSession.add(quest.id);
    }
    return completed;
  }

  resetSession(): void {
    this.progress = { ...createEmptyProgress() };
    this.completedThisSession.clear();
  }

  private knownCompleted(): ReadonlySet<string> {
    return new Set([...this.alreadyCompleted, ...this.completedThisSession]);
  }
}
