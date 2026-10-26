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
import { boundaryConfig } from "../../data/config/gameplayConfig";
import { buildingCatalog } from "../../data/content/destructibles/buildingCatalog";
import { destructibleCatalog } from "../../data/content/destructibles/destructibleCatalog";
import type { LevelBlockout } from "../../data/content/levels/levelTypes";
import { createBuilding } from "../destruction/DestructibleBuilding";
import { DestructibleObject } from "../destruction/DestructibleObject";
import {
  createDestructibleMaterials,
  type DestructionService,
} from "../destruction/DestructionService";
import { mapBounds } from "./boundaryMath";

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
  readonly aggregates: readonly PhysicsAggregate[];
}

export function buildLevelBlockout(
  scene: Scene,
  blockout: LevelBlockout,
  destruction: DestructionService,
): BuiltLevel {
  const materialFor = createMaterialCache(scene);
  const damageMaterials = createDestructibleMaterials(scene);
  const meshes: Mesh[] = [];
  const aggregates: PhysicsAggregate[] = [];

  const bounds = mapBounds(
    blockout.groundSize,
    boundaryConfig.horizontalMargin,
    boundaryConfig.lowerY,
    boundaryConfig.upperY,
  );
  createMapBoundaries(scene, bounds, meshes);
  createBackRoomsBucket(scene, meshes, aggregates);

  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: blockout.groundSize, height: blockout.groundSize },
    scene,
  );
  ground.material = materialFor(blockout.groundColor);
  // Le sol ne bloque pas la camera : un rayon partant d'un personnage au ras du sol le toucherait
  // immediatement et collerait la camera au personnage.
  ground.metadata = { blocksCamera: false, isGround: true };
  const groundAggregate = new PhysicsAggregate(
    ground,
    PhysicsShapeType.BOX,
    { mass: 0, restitution: 0.1 },
    scene,
  );
  meshes.push(ground);
  aggregates.push(groundAggregate);

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
    aggregates.push(aggregate);

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
      meshes.push(section.mesh);
      aggregates.push(section.aggregate);
    }
  }

  return { meshes, aggregates };
}

function createMapBoundaries(
  scene: Scene,
  bounds: ReturnType<typeof mapBounds>,
  meshes: Mesh[],
): void {
  const material = new StandardMaterial("invisibleBoundaryMaterial", scene);
  material.alpha = 0;
  material.diffuseColor = Color3.Black();
  material.specularColor = Color3.Black();

  const height = bounds.upperY - bounds.lowerY;
  const centerY = (bounds.upperY + bounds.lowerY) / 2;
  const thickness = 0.5;
  const definitions = [
    { name: "boundaryWest", size: { width: thickness, height, depth: bounds.halfDepth * 2 }, position: new Vector3(-bounds.halfWidth, centerY, 0) },
    { name: "boundaryEast", size: { width: thickness, height, depth: bounds.halfDepth * 2 }, position: new Vector3(bounds.halfWidth, centerY, 0) },
    { name: "boundaryNorth", size: { width: bounds.halfWidth * 2, height, depth: thickness }, position: new Vector3(0, centerY, -bounds.halfDepth) },
    { name: "boundarySouth", size: { width: bounds.halfWidth * 2, height, depth: thickness }, position: new Vector3(0, centerY, bounds.halfDepth) },
    { name: "boundaryCeiling", size: { width: bounds.halfWidth * 2, height: thickness, depth: bounds.halfDepth * 2 }, position: new Vector3(0, bounds.upperY, 0) },
    { name: "boundaryFloor", size: { width: bounds.halfWidth * 2, height: thickness, depth: bounds.halfDepth * 2 }, position: new Vector3(0, bounds.lowerY, 0) },
  ];

  for (const definition of definitions) {
    const mesh = MeshBuilder.CreateBox(definition.name, definition.size, scene);
    mesh.position.copyFrom(definition.position);
    mesh.material = material;
    mesh.isVisible = false;
    mesh.isPickable = false;
    mesh.metadata = { blocksCamera: false, isBoundary: true };
    meshes.push(mesh);

    // Boundaries are monitored volumes, not colliders: the character must be able to cross them
    // so the rescue system can move it into the Back Rooms bucket.
  }
}

