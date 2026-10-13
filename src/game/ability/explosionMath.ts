/**
 * Attenuation lineaire de l'onde de choc : pleine puissance au centre, nulle au bord (spec 14).
 */
export function explosionFalloff(distance: number, radius: number): number {
  if (radius <= 0) {
    throw new RangeError(`radius doit etre strictement positif, recu: ${radius}`);
  }
  if (distance < 0) {
    throw new RangeError(`distance ne peut pas etre negative, recu: ${distance}`);
  }
  if (distance >= radius) {
    return 0;
  }
  return 1 - distance / radius;
}
