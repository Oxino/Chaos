import type { DestructibleDefinition, DestructibleState } from "../../data/content/destructibles/destructibleTypes";

export interface ImpactOutcome {
  /** L'impact a-t-il depasse le seuil minimum (spec 6.5). */
  readonly qualifies: boolean;
  readonly stagesLost: number;
  readonly nextStage: number;
  readonly destroyed: boolean;
  readonly damageApplied: number;
  readonly nextHealth: number;
}

export function maxHealthForDefinition(definition: DestructibleDefinition): number {
  return definition.maxHealth;
}

/**
 * Traduit une intensite d'impact en progression de degats.
 * `currentStage` vaut `definition.stages` quand l'objet est intact et 0 quand il est detruit.
 */
export function resolveImpact(
  intensity: number,
  currentHealth: number,
  definition: DestructibleDefinition,
): ImpactOutcome {
  if (currentHealth <= 0 || intensity < definition.minimumImpactThreshold) {
    return {
      qualifies: false,
      stagesLost: 0,
      nextStage: Math.ceil(Math.max(0, currentHealth) / (definition.maxHealth / definition.stages)),
      destroyed: false,
      damageApplied: 0,
      nextHealth: Math.max(0, currentHealth),
    };
  }

  const maxHealth = maxHealthForDefinition(definition);
  const nextHealth = Math.max(0, Math.min(maxHealth, currentHealth - intensity));
  const stagesLost = Math.min(
    Math.ceil(currentHealth / (definition.maxHealth / definition.stages)),
    Math.max(1, Math.floor((currentHealth - nextHealth) / (definition.maxHealth / definition.stages))),
  );

  return {
    qualifies: true,
    stagesLost,
    nextStage: Math.ceil(nextHealth / (definition.maxHealth / definition.stages)),
    destroyed: nextHealth === 0,
    damageApplied: currentHealth - nextHealth,
    nextHealth,
  };
}

/** Impact necessaire pour retirer un nombre donne d'etapes restantes. */
export function requiredImpactForStages(
  stages: number,
  threshold: number,
  damageScale: number,
): number {
  if (stages <= 0) {
    return 0;
  }
  if (damageScale <= 0) {
    return threshold;
  }
  return threshold + (stages - 1) / damageScale;
}

/** Repartit les etapes restantes sur les etats visuels du \u00a715.4. */
export function stateForStage(stage: number, totalStages: number): DestructibleState {
  if (stage <= 0) {
    return "Destroyed";
  }
  if (stage >= totalStages) {
    return "Intact";
  }
  return stage / totalStages <= 0.34 ? "Critical" : "Damaged";
}

export function stateForHealth(health: number, maxHealth: number): DestructibleState {
  if (health <= 0) return "Destroyed";
  const ratio = health / maxHealth;
  if (ratio >= 1) return "Intact";
  if (ratio >= 0.66) return "Damaged";
  return "Critical";
}
