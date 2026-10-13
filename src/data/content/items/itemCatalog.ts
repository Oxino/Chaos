import type { PassiveEffect } from "../passives/passiveTypes";
import type { ActiveAbility } from "./abilityTypes";

export interface ItemDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  /** Alourdit ou allege **le personnage equipe uniquement** (spec 10.4). */
  readonly massScale: number;
  readonly launchImpulseScale: number;
  /** Zero ou un passif (spec 10.5). */
  readonly passive: PassiveEffect | null;
  /** Capacite active eventuelle, categorie distincte du passif (spec 10.5). */
  readonly ability: ActiveAbility | null;
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
    ability: null,
  },
  {
    id: "item_balloon",
    displayName: "Ballon",
    description: "Allege le personnage et le fait rebondir.",
    massScale: 0.85,
    launchImpulseScale: 1.05,
    passive: { kind: "bounce", restitutionBonus: 0.35 },
    ability: null,
  },
  {
    id: "item_anvil",
    displayName: "Enclume",
    description: "Tres lourde, mais le lanceur compense.",
    massScale: 1.8,
    launchImpulseScale: 0.95,
    passive: { kind: "power", launchImpulseScale: 1.45 },
    ability: null,
  },
  {
    id: "item_thruster",
    displayName: "Reacteur",
    description: "Poussee supplementaire declenchable en plein vol.",
    massScale: 1.1,
    launchImpulseScale: 1,
    passive: null,
    ability: {
      kind: "thruster",
      activation: "manual",
      displayName: "Reacteur",
      impulsePerSecond: 1800,
      durationMs: 1200,
    },
  },
  {
    id: "item_bomb",
    displayName: "Bombe",
    description: "Explose sur commande et souffle tout autour.",
    massScale: 1.15,
    launchImpulseScale: 1,
    passive: null,
    ability: {
      kind: "bomb",
      activation: "manual",
      displayName: "Bombe",
      radius: 18,
      impulse: 5200,
      impactStrength: 900,
    },
  },
];
