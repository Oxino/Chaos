/**
 * Reglages techniques provisoires de la Phase 0.
 * Spec 15.3 : toute valeur d'equilibrage doit rester centralisee et non dispersee dans le code.
 */
export const engineConfig = {
  antialias: true,
  /** Plafond du device pixel ratio, garde-fou de performance mobile (spec 18). Valeur provisoire. */
  maxDevicePixelRatio: 2,
} as const;

export const physicsConfig = {
  /** Gravite terrestre par defaut. La physique arcade exageree (spec 6.1) sera reglee en Phase 1. */
  gravity: { x: 0, y: -9.81, z: 0 },
} as const;