function createBackRoomsBucket(
  scene: Scene,
  meshes: Mesh[],
  aggregates: PhysicsAggregate[],
): void {
  const center = new Vector3(0, boundaryConfig.bucketCenterY, 0);
  const halfWidth = boundaryConfig.bucketWidth / 2;
  const halfDepth = boundaryConfig.bucketDepth / 2;
  const floorY = center.y - boundaryConfig.bucketHeight / 2;
  const ceilingY = center.y + boundaryConfig.bucketHeight / 2;
  const wallMaterial = new StandardMaterial("backRoomsYellow", scene);
  wallMaterial.diffuseColor = Color3.FromHexString("#d6c65a");
  wallMaterial.emissiveColor = Color3.FromHexString("#8d802f");
  wallMaterial.specularColor = Color3.Black();
  wallMaterial.alpha = 1;
  wallMaterial.backFaceCulling = false;

  const floorMaterial = new StandardMaterial("backRoomsCarpet", scene);
  floorMaterial.diffuseColor = Color3.FromHexString("#b9ad54");
  floorMaterial.emissiveColor = Color3.FromHexString("#665d24");
  floorMaterial.specularColor = Color3.Black();

  const floor = MeshBuilder.CreateBox(
    "backRoomsFloor",
    { width: boundaryConfig.bucketWidth, height: boundaryConfig.bucketWallThickness, depth: boundaryConfig.bucketDepth },
    scene,
  );
  floor.position.set(center.x, floorY, center.z);
  floor.material = floorMaterial;
  addBucketSurface(scene, floor, meshes, aggregates);

  const surfaces = [
    { name: "backRoomsWest", position: new Vector3(-halfWidth, center.y, 0), size: { width: boundaryConfig.bucketWallThickness, height: boundaryConfig.bucketHeight, depth: boundaryConfig.bucketDepth } },
    { name: "backRoomsEast", position: new Vector3(halfWidth, center.y, 0), size: { width: boundaryConfig.bucketWallThickness, height: boundaryConfig.bucketHeight, depth: boundaryConfig.bucketDepth } },
    { name: "backRoomsNorth", position: new Vector3(0, center.y, -halfDepth), size: { width: boundaryConfig.bucketWidth, height: boundaryConfig.bucketHeight, depth: boundaryConfig.bucketWallThickness } },
    { name: "backRoomsSouth", position: new Vector3(0, center.y, halfDepth), size: { width: boundaryConfig.bucketWidth, height: boundaryConfig.bucketHeight, depth: boundaryConfig.bucketWallThickness } },
    { name: "backRoomsCeiling", position: new Vector3(0, ceilingY, 0), size: { width: boundaryConfig.bucketWidth, height: boundaryConfig.bucketWallThickness, depth: boundaryConfig.bucketDepth } },
  ];
  for (const surface of surfaces) {
    const mesh = MeshBuilder.CreateBox(surface.name, surface.size, scene);
    mesh.position.copyFrom(surface.position);
    mesh.material = wallMaterial;
    mesh.metadata = { blocksCamera: false, isBackRooms: true };
    meshes.push(mesh);
    if (surface.name !== "backRoomsCeiling") {
      aggregates.push(
        new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0, restitution: 0.1 }, scene),
      );
    }
  }

  const lightMaterial = new StandardMaterial("backRoomsFluorescent", scene);
  lightMaterial.emissiveColor = Color3.FromHexString("#f4f0c4");
  for (const x of [-20, 0, 20]) {
    const light = MeshBuilder.CreateBox(
      `backRoomsLight_${x}`,
      { width: 0.6, height: 0.1, depth: 14 },
      scene,
    );
    light.position.set(x, ceilingY - 0.08, 0);
    light.material = lightMaterial;
    light.isPickable = false;
    meshes.push(light);
  }

  const seamMaterial = new StandardMaterial("backRoomsPanelSeams", scene);
  seamMaterial.diffuseColor = Color3.FromHexString("#8e843e");
  seamMaterial.emissiveColor = Color3.FromHexString("#383418");
  for (const x of [-25, -15, -5, 5, 15, 25]) {
    const seam = MeshBuilder.CreateBox(
      `backRoomsWallSeam_${x}`,
      { width: 0.12, height: boundaryConfig.bucketHeight - 1, depth: 0.05 },
      scene,
    );
    seam.position.set(x, center.y, -halfDepth - 0.2);
    seam.material = seamMaterial;
    seam.isPickable = false;
    meshes.push(seam);
  }

  const deskMaterial = new StandardMaterial("backRoomsDesk", scene);
  deskMaterial.diffuseColor = Color3.FromHexString("#756b3d");
  deskMaterial.specularColor = Color3.Black();
  for (const x of [-16, 16]) {
    const desk = MeshBuilder.CreateBox(
      `backRoomsDesk_${x}`,
      { width: 10, height: 1, depth: 4 },
      scene,
    );
    desk.position.set(x, floorY + 5, 10);
    desk.material = deskMaterial;
    desk.isPickable = false;
    meshes.push(desk);
  }
}

function addBucketSurface(
  scene: Scene,
  mesh: Mesh,
  meshes: Mesh[],
  aggregates: PhysicsAggregate[],
): void {
  meshes.push(mesh);
  aggregates.push(
    new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0, restitution: 0.1 }, scene),
  );
}
