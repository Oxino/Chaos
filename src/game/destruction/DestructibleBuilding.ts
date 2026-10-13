import {
  Color3,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  type Scene,
  StandardMaterial,
} from "@babylonjs/core";
import type {
  BuildingDefinition,
  BuildingPlacement,
} from "../../data/content/destructibles/buildingTypes";
import type { DestructibleDefinition } from "../../data/content/destructibles/destructibleTypes";
import { DestructibleObject, type DestructibleMaterials } from "./DestructibleObject";
import { shouldCollapse } from "./collapseMath";

/**
 * Batiment compose de sections preconstruites empilees (spec 6.4). Une section qui cede se
 * detache et tombe ; au-dela d'une proportion de sections perdues, la tour entiere s'effondre.
 */
export class DestructibleBuilding {
  private readonly sections: DestructibleObject[] = [];
  private readonly sectionIds = new Set<string>();
  private destroyedSections = 0;
  private collapsed = false;

  constructor(
    readonly id: string,
    private readonly definition: BuildingDefinition,
  ) {}

  get allSections(): readonly DestructibleObject[] {
    return this.sections;
  }

  addSection(section: DestructibleObject): void {
    this.sections.push(section);
    this.sectionIds.add(section.id);
  }

  owns(sectionId: string): boolean {
    return this.sectionIds.has(sectionId);
  }

  /** Renvoie les sections qui viennent de ceder par effondrement, pour le budget de debris. */
  onSectionDestroyed(): readonly DestructibleObject[] {
    this.destroyedSections += 1;

    if (
      this.collapsed ||
      !shouldCollapse(this.destroyedSections, this.sections.length, this.definition.collapseRatio)
    ) {
      return [];
    }

    this.collapsed = true;
    const collapsing: DestructibleObject[] = [];
    for (const section of this.sections) {
      if (section.forceDestroy()) {
        collapsing.push(section);
      }
    }
    return collapsing;
  }

  reset(): void {
    this.destroyedSections = 0;
    this.collapsed = false;
  }
}

export function createBuilding(
  scene: Scene,
  placement: BuildingPlacement,
  definition: BuildingDefinition,
  materials: DestructibleMaterials,
): { building: DestructibleBuilding; sections: { object: DestructibleObject; aggregate: PhysicsAggregate }[] } {
  const building = new DestructibleBuilding(placement.id, definition);
  const sections: { object: DestructibleObject; aggregate: PhysicsAggregate }[] = [];

  const material = new StandardMaterial(`buildingMat_${placement.id}`, scene);
  material.diffuseColor = Color3.FromHexString(definition.color);
  material.specularColor = Color3.Black();

  const sectionDefinition: DestructibleDefinition = {
    id: `${definition.id}_section`,
    displayName: `${definition.displayName} (section)`,
    destructionMode: "topple",
    stages: definition.stagesPerSection,
    minimumImpactThreshold: definition.minimumImpactThreshold,
    damageScale: definition.damageScale,
    scoreValue: definition.sectionScoreValue,
    staticUntilDestroyed: true,
    dynamicMass: definition.sectionMass,
  };

  for (let floor = 0; floor < definition.floors; floor += 1) {
    const sectionId = `${placement.id}_floor_${floor}`;
    const mesh = MeshBuilder.CreateBox(
      sectionId,
      {
        width: definition.width,
        height: definition.floorHeight,
        depth: definition.depth,
      },
      scene,
    );
    mesh.position.set(
      placement.position.x,
      placement.position.y + definition.floorHeight * (floor + 0.5),
      placement.position.z,
    );
    mesh.material = material;
    mesh.metadata = { blocksCamera: true };

    const aggregate = new PhysicsAggregate(
      mesh,
      PhysicsShapeType.BOX,
      { mass: 0, restitution: 0.1, friction: 0.7 },
      scene,
    );

    const object = new DestructibleObject(
      sectionId,
      sectionDefinition,
      mesh,
      aggregate,
      scene,
      materials,
    );
    building.addSection(object);
    sections.push({ object, aggregate });
  }

  return { building, sections };
}
