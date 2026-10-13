import type { CharacterDefinition } from "./characterDefinition";
import { prototypeRagdoll } from "./prototypeRagdoll";

/**
 * Catalogue des personnages (spec 10.3). Ils partagent le meme squelette pour l'instant :
 * seules leurs statistiques et leur teinte changent. Un passif maximum chacun (spec 10.5).
 */
export const characterCatalog: readonly CharacterDefinition[] = [
  {
    id: "character_dummy",
    displayName: "Pantin",
    description: "Equilibre, sans surprise.",
    ragdoll: prototypeRagdoll,
    massScale: 1,
    restitution: 0.35,
    friction: 0.5,
    tint: null,
    passive: null,
  },
  {
    id: "character_cat",
    displayName: "Chat",
    description: "Leger et bondissant.",
    ragdoll: prototypeRagdoll,
    massScale: 0.55,
    restitution: 0.45,
    friction: 0.35,
    tint: "#d9b28c",
    passive: { kind: "bounce", restitutionBonus: 0.3 },
  },
  {
    id: "character_safe",
    displayName: "Coffre-fort vivant",
    description: "Lourd, lent, et tres rentable.",
    ragdoll: prototypeRagdoll,
    massScale: 1.8,
    restitution: 0.15,
    friction: 0.7,
    tint: "#8a7b3a",
    passive: { kind: "score", multiplier: 2 },
  },
];
