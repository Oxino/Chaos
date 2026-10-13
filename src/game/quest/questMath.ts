import type {
  QuestDefinition,
  QuestObjective,
} from "../../data/content/quests/questTypes";

export type QuestProgressSnapshot = Readonly<Record<QuestObjective, number>>;

export interface QuestStatus {
  readonly definition: QuestDefinition;
  readonly current: number;
  readonly completed: boolean;
}

export function createEmptyProgress(): QuestProgressSnapshot {
  return {
    sessionScore: 0,
    vehiclesDestroyed: 0,
    bestCombo: 0,
    objectsDestroyed: 0,
    buildingsCollapsed: 0,
    abilitiesUsed: 0,
  };
}

/**
 * Determine les quetes nouvellement accomplies (spec 8.7).
 * Les quetes deja enregistrees comme accomplies sont ignorees : une recompense ne peut pas
 * etre accordee deux fois (spec 17).
 */
export function findNewlyCompleted(
  quests: readonly QuestDefinition[],
  progress: QuestProgressSnapshot,
  alreadyCompleted: ReadonlySet<string>,
): readonly QuestDefinition[] {
  return quests.filter(
    (quest) =>
      (quest.repeatable || !alreadyCompleted.has(quest.id)) &&
      progress[quest.objective] >= quest.targetValue,
  );
}

export function describeStatus(
  quests: readonly QuestDefinition[],
  progress: QuestProgressSnapshot,
  alreadyCompleted: ReadonlySet<string>,
): readonly QuestStatus[] {
  return quests.map((definition) => ({
    definition,
    current: Math.min(progress[definition.objective], definition.targetValue),
    completed:
      alreadyCompleted.has(definition.id) ||
      progress[definition.objective] >= definition.targetValue,
  }));
}
