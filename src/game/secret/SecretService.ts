import { type Scene, Vector3 } from "@babylonjs/core";
import type { SecretDefinition } from "../../data/content/secrets/secretTypes";

export interface SecretDiscovery {
  readonly definition: SecretDefinition;
}

/**
 * Zones secretes d'un niveau (spec 7.3). Un secret est decouvert quand un personnage lance
 * traverse sa zone. La decouverte est unique par partie et persistee ensuite.
 */
export class SecretService {
  private readonly discoveredThisSession = new Set<string>();

  constructor(
    _scene: Scene,
    private readonly secrets: readonly SecretDefinition[],
  ) {}

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
      found.push(secret);
    }

    return found;
  }

  animate(_deltaMs: number): void {}

  resetSession(): void {
    this.discoveredThisSession.clear();
  }

  dispose(): void {}
}
