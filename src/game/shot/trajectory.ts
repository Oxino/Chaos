import type { Vector3Like } from "../../data/content/levels/levelTypes";

export interface TrajectoryResult {
  /** Echantillons de la trajectoire, de l'origine au point d'impact. */
  readonly points: readonly Vector3Like[];
  readonly impact: Vector3Like;
  /** Distance horizontale parcourue jusqu'a l'impact. */
  readonly range: number;
  readonly flightTime: number;
}

export interface TrajectoryInput {
  readonly origin: Vector3Like;
  /** Direction unitaire du tir. */
  readonly direction: Vector3Like;
  readonly speed: number;
  /** Intensite de la gravite, valeur positive. */
  readonly gravity: number;
  readonly groundY: number;
  readonly sampleCount: number;
}

/**
 * Prevision balistique analytique (spec 5.2, 15.1). Les collisions reelles peuvent devier le tir.
 */
export function computeTrajectory(input: TrajectoryInput): TrajectoryResult {
  const { origin, direction, speed, gravity, groundY, sampleCount } = input;

  if (!(gravity > 0)) {
    throw new RangeError(`gravity doit etre strictement positive, recu: ${gravity}`);
  }
  if (!Number.isInteger(sampleCount) || sampleCount < 2) {
    throw new RangeError(`sampleCount doit etre un entier >= 2, recu: ${sampleCount}`);
  }
  if (origin.y < groundY) {
    throw new RangeError("L'origine du tir ne peut pas etre sous le sol.");
  }

  const velocity = {
    x: direction.x * speed,
    y: direction.y * speed,
    z: direction.z * speed,
  };

  const height = origin.y - groundY;
  const flightTime =
    (velocity.y + Math.sqrt(velocity.y * velocity.y + 2 * gravity * height)) / gravity;

  const points: Vector3Like[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const t = (flightTime * index) / (sampleCount - 1);
    points.push({
      x: origin.x + velocity.x * t,
      y: origin.y + velocity.y * t - 0.5 * gravity * t * t,
      z: origin.z + velocity.z * t,
    });
  }

  const impact = points[points.length - 1] ?? origin;

  return {
    points,
    impact,
    range: Math.hypot(impact.x - origin.x, impact.z - origin.z),
    flightTime,
  };
}
