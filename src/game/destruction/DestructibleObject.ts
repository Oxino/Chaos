import {
  type Mesh,
  type PhysicsAggregate,
  PhysicsMotionType,
  Quaternion,
  type Scene,
  type StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type {
  DestructibleDefinition,
  DestructibleState,
} from "../../data/content/destructibles/destructibleTypes";
import { maxHealthForDefinition, resolveImpact, stateForHealth } from "./impactMath";

/** Aplatissement applique a un objet ecrase. La forme de collision, elle, ne change pas. */
const CRUSH_SCALE_Y = 0.42;

export interface DestructibleMaterials {
  readonly damaged: StandardMaterial;
  readonly critical: StandardMaterial;
  readonly destroyed: StandardMaterial;
}

export interface DestructionResult {
  readonly id: string;
  readonly position: Vector3;
  readonly definition: DestructibleDefinition;
  readonly state: DestructibleState;
  readonly destroyed: boolean;
  /** Etapes de degats perdues sur cet impact : elles determinent les points attribues. */
  readonly stagesLost: number;
  /** Etapes restantes apres l'impact, utilisee pour rendre l'attribution idempotente. */
  readonly remainingStages: number;
  readonly currentHealth: number;
  readonly maxHealth: number;
  readonly damageApplied: number;
}

/**
 * Un element destructible du decor (spec 6.4, 16.4). Il conserve son etat pendant toute la
 * partie et sait revenir a son etat initial lors de la reinitialisation (spec 6.3).
 */
export class DestructibleObject {
  private health: number;
  private frozen = false;
  private readonly initialPosition: Vector3;
  private readonly initialRotation: Quaternion;
  private readonly initialScaling: Vector3;
  private readonly initialMaterial: StandardMaterial;

  constructor(
    readonly id: string,
    readonly definition: DestructibleDefinition,
    private readonly mesh: Mesh,
    private readonly aggregate: PhysicsAggregate,
    private readonly scene: Scene,
    private readonly materials: DestructibleMaterials,
  ) {
    this.health = maxHealthForDefinition(definition);
    this.initialPosition = mesh.position.clone();
    this.initialRotation = (mesh.rotationQuaternion ?? Quaternion.Identity()).clone();
    this.initialScaling = mesh.scaling.clone();
    this.initialMaterial = mesh.material as StandardMaterial;
  }

  get state(): DestructibleState {
    return stateForHealth(this.health, this.maxHealth);
  }

  get currentStage(): number {
    return Math.ceil(this.health / this.healthPerStage);
  }

  get currentHealth(): number {
    return this.health;
  }

  get maxHealth(): number {
    return maxHealthForDefinition(this.definition);
  }

  get healthPerStage(): number {
    return this.maxHealth / this.definition.stages;
  }

  get renderMesh(): Mesh {
    return this.mesh;
  }

  get isDestroyed(): boolean {
    return this.health <= 0;
  }

  get isFrozen(): boolean {
    return this.frozen;
  }

  get position(): Vector3 {
    return this.mesh.getAbsolutePosition();
  }

  /** Vitesse lineaire courante, utilisee par le budget de debris. */
  get speed(): number {
    return this.aggregate.body.getLinearVelocity().length();
  }

  /** Destruction sans impact, utilisee par l'effondrement d'un batiment. */
  forceDestroy(): DestructionResult | null {
    if (this.isDestroyed) {
      return null;
    }
    const stagesLost = this.currentStage;
    this.health = 0;
    this.applyVisualState();
    this.applyDestruction();
    return {
      id: this.id,
      position: this.position.clone(),
      definition: this.definition,
      state: this.state,
      destroyed: true,
      stagesLost,
      remainingStages: 0,
      currentHealth: 0,
      maxHealth: this.maxHealth,
      damageApplied: this.maxHealth,
    };
  }

  /** Arrete la simulation d'un debris sans le faire disparaitre (spec 6.6). */
  freeze(): void {
    if (this.frozen) {
      return;
    }
    this.frozen = true;
    this.aggregate.body.setMotionType(PhysicsMotionType.STATIC);
  }

  applyImpulse(impulse: Vector3): void {
    this.aggregate.body.applyImpulse(impulse, this.mesh.getAbsolutePosition());
  }

  /** Renvoie null si l'impact ne qualifie pas : aucun evenement ne doit alors etre emis. */
  applyImpact(intensity: number): DestructionResult | null {
    const outcome = resolveImpact(intensity, this.health, this.definition);
    if (!outcome.qualifies) {
      return null;
    }

    this.health = outcome.nextHealth;
    this.applyVisualState();

    if (outcome.destroyed) {
      this.applyDestruction();
    }

    return {
      id: this.id,
      position: this.position.clone(),
      definition: this.definition,
      state: this.state,
      destroyed: outcome.destroyed,
      stagesLost: outcome.stagesLost,
      remainingStages: outcome.nextStage,
      currentHealth: this.health,
      maxHealth: this.maxHealth,
      damageApplied: outcome.damageApplied,
    };
  }

  reset(): void {
    this.health = this.maxHealth;
    this.frozen = false;
    this.mesh.material = this.initialMaterial;
    this.mesh.scaling.copyFrom(this.initialScaling);

    const body = this.aggregate.body;
    body.setMotionType(
      this.definition.staticUntilDestroyed ? PhysicsMotionType.STATIC : PhysicsMotionType.DYNAMIC,
    );
    body.setLinearVelocity(Vector3.Zero());
    body.setAngularVelocity(Vector3.Zero());

    this.teleportToInitialTransform();
  }

  private applyVisualState(): void {
    switch (this.state) {
      case "Damaged":
        this.mesh.material = this.materials.damaged;
        break;
      case "Critical":
        this.mesh.material = this.materials.critical;
        break;
      case "Destroyed":
        this.mesh.material = this.materials.destroyed;
        break;
      default:
        this.mesh.material = this.initialMaterial;
    }
  }

  private applyDestruction(): void {
    const body = this.aggregate.body;

    if (this.definition.staticUntilDestroyed) {
      body.setMotionType(PhysicsMotionType.DYNAMIC);
      body.setMassProperties({ mass: this.definition.dynamicMass });
    }

    if (this.definition.destructionMode === "crush") {
      this.mesh.scaling.y = this.initialScaling.y * CRUSH_SCALE_Y;
    }
  }

  /**
   * Un corps dynamique est pilote par le moteur physique : il faut rouvrir le pre-step le temps
   * d'une image pour que la transformation imposee soit reellement prise en compte.
   */
  private teleportToInitialTransform(): void {
    const body = this.aggregate.body;
    body.disablePreStep = false;
    this.mesh.position.copyFrom(this.initialPosition);
    this.mesh.rotationQuaternion = this.initialRotation.clone();
    this.scene.onAfterRenderObservable.addOnce(() => {
      body.disablePreStep = true;
    });
  }
}
