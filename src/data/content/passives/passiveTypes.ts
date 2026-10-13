/**
 * Effet passif. Un personnage et un objet en portent **au plus un chacun**, soit deux cumules
 * au maximum (spec 10.5). Une capacite active est une categorie separee.
 */
export type PassiveEffect =
  | { readonly kind: "bounce"; readonly restitutionBonus: number }
  | { readonly kind: "score"; readonly multiplier: number }
  | { readonly kind: "weight"; readonly massScale: number }
  | { readonly kind: "power"; readonly launchImpulseScale: number };

export function describePassive(passive: PassiveEffect | null): string {
  if (!passive) {
    return "Aucun passif";
  }
  switch (passive.kind) {
    case "bounce":
      return `Rebond ${formatSigned(passive.restitutionBonus * 100)} %`;
    case "score":
      return `Score x${passive.multiplier}`;
    case "weight":
      return `Masse x${passive.massScale}`;
    case "power":
      return `Puissance x${passive.launchImpulseScale}`;
  }
}

function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(0)}`;
}
