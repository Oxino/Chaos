import type { Vector3Like } from "../../data/content/levels/levelTypes";

export function normalizeDirection(direction: Vector3Like): Vector3Like {
  const length = Math.hypot(direction.x, direction.y, direction.z);
  if (length === 0) {
    throw new RangeError("La direction de lancement ne peut pas etre un vecteur nul.");
  }
  return { x: direction.x / length, y: direction.y / length, z: direction.z / length };
}

/**
 * Convertit une direction et une puissance normalisee en impulsion appliquee au personnage.
 * `power` est borne entre 0 et 1 pour qu'une entree aberrante ne produise jamais un tir hors echelle.
 */
export function computeLaunchImpulse(
  direction: Vector3Like,
  power: number,
  maxImpulse: number,
): Vector3Like {
  if (!Number.isFinite(power)) {
    throw new RangeError(`power doit etre un nombre fini, recu: ${power}`);
  }
  if (!(maxImpulse > 0)) {
    throw new RangeError(`maxImpulse doit etre strictement positif, recu: ${maxImpulse}`);
  }

  const clampedPower = Math.min(Math.max(power, 0), 1);
  const unit = normalizeDirection(direction);
  const magnitude = clampedPower * maxImpulse;

  return { x: unit.x * magnitude, y: unit.y * magnitude, z: unit.z * magnitude };
}
