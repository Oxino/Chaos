import type { ProgressionConfig } from "../../game/progression/progressionMath";

/**
 * Reglages de gameplay provisoires (spec 15.7). A ajuster par test, jamais a recopier en dur.
 */
export const launcherConfig = {
  /** Impulsion appliquee au personnage a pleine puissance, en N.s. */
  maxLaunchImpulse: 2600,
  /**
   * Vitesse initiale maximale, en m/s. Sans ce plafond, un build tres leger depasse les
   * 500 m de portee et quitte la carte.
   */
  maxLaunchSpeed: 38,
  /** Bornes de visee en degres, amplitude totale (spec 5.3). */
  horizontalAmplitudeDeg: 75,
  verticalAmplitudeDeg: 140,
} as const;

export const aimConfig = {
  /** Plage de beta exploitee : 45 deg = vue plongeante, 85 deg = vue rasante. Provisoire. */
  cameraBetaMinDeg: 45,
  cameraBetaMaxDeg: 85,
  /** Angle de tir associe a chaque borne de beta : vue plongeante = cloche haute. */
  pitchAtBetaMinDeg: 60,
  pitchAtBetaMaxDeg: 10,
  defaultPowerRatio: 0.7,
  minPowerRatio: 0.05,
  trajectorySampleCount: 32,
  reticleDiameter: 6,
} as const;

export const shotConfig = {
  /** Seuils d'immobilite avant la fin automatique d'un tir (spec 5.6). */
  linearSleepSpeed: 0.3,
  angularSleepSpeed: 0.5,
  stillnessDurationMs: 4000,
  maxShotDurationMs: 20000,
  /** Duree du cadrage de resultat avant le retour a la visee. */
  resultDurationMs: 1600,
} as const;

/**
 * Courbe de progression (spec 9). Cout croissant par palier, un point de competence par niveau
 * et un second tous les cinq niveaux. Valeurs provisoires a equilibrer par test.
 */
export const progressionConfig: ProgressionConfig = {
  xpPerScorePoint: 0.1,
  baseLevelXp: 800,
  levelXpIncrement: 400,
  maxLevel: 50,
  bonusSkillPointEvery: 5,
};

export const scoreConfig = {  /** Fenetre pendant laquelle une destruction prolonge la chaine en cours (spec 8.3). */
  comboWindowMs: 4000,
  maxComboMultiplier: 5,
} as const;

export const destructionConfig = {
  /** Budget de corps detaches encore simules (spec 6.6, 18). Valeur provisoire. */
  maxActiveDebris: 24,
} as const;

export const cameraConfig = {
  followDistance: 22,
  followHeight: 9,
  /** Anticipation du mouvement pour que le personnage ne colle pas au bord du cadre (spec 5.5). */
  followLookAheadSeconds: 0.35,
  resultDistance: 34,
  resultHeight: 16,
  /** Vue de fin de tir plus plongeante : elle degage les batiments de la rue. */
  resultBetaDeg: 38,
  /** Plus la valeur est elevee, plus la camera rattrape vite sa position cible. */
  dampingPerSecond: 5,
  /** Rapprochement de la camera quand un obstacle s'interpose entre elle et le personnage. */
  collisionMargin: 1.2,
  minFollowDistance: 8,
  /**
   * Decalage de cadrage de la camera de visee, en unites de vue. Positif = camera decalee vers
   * la gauche, donc lanceur et trajectoire degages vers la droite de l'ecran.
   * Decalage purement visuel : il ne modifie pas la direction de tir.
   */
  aimScreenOffsetX: 4,
} as const;
