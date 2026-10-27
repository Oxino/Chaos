import {
  Color3,
  type Mesh,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  type Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type {
  BuildingDefinition,
  BuildingPlacement,
} from "../../data/content/destructibles/buildingTypes";
import type { DestructibleDefinition } from "../../data/content/destructibles/destructibleTypes";
import { DestructibleObject, type DestructibleMaterials, type DestructionResult } from "./DestructibleObject";
import { shouldCollapse } from "./collapseMath";

export interface CollapsedSection {
  readonly section: DestructibleObject;
  readonly result: DestructionResult;
}

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

  /** Renvoie les sections qui viennent de ceder par effondrement, pour le score et les debris. */
  onSectionDestroyed(): readonly CollapsedSection[] {
    this.destroyedSections += 1;

    if (
      this.collapsed ||
      !shouldCollapse(this.destroyedSections, this.sections.length, this.definition.collapseRatio)
    ) {
      return [];
    }

    this.collapsed = true;
    const collapsing: CollapsedSection[] = [];
    // Direction commune : la tour part d'un bloc d'un cote, comme un effondrement scenarise.
    const angle = Math.random() * Math.PI * 2;
    const heading = new Vector3(Math.cos(angle), 0, Math.sin(angle));

    for (const [floor, section] of this.sections.entries()) {
      const result = section.forceDestroy();
      if (!result) {
        continue;
      }
      // Plus l'etage est haut, plus il est projete loin.
      const strength = this.definition.collapseImpulsePerFloor * (floor + 1);
      section.applyImpulse(heading.scale(strength));
      collapsing.push({ section, result });
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
): {
  building: DestructibleBuilding;
  sections: { object: DestructibleObject; aggregate: PhysicsAggregate; mesh: Mesh }[];
} {
  const building = new DestructibleBuilding(placement.id, definition);
  const sections: { object: DestructibleObject; aggregate: PhysicsAggregate; mesh: Mesh }[] = [];

  const material = new StandardMaterial(`buildingMat_${placement.id}`, scene);
  material.diffuseColor = Color3.FromHexString(definition.color);
  material.specularColor = Color3.Black();
  const windowMaterial = new StandardMaterial(`buildingWindow_${placement.id}`, scene);
  windowMaterial.diffuseColor = Color3.FromHexString("#82d1df");
  windowMaterial.emissiveColor = Color3.FromHexString("#183c58");
  windowMaterial.specularColor = Color3.Black();
  const trimMaterial = new StandardMaterial(`buildingTrim_${placement.id}`, scene);
  trimMaterial.diffuseColor = Color3.FromHexString("#293c54");
  trimMaterial.specularColor = Color3.Black();

  const sectionDefinition: DestructibleDefinition = {
    id: `${definition.id}_section`,
    displayName: `${definition.displayName} (section)`,
    destructionMode: "topple",
    stages: definition.stagesPerSection,
    maxHealth: definition.sectionMaxHealth,
    minimumImpactThreshold: definition.minimumImpactThreshold,
    damageScale: definition.damageScale,
    scoreValue: definition.sectionScoreValue,
    staticUntilDestroyed: true,
    dynamicMass: definition.sectionMass,
    // Les sections recoivent deja la poussee d'effondrement de la tour.
    destructionImpulse: 0,
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
    addFacadeDetails(
      scene,
      mesh,
      sectionId,
      definition.width,
      definition.floorHeight,
      definition.depth,
      windowMaterial,
      trimMaterial,
      floor === definition.floors - 1,
    );

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
    sections.push({ object, aggregate, mesh });
  }

  return { building, sections };
}

/** Details visuels uniquement : ils suivent la section lorsque la tour s'effondre. */
function addFacadeDetails(
  scene: Scene,
  parent: Mesh,
  sectionId: string,
  width: number,
  height: number,
  depth: number,
  windowMaterial: StandardMaterial,
  trimMaterial: StandardMaterial,
  isTopFloor: boolean,
): void {
  const facadeBand = MeshBuilder.CreateBox(
    `${sectionId}_facadeBand`,
    { width: width + 0.16, height: 0.26, depth: depth + 0.16 },
    scene,
  );
  facadeBand.parent = parent;
  facadeBand.position.y = height / 2 - 0.18;
  facadeBand.material = trimMaterial;
  facadeBand.isPickable = false;

  for (const x of [-0.3, 0, 0.3]) {
    const pane = MeshBuilder.CreateBox(
      `${sectionId}_window_${x}`,
      { width: Math.min(1.7, width * 0.2), height: Math.max(0.7, height * 0.38), depth: 0.08 },
      scene,
    );
    pane.parent = parent;
    pane.position.set(width * x, 0, -depth / 2 - 0.05);
    pane.material = windowMaterial;
    pane.isPickable = false;
  }

  if (!isTopFloor) {
    return;
  }
  const roof = MeshBuilder.CreateBox(
    `${sectionId}_roof`,
    { width: width + 0.7, height: 0.42, depth: depth + 0.7 },
    scene,
  );
  roof.parent = parent;
  roof.position.y = height / 2 + 0.2;
  roof.material = trimMaterial;
  roof.isPickable = false;

  const antenna = MeshBuilder.CreateCylinder(
    `${sectionId}_antenna`,
    { height: 1.8, diameter: 0.16, tessellation: 8 },
    scene,
  );
  antenna.parent = parent;
  antenna.position.y = height / 2 + 1.1;
  antenna.material = trimMaterial;
  antenna.isPickable = false;
}
