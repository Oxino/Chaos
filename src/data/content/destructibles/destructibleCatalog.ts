import type { DestructibleDefinition } from "./destructibleTypes";

/**
 * Catalogue des destructibles (spec 16.4). Les seuils sont des valeurs provisoires a regler
 * par test : ils evitent qu'un simple frolement detruise un vehicule (spec 6.4).
 */
export const destructibleCatalog: Readonly<Record<string, DestructibleDefinition>> = {
  car: {
    id: "car",
    displayName: "Voiture",
    destructionMode: "crush",
    stages: 1,
    minimumImpactThreshold: 300,
    damageScale: 0.01,
    scoreValue: 300,
    staticUntilDestroyed: false,
    dynamicMass: 1200,
  },
  lamppost: {
    id: "lamppost",
    displayName: "Lampadaire",
    destructionMode: "topple",
    stages: 1,
    minimumImpactThreshold: 180,
    damageScale: 0.01,
    scoreValue: 80,
    staticUntilDestroyed: true,
    dynamicMass: 280,
  },
  sign: {
    id: "sign",
    displayName: "Panneau",
    destructionMode: "topple",
    stages: 1,
    minimumImpactThreshold: 100,
    damageScale: 0.02,
    scoreValue: 50,
    staticUntilDestroyed: true,
    dynamicMass: 90,
  },
};
