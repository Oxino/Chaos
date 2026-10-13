import type { DestructibleObject } from "./DestructibleObject";
import { debrisToFreeze } from "./collapseMath";

/** Vitesse en dessous de laquelle un debris est considere comme pose. */
const SETTLED_SPEED = 0.4;

/**
 * Limite le nombre de corps detaches encore simules (spec 6.6, 18). Les debris excedentaires
 * sont figes une fois poses : ils restent visibles pour la persistance de la partie (spec 6.3)
 * mais ne coutent plus rien au moteur physique.
 */
export class DebrisBudget {
  private readonly tracked: DestructibleObject[] = [];

  constructor(private readonly maxActiveDebris: number) {}

  get activeCount(): number {
    return this.tracked.length;
  }

  track(debris: DestructibleObject): void {
    this.tracked.push(debris);
  }

  update(): void {
    let remaining = debrisToFreeze(this.tracked.length, this.maxActiveDebris);
    if (remaining === 0) {
      return;
    }

    // Les plus anciens debris poses sont figes en premier.
    for (let index = 0; index < this.tracked.length && remaining > 0; index += 1) {
      const debris = this.tracked[index];
      if (!debris || debris.isFrozen || debris.speed > SETTLED_SPEED) {
        continue;
      }
      debris.freeze();
      remaining -= 1;
    }

    this.prune();
  }

  clear(): void {
    this.tracked.length = 0;
  }

  private prune(): void {
    const stillActive = this.tracked.filter((debris) => !debris.isFrozen);
    this.tracked.length = 0;
    this.tracked.push(...stillActive);
  }
}
