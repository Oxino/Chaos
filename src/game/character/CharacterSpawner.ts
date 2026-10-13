import {
  Color3,
  type Mesh,
  MeshBuilder,
  PhysicsAggregate,
  Physics6DoFConstraint,
  PhysicsConstraintAxis,
  PhysicsShapeType,
  type Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { characterConfig } from "../../data/config/gameplayConfig";
import type {
  RagdollDefinition,
  RagdollPartDefinition,
} from "../../data/content/characters/characterTypes";
import type { Vector3Like } from "../../data/content/levels/levelTypes";

const DEG_TO_RAD = Math.PI / 180;

export interface RagdollPart {
  readonly mesh: Mesh;
  readonly aggregate: PhysicsAggregate;
  readonly mass: number;
}

export interface LaunchedCharacter {
  readonly parts: readonly RagdollPart[];
  readonly root: RagdollPart;
  readonly totalMass: number;
}

/**
 * Cree les personnages lances sous forme de pantins articules (spec 6.2) et conserve ceux des
 * tirs precedents (spec 6.3). Les personnages ne meurent jamais et restent des obstacles.
 */
export class CharacterSpawner {
  private readonly materials = new Map<string, StandardMaterial>();
  private readonly launched: LaunchedCharacter[] = [];
  private spawnCount = 0;

  constructor(
    private readonly scene: Scene,
    private readonly definition: RagdollDefinition,
  ) {}

  get count(): number {
    return this.launched.length;
  }

  spawn(origin: Vector3Like): LaunchedCharacter {
    const index = this.spawnCount++;
    const parts = new Map<string, RagdollPart>();

    for (const definition of this.definition.parts) {
      parts.set(definition.id, this.createPart(definition, origin, index));
    }

    for (const joint of this.definition.joints) {
      const parent = parts.get(joint.parentId);
      const child = parts.get(joint.childId);
      if (!parent || !child) {
        throw new Error(`Articulation invalide : ${joint.parentId} -> ${joint.childId}`);
      }
      const constraint = createJoint(this.scene, joint.swingDeg, joint.twistDeg, joint);
      parent.aggregate.body.addConstraint(child.aggregate.body, constraint);
      // Doit venir apres addConstraint : les donnees plugin n'existent pas avant.
      constraint.isCollisionsEnabled = false;
    }

    const orderedParts = [...parts.values()];
    const root = parts.get(this.definition.rootPartId);
    if (!root) {
      throw new Error(`Partie racine introuvable : ${this.definition.rootPartId}`);
    }

    const character: LaunchedCharacter = {
      parts: orderedParts,
      root,
      totalMass: orderedParts.reduce((total, part) => total + part.mass, 0),
    };
    this.launched.push(character);
    return character;
  }

  /** Impulsion repartie au prorata des masses pour que le pantin parte d'un bloc. */
  applyImpulse(character: LaunchedCharacter, impulse: Vector3Like): void {
    for (const part of character.parts) {
      const share = part.mass / character.totalMass;
      part.aggregate.body.applyImpulse(
        new Vector3(impulse.x * share, impulse.y * share, impulse.z * share),
        part.mesh.getAbsolutePosition(),
      );
    }
  }

  /** Reinitialisation de fin de partie (spec 6.3). */
  clear(): void {
    for (const character of this.launched) {
      for (const part of character.parts) {
        part.aggregate.dispose();
        part.mesh.dispose();
      }
    }
    this.launched.length = 0;
  }

  private createPart(
    definition: RagdollPartDefinition,
    origin: Vector3Like,
    index: number,
  ): RagdollPart {
    const name = `${definition.id}_${index}`;
    const mesh = createPartMesh(this.scene, name, definition);
    mesh.position.set(
      origin.x + definition.offset.x,
      origin.y + definition.offset.y,
      origin.z + definition.offset.z,
    );
    mesh.material = this.materialFor(definition.color);

    const aggregate = new PhysicsAggregate(
      mesh,
      shapeTypeFor(definition),
      {
        mass: definition.mass,
        restitution: characterConfig.restitution,
        friction: characterConfig.friction,
      },
      this.scene,
    );

    return { mesh, aggregate, mass: definition.mass };
  }

  private materialFor(color: string): StandardMaterial {
    const existing = this.materials.get(color);
    if (existing) {
      return existing;
    }
    const material = new StandardMaterial(`characterMat_${color}`, this.scene);
    material.diffuseColor = Color3.FromHexString(color);
    material.specularColor = Color3.Black();
    this.materials.set(color, material);
    return material;
  }
}

export function maxLinearSpeed(character: LaunchedCharacter): number {
  return Math.max(
    ...character.parts.map((part) => part.aggregate.body.getLinearVelocity().length()),
  );
}

export function maxAngularSpeed(character: LaunchedCharacter): number {
  return Math.max(
    ...character.parts.map((part) => part.aggregate.body.getAngularVelocity().length()),
  );
}

function createPartMesh(scene: Scene, name: string, definition: RagdollPartDefinition): Mesh {
  switch (definition.shape) {
    case "box":
      return MeshBuilder.CreateBox(
        name,
        { width: definition.size.x, height: definition.size.y, depth: definition.size.z },
        scene,
      );
    case "capsule":
      return MeshBuilder.CreateCapsule(
        name,
        { radius: definition.size.x / 2, height: definition.size.y },
        scene,
      );
    case "sphere":
      return MeshBuilder.CreateSphere(name, { diameter: definition.size.x }, scene);
  }
}

function shapeTypeFor(definition: RagdollPartDefinition): PhysicsShapeType {
  switch (definition.shape) {
    case "box":
      return PhysicsShapeType.BOX;
    case "capsule":
      return PhysicsShapeType.CAPSULE;
    case "sphere":
      return PhysicsShapeType.SPHERE;
  }
}

function createJoint(
  scene: Scene,
  swingDeg: number,
  twistDeg: number,
  pivots: { pivotOnParent: Vector3Like; pivotOnChild: Vector3Like },
): Physics6DoFConstraint {
  const swing = swingDeg * DEG_TO_RAD;
  const twist = twistDeg * DEG_TO_RAD;

  return new Physics6DoFConstraint(
    {
      pivotA: new Vector3(
        pivots.pivotOnParent.x,
        pivots.pivotOnParent.y,
        pivots.pivotOnParent.z,
      ),
      pivotB: new Vector3(pivots.pivotOnChild.x, pivots.pivotOnChild.y, pivots.pivotOnChild.z),
      axisA: new Vector3(0, 1, 0),
      axisB: new Vector3(0, 1, 0),
      perpAxisA: new Vector3(1, 0, 0),
      perpAxisB: new Vector3(1, 0, 0),
    },
    [
      { axis: PhysicsConstraintAxis.LINEAR_X, minLimit: 0, maxLimit: 0 },
      { axis: PhysicsConstraintAxis.LINEAR_Y, minLimit: 0, maxLimit: 0 },
      { axis: PhysicsConstraintAxis.LINEAR_Z, minLimit: 0, maxLimit: 0 },
      { axis: PhysicsConstraintAxis.ANGULAR_X, minLimit: -twist, maxLimit: twist },
      { axis: PhysicsConstraintAxis.ANGULAR_Y, minLimit: -swing, maxLimit: swing },
      { axis: PhysicsConstraintAxis.ANGULAR_Z, minLimit: -swing, maxLimit: swing },
    ],
    scene,
  );
}
