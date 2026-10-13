const TWO_PI = Math.PI * 2;

/** Ecart signe le plus court entre deux angles, dans ]-PI, PI]. */
export function shortestAngleDeltaRad(fromRad: number, toRad: number): number {
  const delta = ((toRad - fromRad + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
  return delta === -Math.PI ? Math.PI : delta;
}

/** Interpolation angulaire qui emprunte toujours le chemin le plus court. */
export function lerpAngleRad(fromRad: number, toRad: number, blend: number): number {
  return fromRad + shortestAngleDeltaRad(fromRad, toRad) * blend;
}

/**
 * Distance camera-cible a utiliser quand un obstacle s'interpose : la camera se rapproche
 * juste devant l'obstacle, sans jamais passer sous une distance minimale.
 */
export function pullInRadius(
  desiredRadius: number,
  obstacleDistance: number,
  margin: number,
  minRadius: number,
): number {
  if (minRadius < 0 || margin < 0) {
    throw new RangeError("minRadius et margin doivent etre positifs.");
  }
  return Math.max(minRadius, Math.min(desiredRadius, obstacleDistance - margin));
}
