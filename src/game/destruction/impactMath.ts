import type { DestructibleDefinition, DestructibleState } from "../../data/content/destructibles/destructibleTypes";

export interface ImpactOutcome {
  /** L'impact a-t-il depasse le seuil minimum (spec 6.5). */
  readonly qualifies: boolean;
  readonly stagesLost: number;
  readonly nextStage: number;
  readonly destroyed: boolean;
}

/**
 * Traduit une intensite d'impact en progression de degats.
 * `currentStage` vaut `definition.stages` quand l'objet est intact et 0 quand il est detruit.
 */
export function resolveImpact(
  intensity: number,
  currentStage: number,
  definition: DestructibleDefinition,
): ImpactOutcome {
  if (currentStage <= 0 || intensity < definition.minimumImpactThreshold) {
    return { qualifies: false, stagesLost: 0, nextStage: currentStage, destroyed: false };
  }

  const excess = intensity - definition.minimumImpactThreshold;
  const stagesLost = Math.min(currentStage, 1 + Math.floor(excess * definition.damageScale));
  const nextStage = currentStage - stagesLost;

  return { qualifies: true, stagesLost, nextStage, destroyed: nextStage === 0 };
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
