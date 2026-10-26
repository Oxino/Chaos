import {
  Color3,
  type AbstractMesh,
  type PhysicsBody,
  type Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { DestructibleState } from "../../data/content/destructibles/destructibleTypes";
import { explosionFalloff } from "../ability/explosionMath";
import type { DebrisBudget } from "./DebrisBudget";
import type { DestructibleBuilding } from "./DestructibleBuilding";
import type { DestructibleObject, DestructionResult } from "./DestructibleObject";
import { resolveImpact } from "./impactMath";

export type DestructionListener = (result: DestructionResult) => void;

/** Compte rendu d'un choc, y compris lorsqu'il n'atteint pas le seuil de la cible. */
export interface ImpactReport {
  readonly targetName: string;
  readonly intensity: number;
  readonly threshold: number;
  readonly qualifies: boolean;
  readonly state: DestructibleState;
  readonly destroyed: boolean;
}

export interface AimTargetInfo {
  readonly id: string;
  readonly displayName: string;
  readonly state: DestructibleState;
  readonly remainingStages: number;
  readonly totalStages: number;
  readonly impactThreshold: number;
  readonly damageScale: number;
  readonly estimatedImpact: number;
  readonly estimatedStagesLost: number;
}

export type ImpactListener = (report: ImpactReport) => void;

/** En dessous de cette intensite, le choc est trop anodin pour meriter un affichage. */
const REPORTABLE_INTENSITY = 20;

/**
 * Ecoute les collisions des destructibles, resout les impacts et tient l'etat du monde pour
 * la duree de la partie (spec 6.3, 6.5). Les vraies collisions secondaires declenchent
 * naturellement les reactions en chaine : rien n'est propage artificiellement.
 */
export class DestructionService {
  private readonly objects = new Map<string, DestructibleObject>();
  private readonly bodies = new Map<PhysicsBody, DestructibleObject>();
  private readonly meshes = new Map<AbstractMesh, DestructibleObject>();
  private readonly buildings: DestructibleBuilding[] = [];
  private readonly destroyedIds = new Set<string>();
  private collapsedBuildingCount = 0;
  private impactMultiplier = 1;

  /** Bonus d'impact issu de l'arbre de competences (spec 9.2). */
  setImpactMultiplier(multiplier: number): void {
    this.impactMultiplier = Math.max(0, multiplier);
  }

  get collapsedBuildings(): number {
    return this.collapsedBuildingCount;
  }
  private readonly listeners = new Set<DestructionListener>();
  private readonly impactListeners = new Set<ImpactListener>();
  private strongestImpact = 0;

  constructor(private readonly debris: DebrisBudget) {}

  /** Impact le plus violent du tir en cours. */
  get strongestImpactOfShot(): number {
    return this.strongestImpact;
  }

  get destroyedCount(): number {
    return this.destroyedIds.size;
  }

  get totalCount(): number {
    return this.objects.size;
  }

  get activeDebrisCount(): number {
    return this.debris.activeCount;
  }

  register(destructible: DestructibleObject, body: PhysicsBody): void {
    this.objects.set(destructible.id, destructible);
    this.bodies.set(body, destructible);
    this.meshes.set(destructible.renderMesh, destructible);

    body.setCollisionCallbackEnabled(true);
    body.getCollisionObservable().add((event) => {
      // Le contact avec le sol est ignore : sans cela, tout objet qui se pose s'auto-detruirait.
      if (event.collidedAgainst.transformNode.metadata?.isGround === true) {
        return;
      }
      this.handleCollision(body, event.impulse, event.normal);
    });
  }

  registerBuilding(building: DestructibleBuilding): void {
    this.buildings.push(building);
  }

  onDestruction(listener: DestructionListener): void {
    this.listeners.add(listener);
  }

  onImpact(listener: ImpactListener): void {
    this.impactListeners.add(listener);
  }

  getAimTarget(mesh: AbstractMesh | null, estimatedImpact = 0): AimTargetInfo | null {
    if (!mesh) {
      return null;
    }
    const destructible = this.meshes.get(mesh);
    if (!destructible) {
      return null;
    }
    return {
      id: destructible.id,
      displayName: destructible.definition.displayName,
      state: destructible.state,
      impactThreshold: destructible.definition.minimumImpactThreshold,
      damageScale: destructible.definition.damageScale,
      estimatedImpact,
      estimatedStagesLost: resolveImpact(
        estimatedImpact,
        destructible.currentStage,
        destructible.definition,
      ).stagesLost,
      remainingStages: Math.max(0, destructible.currentStage),
      totalStages: destructible.definition.stages,
    };
  }

  beginShot(): void {
    this.strongestImpact = 0;
  }

  update(): void {
    this.debris.update();
  }

  /**
   * Souffle de zone : chaque destructible dans le rayon recoit une impulsion radiale et un
   * impact attenue avec la distance. Les destructions qui en decoulent alimentent normalement
   * le score et les chaines (spec 8.3).
   */
  applyExplosion(center: Vector3, radius: number, impulse: number, impactStrength: number): void {
    for (const destructible of this.objects.values()) {
      if (destructible.isDestroyed) {
        continue;
      }

      const offset = destructible.position.subtract(center);
      const falloff = explosionFalloff(offset.length(), radius);
      if (falloff === 0) {
        continue;
      }

      offset.y += 0.5;
      destructible.applyImpulse(offset.normalize().scaleInPlace(impulse * falloff));

      const result = destructible.applyImpact(impactStrength * falloff);
      if (result) {
        this.publish(result, destructible);
      }
    }
  }

  /** Reinitialisation complete du niveau pour la partie suivante (spec 6.3). */
  resetAll(): void {
    for (const destructible of this.objects.values()) {
      destructible.reset();
    }
    for (const building of this.buildings) {
      building.reset();
    }
    this.destroyedIds.clear();
    this.debris.clear();
    this.strongestImpact = 0;
  }

  private handleCollision(body: PhysicsBody, impulse: number, normal: Vector3 | null): void {
    const destructible = this.bodies.get(body);
    if (!destructible || destructible.isDestroyed) {
      return;
    }

    const effectiveImpulse = impulse * this.impactMultiplier;
    const result = destructible.applyImpact(effectiveImpulse);
    if (result) {
      if (result.destroyed) {
        this.scatter(destructible, result.definition.destructionImpulse, normal);
      }
      this.publish(result, destructible);
    }

    if (impulse < REPORTABLE_INTENSITY) {
      return;
    }
    this.strongestImpact = Math.max(this.strongestImpact, effectiveImpulse);

    const report: ImpactReport = {
      targetName: destructible.definition.displayName,
      intensity: effectiveImpulse,
      threshold: destructible.definition.minimumImpactThreshold,
      qualifies: result !== null,
      state: destructible.state,
      destroyed: destructible.isDestroyed,
    };
    for (const listener of this.impactListeners) {
      listener(report);
    }
  }

  /** Projette l'objet detruit dans le sens du choc, avec une composante verticale cartoon. */
  private scatter(destructible: DestructibleObject, strength: number, normal: Vector3 | null): void {
    if (strength <= 0) {
      return;
    }
    const direction = normal ? normal.clone().scaleInPlace(-1) : new Vector3(0, 1, 0);
    direction.y += 0.6;
    if (direction.lengthSquared() === 0) {
      return;
    }
    destructible.applyImpulse(direction.normalize().scaleInPlace(strength));
  }

  private publish(result: DestructionResult, destructible: DestructibleObject): void {
    // Un objet detruit ne doit jamais etre compte deux fois (spec 6.5, 15.5).
    if (result.destroyed && !this.destroyedIds.has(result.id)) {
      this.destroyedIds.add(result.id);
      if (result.definition.staticUntilDestroyed) {
        this.debris.track(destructible);
      }
      this.propagateToBuildings(result.id);
    }

    for (const listener of this.listeners) {
      listener(result);
    }
  }

  private propagateToBuildings(sectionId: string): void {
    const building = this.buildings.find((candidate) => candidate.owns(sectionId));
    if (!building) {
      return;
    }

    const collapsed = building.onSectionDestroyed();
    if (collapsed.length > 0) {
      this.collapsedBuildingCount += 1;
    }

    for (const section of collapsed) {
      if (this.destroyedIds.has(section.result.id)) {
        continue;
      }
      this.destroyedIds.add(section.result.id);
      this.debris.track(section.section);
      for (const listener of this.listeners) {
        listener(section.result);
      }
    }
  }
}

export function createDestructibleMaterials(scene: Scene) {
  return {
    damaged: createMaterial(scene, "destructibleDamaged", "#8a6a4a"),
    critical: createMaterial(scene, "destructibleCritical", "#5e4430"),
    destroyed: createMaterial(scene, "destructibleDestroyed", "#2f2a28"),
  };
}

function createMaterial(scene: Scene, name: string, color: string): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = Color3.FromHexString(color);
  material.specularColor = Color3.Black();
  return material;
}
