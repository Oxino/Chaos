import type { PassiveEffect } from "../passives/passiveTypes";

export interface ItemDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  /** Alourdit ou allege **le personnage equipe uniquement** (spec 10.4). */
  readonly massScale: number;
  readonly launchImpulseScale: number;
  /** Zero ou un passif (spec 10.5). */
  readonly passive: PassiveEffect | null;
}

/** Catalogue des objets equipables (spec 10.4). */
export const itemCatalog: readonly ItemDefinition[] = [
  {
    id: "item_stone",
    displayName: "Pierre",
    description: "Alourdit le personnage et amortit les rebonds.",
    massScale: 1.35,
    launchImpulseScale: 1,
    passive: { kind: "bounce", restitutionBonus: -0.2 },
  },
  {
    id: "item_balloon",
    displayName: "Ballon",
    description: "Allege le personnage et le fait rebondir.",
    massScale: 0.85,
    launchImpulseScale: 1.05,
    passive: { kind: "bounce", restitutionBonus: 0.35 },
  },
  {
    id: "item_anvil",
    displayName: "Enclume",
    description: "Tres lourde, mais le lanceur compense.",
    massScale: 1.8,
    launchImpulseScale: 0.95,
    passive: { kind: "power", launchImpulseScale: 1.45 },
  },
];
