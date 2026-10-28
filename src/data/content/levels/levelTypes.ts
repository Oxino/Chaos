import type { BuildingPlacement } from "../destructibles/buildingTypes";
import type { SecretDefinition } from "../secrets/secretTypes";

export interface Vector3Like {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export type WeatherType = "sunny" | "cloudy" | "rain" | "snow" | "fog";
export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

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
  /** Nombre de tirs de la partie (spec 4.3). */
  readonly shotsAllowed: number;
  /** Score minimum pour debloquer le niveau suivant (spec 8.5). */
  readonly targetScore: number;
  readonly groundSize: number;
  readonly groundColor: string;
  readonly weatherOptions: readonly WeatherType[];
  readonly timeOfDayOptions: readonly TimeOfDay[];
  readonly launcher: LauncherAnchor;
  readonly boxes: readonly BlockoutBox[];
  readonly buildings: readonly BuildingPlacement[];
  /** Trois a quatre secrets par niveau (spec 7.3). */
  readonly secrets: readonly SecretDefinition[];
}
