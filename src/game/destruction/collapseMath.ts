/**
 * Une tour s'effondre entierement une fois qu'une proportion suffisante de ses sections a cede
 * (spec 6.4 : effondrement scenarise, pas de simulation structurelle).
 */
export function shouldCollapse(
  destroyedSections: number,
  totalSections: number,
  collapseRatio: number,
): boolean {
  if (totalSections <= 0) {
    throw new RangeError("Une tour doit comporter au moins une section.");
  }
  if (collapseRatio <= 0 || collapseRatio > 1) {
    throw new RangeError(`collapseRatio doit etre dans ]0, 1], recu: ${collapseRatio}`);
  }
  return destroyedSections / totalSections >= collapseRatio;
}

/**
 * Nombre de debris a figer pour revenir sous le budget de corps actifs (spec 6.6, 18).
 * Les debris figes restent visibles : seule leur simulation s'arrete.
 */
export function debrisToFreeze(activeDebris: number, maxActiveDebris: number): number {
  if (maxActiveDebris < 0) {
    throw new RangeError(`maxActiveDebris ne peut pas etre negatif, recu: ${maxActiveDebris}`);
  }
  return Math.max(0, activeDebris - maxActiveDebris);
}
