import type { BuildingDefinition } from "./buildingTypes";

/**
 * Batiments a destruction par etapes (spec 6.4). Les sections sont des pieces preconstruites :
 * aucune destruction voxel, conformement au perimetre du MVP.
 */
export const buildingCatalog: Readonly<Record<string, BuildingDefinition>> = {
  officeTower: {
    id: "officeTower",
    displayName: "Immeuble de bureaux",
    floors: 6,
    floorHeight: 4,
    width: 10,
    depth: 10,
    stagesPerSection: 3,
    sectionMaxHealth: 1200,
    minimumImpactThreshold: 150,
    damageScale: 0.004,
    sectionScoreValue: 200,
    sectionMass: 2500,
    // Perdre une seule section suffit a faire ceder la structure : effondrement scenarise (spec 6.4).
    collapseRatio: 0.16,
    collapseImpulsePerFloor: 5500,
    color: "#6f7f9e",
  },
};
