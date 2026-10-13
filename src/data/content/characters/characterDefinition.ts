import type { PassiveEffect } from "../passives/passiveTypes";
import type { RagdollDefinition } from "./characterTypes";

export interface CharacterDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  /** Squelette physique partage entre plusieurs personnages (spec 15.3). */
  readonly ragdoll: RagdollDefinition;
  readonly massScale: number;
  readonly restitution: number;
  readonly friction: number;
  /** Teinte appliquee a toutes les parties, pour distinguer les personnages. */
  readonly tint: string | null;
  /** Zero ou un passif (spec 10.5). */
  readonly passive: PassiveEffect | null;
}
