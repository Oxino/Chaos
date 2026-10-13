import type { Vector3Like } from "../levels/levelTypes";

export type RagdollPartShape = "box" | "capsule" | "sphere";

export interface RagdollPartDefinition {
  readonly id: string;
  readonly shape: RagdollPartShape;
  /** Box : dimensions. Capsule : x = diametre, y = hauteur. Sphere : x = diametre. */
  readonly size: Vector3Like;
  /** Position relative a la racine du personnage. */
  readonly offset: Vector3Like;
  readonly mass: number;
  readonly color: string;
}

export interface RagdollJointDefinition {
  readonly parentId: string;
  readonly childId: string;
  readonly pivotOnParent: Vector3Like;
  readonly pivotOnChild: Vector3Like;
  /** Debattement lateral autorise, en degres. */
  readonly swingDeg: number;
  /** Rotation autorisee autour de l'axe du membre, en degres. */
  readonly twistDeg: number;
}

export interface RagdollDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly rootPartId: string;
  readonly parts: readonly RagdollPartDefinition[];
  readonly joints: readonly RagdollJointDefinition[];
}

export function totalMassOf(definition: RagdollDefinition): number {
  return definition.parts.reduce((total, part) => total + part.mass, 0);
}
