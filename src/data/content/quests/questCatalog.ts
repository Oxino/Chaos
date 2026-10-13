import type { QuestDefinition } from "./questTypes";

/**
 * Quetes de la Phase 5a (spec 8.7). Elles guident l'apprentissage sans recit obligatoire :
 * aucune n'est necessaire pour atteindre l'objectif de score d'un niveau.
 */
export const questCatalog: readonly QuestDefinition[] = [
  {
    id: "quest_score_5000",
    name: "Premier carnage",
    description: "Atteindre 5 000 points en une partie.",
    category: "progression",
    objective: "sessionScore",
    targetValue: 5000,
    scope: "session",
    xpReward: 150,
    hidden: false,
    repeatable: false,
  },
  {
    id: "quest_vehicles_3",
    name: "Casse automobile",
    description: "Detruire 3 vehicules en une partie.",
    category: "progression",
    objective: "vehiclesDestroyed",
    targetValue: 3,
    scope: "session",
    xpReward: 120,
    hidden: false,
    repeatable: false,
  },
  {
    id: "quest_combo_4",
    name: "Effet domino",
    description: "Reussir une chaine de 4 destructions.",
    category: "progression",
    objective: "bestCombo",
    targetValue: 4,
    scope: "session",
    xpReward: 180,
    hidden: false,
    repeatable: false,
  },
  {
    id: "quest_collapse_1",
    name: "Demolisseur",
    description: "Faire ceder un immeuble entier.",
    category: "level",
    objective: "buildingsCollapsed",
    targetValue: 1,
    scope: "session",
    xpReward: 250,
    hidden: false,
    repeatable: false,
  },
  {
    id: "quest_ability_1",
    name: "Pilote d'essai",
    description: "Declencher une capacite en plein vol.",
    category: "mastery",
    objective: "abilitiesUsed",
    targetValue: 1,
    scope: "session",
    xpReward: 100,
    hidden: false,
    repeatable: false,
  },
];
