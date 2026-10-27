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
  createStreetDressings(scene, blockout.groundSize, meshes);
  createHorizonDressings(scene, meshes);
  createConstructionCranes(scene, meshes);

  for (const box of blockout.boxes) {
    const mesh = MeshBuilder.CreateBox(
      box.id,
      { width: box.size.x, height: box.size.y, depth: box.size.z },
      scene,
    );
    mesh.position.set(box.position.x, box.position.y, box.position.z);
    mesh.material = materialFor(box.color);
    decorateBlockoutMesh(scene, mesh, box, materialFor);
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

/** Rue et trottoirs visuels, sans collision supplementaire au-dessus du sol physique. */
function createStreetDressings(scene: Scene, groundSize: number, meshes: Mesh[]): void {
  const asphalt = new StandardMaterial("streetAsphalt", scene);
  asphalt.diffuseColor = Color3.FromHexString("#344456");
  asphalt.specularColor = Color3.Black();
  const concrete = new StandardMaterial("sidewalkConcrete", scene);
  concrete.diffuseColor = Color3.FromHexString("#76879a");
  concrete.specularColor = Color3.Black();
  const paint = new StandardMaterial("streetPaint", scene);
  paint.emissiveColor = Color3.FromHexString("#f4cb48");
  paint.diffuseColor = Color3.Black();
  paint.specularColor = Color3.Black();

  const road = MeshBuilder.CreateGround("streetRoad", { width: 18, height: groundSize * 0.88 }, scene);
  road.position.y = 0.012;
  road.position.z = groundSize * 0.08;
  road.material = asphalt;
  road.isPickable = false;
  meshes.push(road);

  for (const x of [-11.5, 11.5]) {
    const sidewalk = MeshBuilder.CreateGround(
      `sidewalk_${x}`,
      { width: 5, height: groundSize * 0.88 },
      scene,
    );
    sidewalk.position.set(x, 0.016, groundSize * 0.08);
    sidewalk.material = concrete;
    sidewalk.isPickable = false;
    meshes.push(sidewalk);
  }

  for (let z = -60; z <= 70; z += 12) {
    const laneMark = MeshBuilder.CreateGround("laneMark", { width: 0.35, height: 5 }, scene);
    laneMark.position.set(0, 0.025, z);
    laneMark.material = paint;
    laneMark.isPickable = false;
    meshes.push(laneMark);
  }
}

/** Silhouettes lointaines sans collision pour eviter un horizon vide autour du quartier. */
function createHorizonDressings(scene: Scene, meshes: Mesh[]): void {
  const skylineMaterial = new StandardMaterial("horizonBuildings", scene);
  skylineMaterial.diffuseColor = Color3.FromHexString("#496783");
  skylineMaterial.specularColor = Color3.Black();
  const rooftopMaterial = new StandardMaterial("horizonRooftops", scene);
  rooftopMaterial.diffuseColor = Color3.FromHexString("#2e4a66");
  rooftopMaterial.specularColor = Color3.Black();
  const windowMaterial = new StandardMaterial("horizonWindows", scene);
  windowMaterial.emissiveColor = Color3.FromHexString("#f4cb70");
  windowMaterial.diffuseColor = Color3.Black();
  windowMaterial.specularColor = Color3.Black();

  const silhouettes = [
    { x: -54, z: 82, width: 18, height: 24, depth: 14 },
    { x: -30, z: 92, width: 14, height: 34, depth: 16 },
    { x: -7, z: 98, width: 22, height: 20, depth: 18 },
    { x: 22, z: 94, width: 16, height: 30, depth: 14 },
    { x: 48, z: 84, width: 20, height: 25, depth: 16 },
    { x: 62, z: 58, width: 12, height: 38, depth: 12 },
    { x: -62, z: 45, width: 14, height: 28, depth: 12 },
  ];

  for (const [index, silhouette] of silhouettes.entries()) {
    const building = MeshBuilder.CreateBox(`horizonBuilding_${index}`, {
      width: silhouette.width,
      height: silhouette.height,
      depth: silhouette.depth,
    }, scene);
    building.position.set(silhouette.x, silhouette.height / 2 - 0.02, silhouette.z);
    building.material = skylineMaterial;
    building.metadata = { blocksCamera: false, isHorizon: true };
    building.isPickable = false;
    meshes.push(building);

    const roof = MeshBuilder.CreateBox(`horizonRoof_${index}`, {
      width: silhouette.width + 0.5,
      height: 0.35,
      depth: silhouette.depth + 0.5,
    }, scene);
    roof.position.set(silhouette.x, silhouette.height + 0.16, silhouette.z);
    roof.material = rooftopMaterial;
    roof.isPickable = false;
    meshes.push(roof);

    for (const xOffset of [-0.28, 0.28]) {
      const window = MeshBuilder.CreateBox(`horizonWindow_${index}_${xOffset}`, {
        width: Math.min(1.7, silhouette.width * 0.18),
        height: 1.1,
        depth: 0.06,
      }, scene);
      window.position.set(
        silhouette.x + silhouette.width * xOffset,
        silhouette.height * 0.58,
        silhouette.z - silhouette.depth / 2 - 0.04,
      );
      window.material = windowMaterial;
      window.isPickable = false;
      meshes.push(window);
    }
  }
}

/** Grues de chantier decoratives, sans collision, visibles entre les immeubles distants. */
function createConstructionCranes(scene: Scene, meshes: Mesh[]): void {
  const towerMaterial = new StandardMaterial("craneTower", scene);
  towerMaterial.diffuseColor = Color3.FromHexString("#e58b32");
  towerMaterial.specularColor = Color3.Black();
  const boomMaterial = new StandardMaterial("craneBoom", scene);
  boomMaterial.diffuseColor = Color3.FromHexString("#f4c54b");
  boomMaterial.specularColor = Color3.Black();

  for (const [index, position] of [
    { x: -40, z: 72, height: 27 },
    { x: 34, z: 78, height: 32 },
  ].entries()) {
    const tower = MeshBuilder.CreateCylinder(`craneTower_${index}`, {
      height: position.height,
      diameter: 0.75,
      tessellation: 8,
    }, scene);
    tower.position.set(position.x, position.height / 2, position.z);
    tower.material = towerMaterial;
    tower.isPickable = false;
    meshes.push(tower);

    const boom = MeshBuilder.CreateBox(`craneBoom_${index}`, {
      width: 14,
      height: 0.42,
      depth: 0.42,
    }, scene);
    boom.position.set(position.x + 5.2, position.height, position.z);
    boom.material = boomMaterial;
    boom.isPickable = false;
    meshes.push(boom);

    const counterweight = MeshBuilder.CreateBox(`craneCounterweight_${index}`, {
      width: 2.2,
      height: 1.1,
      depth: 1.2,
    }, scene);
    counterweight.position.set(position.x - 1.7, position.height - 0.4, position.z);
    counterweight.material = towerMaterial;
    counterweight.isPickable = false;
    meshes.push(counterweight);

    const cable = MeshBuilder.CreateLines(`craneCable_${index}`, {
      points: [
        new Vector3(position.x + 9.5, position.height, position.z),
        new Vector3(position.x + 9.5, position.height - 8, position.z),
      ],
    }, scene);
    cable.color = Color3.FromHexString("#263649");
    cable.isPickable = false;
    meshes.push(cable);

    const hook = MeshBuilder.CreateBox(`craneHook_${index}`, {
      width: 0.8,
      height: 0.8,
      depth: 0.8,
    }, scene);
    hook.position.set(position.x + 9.5, position.height - 8.4, position.z);
    hook.material = boomMaterial;
    hook.isPickable = false;
    meshes.push(hook);
  }
}

/** Habillages purement visuels : ils restent enfants du volume physique d'origine. */
function decorateBlockoutMesh(
  scene: Scene,
  parent: Mesh,
  box: LevelBlockout["boxes"][number],
  materialFor: (color: string) => StandardMaterial,
): void {
  if (box.id.startsWith("car_")) {
    const body = materialFor("#e85836");
    const glass = materialFor("#9dd8ea");
    const tire = materialFor("#1b2431");
    parent.material = body;

    const cabin = MeshBuilder.CreateBox(`${box.id}_cabin`, {
      width: box.size.x * 0.62,
      height: box.size.y * 0.46,
      depth: box.size.z * 0.56,
    }, scene);
    cabin.parent = parent;
    cabin.position.y = box.size.y * 0.43;
    cabin.material = glass;
    cabin.isPickable = false;

    for (const x of [-0.38, 0.38]) {
      for (const z of [-0.42, 0.42]) {
        const wheel = MeshBuilder.CreateCylinder(`${box.id}_wheel_${x}_${z}`, {
          height: box.size.z * 0.22,
          diameter: box.size.y * 0.48,
          tessellation: 12,
        }, scene);
        wheel.parent = parent;
        wheel.position.set(box.size.x * x, -box.size.y * 0.34, box.size.z * z);
        wheel.rotation.x = Math.PI / 2;
        wheel.material = tire;
        wheel.isPickable = false;
      }
    }
    return;
  }

  if (box.id.startsWith("pole_")) {
    const lamp = MeshBuilder.CreateSphere(`${box.id}_lamp`, { diameter: box.size.x * 2.4, segments: 12 }, scene);
    lamp.parent = parent;
    lamp.position.y = box.size.y * 0.52;
    lamp.material = materialFor("#ffe08a");
    lamp.isPickable = false;
    return;
  }

  if (box.id.startsWith("sign_")) {
    const face = MeshBuilder.CreateBox(`${box.id}_face`, {
      width: box.size.x * 0.86,
      height: box.size.y * 0.55,
      depth: box.size.z + 0.08,
    }, scene);
    face.parent = parent;
    face.position.y = box.size.y * 0.12;
    face.material = materialFor("#ffcb2f");
    face.isPickable = false;
    return;
  }

  if (box.mass === 0 && box.size.y >= 8) {
    const frame = materialFor("#24374d");
    const window = materialFor("#84c9dd");
    const roof = MeshBuilder.CreateBox(`${box.id}_roof`, {
      width: box.size.x + 0.35,
      height: 0.42,
      depth: box.size.z + 0.35,
    }, scene);
    roof.parent = parent;
    roof.position.y = box.size.y / 2 + 0.2;
    roof.material = frame;
    roof.isPickable = false;

    for (const y of [-0.22, 0.12, 0.46]) {
      for (const x of [-0.28, 0, 0.28]) {
        const pane = MeshBuilder.CreateBox(`${box.id}_window_${x}_${y}`, {
          width: Math.min(1.7, box.size.x * 0.2),
          height: 1.15,
          depth: 0.08,
        }, scene);
        pane.parent = parent;
        pane.position.set(box.size.x * x, box.size.y * y, -box.size.z / 2 - 0.05);
        pane.material = window;
        pane.isPickable = false;
      }
    }
  }
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
