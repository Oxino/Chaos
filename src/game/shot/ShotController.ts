import { shotConfig } from "../../data/config/gameplayConfig";
import type { LauncherAnchor, Vector3Like } from "../../data/content/levels/levelTypes";
import type { BuildSelectionService } from "../build/BuildSelectionService";
import {
  type CharacterSpawner,
  type LaunchedCharacter,
  maxAngularSpeed,
  maxLinearSpeed,
} from "../character/CharacterSpawner";
import { computeLaunchImpulse } from "./launchMath";
import { isShotFinished, isStill, nextStillnessMs } from "./settling";
import type { MapBounds } from "../level/boundaryMath";

/** Etats du tir (spec 15.4). `BuildSelection` arrivera avec la Phase 4. */
export type ShotState = "Aiming" | "InFlight" | "Settling" | "ShotComplete";

/**
 * Cycle complet d'un tir : lancement, vol, stabilisation, fin, retour a la visee.
 * Les entrees sont filtrees par l'etat courant pour qu'une double activation ne lance qu'un tir.
 */
export class ShotController {
  private state: ShotState = "Aiming";
  private character: LaunchedCharacter | null = null;
  private stillnessMs = 0;
  private elapsedMs = 0;
  private resultMs = 0;
  private shotCount = 0;

  constructor(
    private readonly spawner: CharacterSpawner,
    private readonly build: BuildSelectionService,
    private readonly anchor: LauncherAnchor,
    private readonly shotsAllowed: number,
  ) {}

  get currentState(): ShotState {
    return this.state;
  }

  get shotsFired(): number {
    return this.shotCount;
  }

  get shotsRemaining(): number {
    return Math.max(0, this.shotsAllowed - this.shotCount);
  }

  get isSessionComplete(): boolean {
    return this.shotsRemaining === 0 && this.state === "Aiming";
  }

  get activeCharacter(): LaunchedCharacter | null {
    return this.character;
  }

  rescueCharactersOutside(bounds: MapBounds, bucketCenter: Vector3Like): number {
    return this.spawner.rescueOutOfBounds(bounds, bucketCenter);
  }

  get canLaunch(): boolean {
    return this.state === "Aiming" && this.shotsRemaining > 0;
  }

  get canEndManually(): boolean {
    return this.state === "InFlight" || this.state === "Settling";
  }

  launch(direction: Vector3Like, power: number): boolean {
    if (!this.canLaunch) {
      return false;
    }

    const character = this.build.character;
    const resolved = this.build.resolved;
    this.character = this.spawner.spawn(this.anchor.position, {
      definition: character.ragdoll,
      massScale: resolved.massScale,
      restitution: resolved.restitution,
      friction: resolved.friction,
      tint: character.tint,
    });
    this.spawner.applyImpulse(
      this.character,
      computeLaunchImpulse(direction, 1, this.build.launchImpulse(power)),
    );

    this.state = "InFlight";
    this.stillnessMs = 0;
    this.elapsedMs = 0;
    this.resultMs = 0;
    this.shotCount += 1;
    return true;
  }

  endShotManually(): boolean {
    if (!this.canEndManually) {
      return false;
    }
    this.completeShot();
    return true;
  }

  update(deltaMs: number): void {
    if (this.state === "ShotComplete") {
      this.resultMs += deltaMs;
      if (this.resultMs >= shotConfig.resultDurationMs) {
        this.state = "Aiming";
        this.character = null;
      }
      return;
    }

    if (this.state !== "InFlight" && this.state !== "Settling") {
      return;
    }

    const character = this.character;
    if (!character) {
      this.completeShot();
      return;
    }

    this.elapsedMs += deltaMs;

    // Un seul membre encore agite suffit a considerer le pantin comme en mouvement.
    const still = isStill(maxLinearSpeed(character), maxAngularSpeed(character), shotConfig);

    this.stillnessMs = nextStillnessMs(this.stillnessMs, deltaMs, still);
    this.state = still ? "Settling" : "InFlight";

    if (isShotFinished(this.stillnessMs, this.elapsedMs, shotConfig)) {
      this.completeShot();
    }
  }

  resetSession(): void {
    this.spawner.clear();
    this.state = "Aiming";
    this.character = null;
    this.stillnessMs = 0;
    this.elapsedMs = 0;
    this.resultMs = 0;
    this.shotCount = 0;
  }

  private completeShot(): void {
    this.state = "ShotComplete";
    this.resultMs = 0;
  }
}
