/**
 * Mode de declenchement d'une capacite active (spec 16.3). Seul `manual` est implemente :
 * les deux autres attendent un objet qui les justifie.
 */
export type AbilityActivationMode = "manual" | "onImpact" | "automatic";

/**
 * Capacite active d'un objet (spec 5.4, 10.4). C'est une categorie **separee des passifs** :
 * elle ne compte pas dans la limite de deux passifs du \u00a710.5.
 */
export type ActiveAbility =
  | {
      readonly kind: "thruster";
      readonly activation: AbilityActivationMode;
      readonly displayName: string;
      /** Poussee continue, en N.s par seconde. */
      readonly impulsePerSecond: number;
      readonly durationMs: number;
    }
  | {
      readonly kind: "bomb";
      readonly activation: AbilityActivationMode;
      readonly displayName: string;
      readonly radius: number;
      /** Impulsion radiale appliquee aux corps dans le rayon. */
      readonly impulse: number;
      /** Intensite d'impact infligee au centre de l'explosion, en N.s. */
      readonly impactStrength: number;
    };
