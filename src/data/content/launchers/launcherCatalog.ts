export interface LauncherDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
}

/** Le premier lanceur reste toujours disponible pour garder la campagne jouable. */
export const launcherCatalog: readonly LauncherDefinition[] = [
  {
    id: "launcher_giant_slingshot",
    displayName: "Fronde géante",
    description: "Le lanceur de référence de Chaos.",
  },
];