import { Color3, type PhysicsBody, type Scene, StandardMaterial } from "@babylonjs/core";
import type { DebrisBudget } from "./DebrisBudget";
import type { DestructibleBuilding } from "./DestructibleBuilding";
import type { DestructibleObject, DestructionResult } from "./DestructibleObject";

export type DestructionListener = (result: DestructionResult) => void;

/**
 * Ecoute les collisions des destructibles, resout les impacts et tient l'etat du monde pour
 * la duree de la partie (spec 6.3, 6.5). Les vraies collisions secondaires declenchent
 * naturellement les reactions en chaine : rien n'est propage artificiellement.
 */
export class DestructionService {
  private readonly objects = new Map<string, DestructibleObject>();
  private readonly bodies = new Map<PhysicsBody, DestructibleObject>();
  private readonly buildings: DestructibleBuilding[] = [];
  private readonly destroyedIds = new Set<string>();
  private readonly listeners = new Set<DestructionListener>();

  constructor(private readonly debris: DebrisBudget) {}

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

    body.setCollisionCallbackEnabled(true);
    body.getCollisionObservable().add((event) => {
      // Le contact avec le sol est ignore : sans cela, tout objet qui se pose s'auto-detruirait.
      if (event.collidedAgainst.transformNode.metadata?.isGround === true) {
        return;
      }
      this.handleCollision(body, event.impulse);
    });
  }

  registerBuilding(building: DestructibleBuilding): void {
    this.buildings.push(building);
  }

  onDestruction(listener: DestructionListener): void {
    this.listeners.add(listener);
  }

  update(): void {
    this.debris.update();
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
  }

  private handleCollision(body: PhysicsBody, impulse: number): void {
    const destructible = this.bodies.get(body);
    if (!destructible || destructible.isDestroyed) {
      return;
    }

    const result = destructible.applyImpact(impulse);
    if (result) {
      this.publish(result, destructible);
    }
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

    for (const section of building.onSectionDestroyed()) {
      if (this.destroyedIds.has(section.id)) {
        continue;
      }
      this.destroyedIds.add(section.id);
      this.debris.track(section);
      for (const listener of this.listeners) {
        listener({
          id: section.id,
          definition: section.definition,
          state: "Destroyed",
          destroyed: true,
        });
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
