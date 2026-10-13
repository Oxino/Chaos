/** Etats de degats (spec 15.4). `Collapsed` sera utilise par les batiments en Phase 2b. */
export type DestructibleState = "Intact" | "Damaged" | "Critical" | "Destroyed";

/** Comment l'objet reagit une fois detruit. */
export type DestructionMode =
  /** Reste en place, ecrase et assombri : il continue de servir d'obstacle. */
  | "crush"
  /** Passe de statique a dynamique et s'effondre sur place. */
  | "topple";

export interface DestructibleDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly destructionMode: DestructionMode;
  /** Nombre d'etapes de degats. 1 = intact puis detruit en un impact qualifiant. */
  readonly stages: number;
  /** Impulsion minimale, en N.s, en dessous de laquelle l'impact est ignore (spec 6.4). */
  readonly minimumImpactThreshold: number;
  /** Etapes perdues par N.s au-dela du seuil. */
  readonly damageScale: number;
  readonly scoreValue: number;
  /** Le corps est-il statique tant qu'il n'est pas detruit. */
  readonly staticUntilDestroyed: boolean;
  /** Masse appliquee quand l'objet bascule en corps dynamique. */
  readonly dynamicMass: number;
  /**
   * Impulsion de dispersion appliquee a la destruction, en N.s. C'est elle qui transforme un
   * objet detruit en projectile et rend les reactions en chaine possibles (spec 2.3, 6.1).
   */
  readonly destructionImpulse: number;
}
