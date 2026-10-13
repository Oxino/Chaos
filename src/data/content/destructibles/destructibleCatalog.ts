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
    // Physique arcade exageree (spec 6.1) : une voiture doit pouvoir etre projetee loin et
    // devenir elle-meme un projectile, sinon aucune reaction en chaine n'est possible.
    dynamicMass: 350,
    destructionImpulse: 4200,
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
    destructionImpulse: 1600,
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
    destructionImpulse: 700,
  },
};
