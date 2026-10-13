export interface SettlingThresholds {
  readonly linearSleepSpeed: number;
  readonly angularSleepSpeed: number;
  readonly stillnessDurationMs: number;
  readonly maxShotDurationMs: number;
}

export function isStill(
  linearSpeed: number,
  angularSpeed: number,
  thresholds: SettlingThresholds,
): boolean {
  return (
    linearSpeed <= thresholds.linearSleepSpeed && angularSpeed <= thresholds.angularSleepSpeed
  );
}

/** Le compteur repart de zero des que le personnage rebouge (spec 5.6). */
export function nextStillnessMs(currentMs: number, deltaMs: number, still: boolean): number {
  if (deltaMs < 0) {
    throw new RangeError(`deltaMs ne peut pas etre negatif, recu: ${deltaMs}`);
  }
  return still ? currentMs + deltaMs : 0;
}

/** Le delai de securite evite qu'un objet oscillant bloque la fin du tir indefiniment. */
export function isShotFinished(
  stillnessMs: number,
  elapsedMs: number,
  thresholds: SettlingThresholds,
): boolean {
  return (
    stillnessMs >= thresholds.stillnessDurationMs || elapsedMs >= thresholds.maxShotDurationMs
  );
}
