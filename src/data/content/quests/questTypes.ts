/** Categories du \u00a78.7. */
export type QuestCategory = "progression" | "level" | "mastery" | "secret";

/** Portee du suivi (spec 16.6). `session` = une partie compl\u00e8te. */
export type QuestScope = "shot" | "session" | "level" | "progression";

export type QuestObjective =
  | "sessionScore"
  | "vehiclesDestroyed"
  | "bestCombo"
  | "objectsDestroyed"
  | "buildingsCollapsed"
  | "abilitiesUsed";

export interface QuestDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: QuestCategory;
  readonly objective: QuestObjective;
  readonly targetValue: number;
  readonly scope: QuestScope;
  readonly xpReward: number;
  readonly hidden: boolean;
  readonly repeatable: boolean;
}
