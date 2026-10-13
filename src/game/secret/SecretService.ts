import {
  Color3,
  type Mesh,
  MeshBuilder,
  type Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { SecretDefinition } from "../../data/content/secrets/secretTypes";

const RING_THICKNESS = 0.45;
const SPIN_SPEED = 0.0015;

export interface SecretDiscovery {
  readonly definition: SecretDefinition;
}

/**
 * Zones secretes d'un niveau (spec 7.3). Un secret est decouvert quand un personnage lance
 * traverse sa zone. La decouverte est unique par partie et persistee ensuite.
 */
export class SecretService {
  private readonly markers = new Map<string, Mesh>();
  private readonly discoveredThisSession = new Set<string>();
  private readonly discoveredMaterial: StandardMaterial;

  constructor(
    scene: Scene,
    private readonly secrets: readonly SecretDefinition[],
  ) {
    const pendingMaterial = new StandardMaterial("secretMaterial", scene);
    pendingMaterial.emissiveColor = Color3.FromHexString("#ffd24a");
    pendingMaterial.diffuseColor = Color3.Black();
    pendingMaterial.specularColor = Color3.Black();

    this.discoveredMaterial = new StandardMaterial("secretFoundMaterial", scene);
    this.discoveredMaterial.emissiveColor = Color3.FromHexString("#5fd38d");
    this.discoveredMaterial.diffuseColor = Color3.Black();
    this.discoveredMaterial.specularColor = Color3.Black();

    for (const secret of secrets) {
      const marker = MeshBuilder.CreateTorus(
        `secret_${secret.id}`,
        { diameter: secret.radius * 2, thickness: RING_THICKNESS, tessellation: 24 },
        scene,
      );
      marker.position.set(secret.position.x, secret.position.y, secret.position.z);
      marker.rotation.x = Math.PI / 2;
      marker.material = pendingMaterial;
      marker.isPickable = false;
      this.markers.set(secret.id, marker);
    }
  }

  get discoveredCount(): number {
    return this.discoveredThisSession.size;
  }

  get discoveredIds(): ReadonlySet<string> {
    return this.discoveredThisSession;
  }

  get totalCount(): number {
    return this.secrets.length;
  }

  /** Renvoie les secrets decouverts par ce passage, en general zero ou un. */
  check(position: Vector3): readonly SecretDefinition[] {
    const found: SecretDefinition[] = [];

    for (const secret of this.secrets) {
      if (this.discoveredThisSession.has(secret.id)) {
        continue;
      }
      const center = new Vector3(secret.position.x, secret.position.y, secret.position.z);
      if (Vector3.Distance(position, center) > secret.radius) {
        continue;
      }
      this.discoveredThisSession.add(secret.id);
      this.markers.get(secret.id)?.setEnabled(false);
      found.push(secret);
    }

    return found;
  }

  animate(deltaMs: number): void {
    for (const marker of this.markers.values()) {
      marker.rotation.y += SPIN_SPEED * deltaMs;
    }
  }

  resetSession(): void {
    this.discoveredThisSession.clear();
    for (const marker of this.markers.values()) {
      marker.setEnabled(true);
    }
  }

  dispose(): void {
    for (const marker of this.markers.values()) {
      marker.dispose();
    }
    this.markers.clear();
  }
}
