export interface LauncherDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly launchImpulseScale: number;
  readonly maxLaunchSpeed: number;
  readonly precision: number;
}

/** Le premier lanceur reste toujours disponible pour garder la campagne jouable. */
export const launcherCatalog: readonly LauncherDefinition[] = [
  {
    id: "launcher_giant_slingshot",
    displayName: "Fronde géante",
    description: "Le lanceur de référence de Chaos.",
    launchImpulseScale: 1,
    maxLaunchSpeed: 38,
    precision: 1,
  },
  {
    id: "launcher_heavy_cannon",
    displayName: "Canon lourd",
    description: "Une impulsion massive, moins de portée exploitable.",
    launchImpulseScale: 1.3,
    maxLaunchSpeed: 34,
    precision: 0.85,
  },
  {
    id: "launcher_spring_pistol",
    displayName: "Pistolet à ressort",
    description: "Plus léger et précis, mais nettement moins puissant.",
    launchImpulseScale: 0.75,
    maxLaunchSpeed: 38,
    precision: 1.15,
  },
];