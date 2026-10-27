import type { Vector3Like } from "../levels/levelTypes";

export interface BuildingDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly floors: number;
  readonly floorHeight: number;
  readonly width: number;
  readonly depth: number;
  /** Etapes de degats par section avant qu'elle ne se detache. */
  readonly stagesPerSection: number;
  /** Vie maximale d'une section, en N.s de degats. */
  readonly sectionMaxHealth: number;
  readonly minimumImpactThreshold: number;
  readonly damageScale: number;
  readonly sectionScoreValue: number;
  /** Masse d'une section une fois detachee. */
  readonly sectionMass: number;
  /** Proportion de sections detruites a partir de laquelle la tour s'effondre entierement. */
  readonly collapseRatio: number;
  /** Impulsion laterale par etage lors de l'effondrement, en N.s. */
  readonly collapseImpulsePerFloor: number;
  readonly color: string;
}

export interface BuildingPlacement {
  readonly id: string;
  readonly buildingId: string;
  /** Centre de la base, pose au sol. */
  readonly position: Vector3Like;
}
