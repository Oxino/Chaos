import type { BuildingPlacement } from "../destructibles/buildingTypes";

export interface Vector3Like {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Position d'ancrage fixe du lanceur dans le niveau (spec 5.3, 10.2). */
export interface LauncherAnchor {
  readonly position: Vector3Like;
  /** Direction de repos de la visee, avant tout pivot du joueur. */
  readonly restDirection: Vector3Like;
}

export interface BlockoutBox {
  readonly id: string;
  readonly position: Vector3Like;
  readonly size: Vector3Like;
  readonly color: string;
  /** Masse en kg. Zero signifie un corps statique. */
  readonly mass: number;
  /** Cle du catalogue de destructibles. Absent = element indestructible. */
  readonly destructibleId?: string;
}

export interface LevelBlockout {
  readonly id: string;
  readonly displayName: string;
  readonly groundSize: number;
  readonly groundColor: string;
  readonly launcher: LauncherAnchor;
  readonly boxes: readonly BlockoutBox[];
  readonly buildings: readonly BuildingPlacement[];
}
