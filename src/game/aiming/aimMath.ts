import type { Vector3Like } from "../../data/content/levels/levelTypes";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/** Ramene un angle dans l'intervalle ]-180, 180]. */
export function normalizeAngleDeg(angleDeg: number): number {
  const wrapped = ((angleDeg + 180) % 360 + 360) % 360 - 180;
  return wrapped === -180 ? 180 : wrapped;
}

/**
 * Borne un angle autour d'un centre, `totalAmplitudeDeg` etant l'amplitude totale (spec 5.3).
 */
export function clampAngleDeg(
  angleDeg: number,
  centerDeg: number,
  totalAmplitudeDeg: number,
): number {
  if (!(totalAmplitudeDeg >= 0)) {
    throw new RangeError(`totalAmplitudeDeg doit etre positif, recu: ${totalAmplitudeDeg}`);
  }
  const halfAmplitude = totalAmplitudeDeg / 2;
  const delta = normalizeAngleDeg(angleDeg - centerDeg);
  return normalizeAngleDeg(
    centerDeg + Math.min(Math.max(delta, -halfAmplitude), halfAmplitude),
  );
}

/** Lacet mesure depuis +Z vers +X, tangage positif au-dessus de l'horizon. */
export function directionFromYawPitchDeg(yawDeg: number, pitchDeg: number): Vector3Like {
  const yaw = yawDeg * DEG_TO_RAD;
  const pitch = pitchDeg * DEG_TO_RAD;
  const horizontal = Math.cos(pitch);
  return {
    x: Math.sin(yaw) * horizontal,
    y: Math.sin(pitch),
    z: Math.cos(yaw) * horizontal,
  };
}

export function yawPitchDegFromDirection(direction: Vector3Like): {
  yawDeg: number;
  pitchDeg: number;
} {
  const length = Math.hypot(direction.x, direction.y, direction.z);
  if (length === 0) {
    throw new RangeError("Impossible de deduire des angles d'un vecteur nul.");
  }
  return {
    yawDeg: Math.atan2(direction.x, direction.z) * RAD_TO_DEG,
    pitchDeg: Math.asin(direction.y / length) * RAD_TO_DEG,
  };
}

/** Interpolation lineaire bornee d'un intervalle source vers un intervalle cible. */
export function mapRangeClamped(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number,
): number {
  if (fromMin === fromMax) {
    throw new RangeError("L'intervalle source ne peut pas etre vide.");
  }
  const ratio = (value - fromMin) / (fromMax - fromMin);
  const clampedRatio = Math.min(Math.max(ratio, 0), 1);
  return toMin + clampedRatio * (toMax - toMin);
}
