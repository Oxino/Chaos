import {
  Color3,
  type Mesh,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  type Scene,
  StandardMaterial,
} from "@babylonjs/core";
import { buildingCatalog } from "../../data/content/destructibles/buildingCatalog";
import { destructibleCatalog } from "../../data/content/destructibles/destructibleCatalog";
import type { LevelBlockout } from "../../data/content/levels/levelTypes";
import { createBuilding } from "../destruction/DestructibleBuilding";
import { DestructibleObject } from "../destruction/DestructibleObject";
import {
  createDestructibleMaterials,
  type DestructionService,
} from "../destruction/DestructionService";

/** Les primitives partagent un materiau par couleur pour limiter les changements d'etat GPU. */
function createMaterialCache(scene: Scene): (color: string) => StandardMaterial {
  const cache = new Map<string, StandardMaterial>();
  return (color) => {
    const existing = cache.get(color);
    if (existing) {
      return existing;
    }
    const material = new StandardMaterial(`mat_${color}`, scene);
    material.diffuseColor = Color3.FromHexString(color);
    material.specularColor = Color3.Black();
    cache.set(color, material);
    return material;
  };
}

export interface BuiltLevel {
  readonly meshes: readonly Mesh[];
}

export function buildLevelBlockout(
  scene: Scene,
  blockout: LevelBlockout,
  destruction: DestructionService,
): BuiltLevel {
  const materialFor = createMaterialCache(scene);
  const damageMaterials = createDestructibleMaterials(scene);
  const meshes: Mesh[] = [];

  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: blockout.groundSize, height: blockout.groundSize },
    scene,
  );
  ground.material = materialFor(blockout.groundColor);
  // Le sol ne bloque pas la camera : un rayon partant d'un personnage au ras du sol le toucherait
  // immediatement et collerait la camera au personnage.
  ground.metadata = { blocksCamera: false, isGround: true };
  new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, restitution: 0.1 }, scene);
  meshes.push(ground);

  for (const box of blockout.boxes) {
    const mesh = MeshBuilder.CreateBox(
      box.id,
      { width: box.size.x, height: box.size.y, depth: box.size.z },
      scene,
    );
    mesh.position.set(box.position.x, box.position.y, box.position.z);
    mesh.material = materialFor(box.color);
    // Seul le decor statique arrete la camera : un vehicule qui passe ne doit pas la faire sauter.
    mesh.metadata = { blocksCamera: box.mass === 0 && box.destructibleId === undefined };
    const aggregate = new PhysicsAggregate(
      mesh,
      PhysicsShapeType.BOX,
      { mass: box.mass, restitution: 0.15, friction: 0.6 },
      scene,
    );
    meshes.push(mesh);

    if (box.destructibleId !== undefined) {
      const definition = destructibleCatalog[box.destructibleId];
      if (!definition) {
        throw new Error(`Destructible inconnu : ${box.destructibleId}`);
      }
      destruction.register(
        new DestructibleObject(box.id, definition, mesh, aggregate, scene, damageMaterials),
        aggregate.body,
      );
    }
  }

  for (const placement of blockout.buildings) {
    const definition = buildingCatalog[placement.buildingId];
    if (!definition) {
      throw new Error(`Batiment inconnu : ${placement.buildingId}`);
    }
    const { building, sections } = createBuilding(scene, placement, definition, damageMaterials);
    destruction.registerBuilding(building);
    for (const section of sections) {
      destruction.register(section.object, section.aggregate.body);
    }
  }

  return { meshes };
}
