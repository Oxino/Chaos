import { Vector3 } from "@babylonjs/core";
import type { ActiveAbility } from "../../data/content/items/abilityTypes";
import type { LaunchedCharacter } from "../character/CharacterSpawner";
import type { DestructionService } from "../destruction/DestructionService";
import type { AbilityEffects } from "../../rendering/effects/AbilityEffects";
import { cheatConfig } from "../../data/config/gameplayConfig";

/** Etats d'une capacite active (spec 5.4). */
export type AbilityState = "Unavailable" | "Ready" | "Active" | "Used";

/**
 * Pilote la capacite active de l'objet equipe : une seule utilisation par tir, declenchee
 * manuellement pendant le vol. Elle ne pilote jamais librement la trajectoire (spec 5.4).
 */
export class AbilityController {
  private state: AbilityState = "Unavailable";
  private ability: ActiveAbility | null = null;
  private character: LaunchedCharacter | null = null;
  private remainingMs = 0;
  private explosionRadiusBonus = 0;

  /** Bonus de rayon issu de l'arbre de competences (spec 9.2). */
  setExplosionRadiusBonus(bonus: number): void {
    this.explosionRadiusBonus = Math.max(0, bonus);
  }

  constructor(
    private readonly destruction: DestructionService,
    private readonly effects: AbilityEffects,
  ) {}

  get currentState(): AbilityState {
    return this.state;
  }

  get label(): string | null {
    return this.ability?.displayName ?? null;
  }

  get canActivate(): boolean {
    return this.state === "Ready";
  }

  beginShot(ability: ActiveAbility | null, character: LaunchedCharacter): void {
    this.ability = ability;
    this.character = character;
    this.state = ability ? "Ready" : "Unavailable";
    this.remainingMs = 0;
  }

  endShot(): void {
    this.character = null;
    this.remainingMs = 0;
    this.effects.setThrusterActive(false, null);
    if (this.state === "Active") {
      this.state = "Used";
    }
  }

  activate(): boolean {
    if (!this.canActivate || !this.ability || !this.character) {
      return false;
    }

    if (this.ability.kind === "bomb") {
      this.detonate(
        this.ability.radius * (1 + this.explosionRadiusBonus),
        this.ability.impulse,
        this.ability.impactStrength,
      );
      this.state = "Used";
      return true;
    }

    this.remainingMs = this.ability.durationMs;
    this.state = "Active";
    return true;
  }

  activateCheat(): boolean {
    if (!this.character || this.state === "Used" || this.state === "Active") {
      return false;
    }
    this.detonate(
      cheatConfig.atomicRadius,
      cheatConfig.atomicImpulse,
      cheatConfig.atomicImpactStrength,
    );
    this.state = "Used";
    return true;
  }

  update(deltaMs: number): void {
    this.effects.update(deltaMs);

    if (this.state !== "Active" || !this.ability || this.ability.kind !== "thruster") {
      return;
    }

    const character = this.character;
    if (!character) {
      this.endShot();
      return;
    }

    this.remainingMs = Math.max(0, this.remainingMs - deltaMs);
    this.effects.setThrusterActive(true, character.root.mesh.getAbsolutePosition());

    const heading = thrustDirection(character);
    const strength = (this.ability.impulsePerSecond * deltaMs) / 1000;
    for (const part of character.parts) {
      const share = part.mass / totalMass(character);
      part.aggregate.body.applyImpulse(
        heading.scale(strength * share),
        part.mesh.getAbsolutePosition(),
      );
    }

    if (this.remainingMs === 0) {
      this.state = "Used";
      this.effects.setThrusterActive(false, null);
    }
  }

  private detonate(radius: number, impulse: number, impactStrength: number): void {
    const character = this.character;
    if (!character) {
      return;
    }

    const center = character.root.mesh.getAbsolutePosition().clone();
    this.effects.triggerShockwave(center, radius);
    this.destruction.applyExplosion(center, radius, impulse, impactStrength);

    // Le personnage est lui aussi souffle : il ne meurt pas, il vole (spec 6.2).
    // L'impulsion est repartie au prorata des masses, sinon les membres legers partent en orbite.
    for (const part of character.parts) {
      const offset = part.mesh.getAbsolutePosition().subtract(center);
      offset.y += 1;
      const share = part.mass / character.totalMass;
      part.aggregate.body.applyImpulse(
        offset.normalize().scaleInPlace(impulse * 0.35 * share),
        part.mesh.getAbsolutePosition(),
      );
    }
  }
}

/** La poussee suit le mouvement, avec une composante verticale pour relancer la cloche. */
function thrustDirection(character: LaunchedCharacter): Vector3 {
  const velocity = character.root.aggregate.body.getLinearVelocity();
  const heading = new Vector3(velocity.x, 0, velocity.z);
  if (heading.lengthSquared() < 0.01) {
    return new Vector3(0, 1, 0);
  }
  heading.normalize();
  heading.y = 0.35;
  return heading.normalize();
}

function totalMass(character: LaunchedCharacter): number {
  return character.totalMass;
}
