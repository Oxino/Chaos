import type { ArcRotateCamera } from "@babylonjs/core";
import { aimConfig, launcherConfig } from "../../data/config/gameplayConfig";
import { physicsConfig } from "../../data/config/engineConfig";
import type { LauncherAnchor, Vector3Like } from "../../data/content/levels/levelTypes";
import type { BuildSelectionService } from "../build/BuildSelectionService";
import { computeTrajectory, type TrajectoryResult } from "../shot/trajectory";
import {
  clampAngleDeg,
  directionFromYawPitchDeg,
  mapRangeClamped,
  yawPitchDegFromDirection,
} from "./aimMath";

/**
 * La visee suit l'orientation de la camera, bornee a l'amplitude du lanceur (spec 5.3).
 * Le lanceur reste a sa position fixe : seule la direction change.
 */
export class AimingController {
  private readonly restYawDeg: number;
  private powerRatio: number = aimConfig.defaultPowerRatio;

  constructor(
    private readonly camera: ArcRotateCamera,
    private readonly anchor: LauncherAnchor,
    private readonly build: BuildSelectionService,
  ) {
    this.restYawDeg = yawPitchDegFromDirection(anchor.restDirection).yawDeg;
  }

  get power(): number {
    return this.powerRatio;
  }

  setPower(ratio: number): void {
    this.powerRatio = Math.min(Math.max(ratio, aimConfig.minPowerRatio), 1);
  }

  resetPower(): void {
    this.powerRatio = aimConfig.defaultPowerRatio;
  }

  getDirection(): Vector3Like {
    return directionFromYawPitchDeg(this.getYawDeg(), this.getPitchDeg());
  }

  getYawDeg(): number {
    const forward = this.camera.getForwardRay().direction;
    const { yawDeg } = yawPitchDegFromDirection(forward);
    return clampAngleDeg(yawDeg, this.restYawDeg, launcherConfig.horizontalAmplitudeDeg);
  }

  /** Plus la vue plonge vers le sol, plus la cloche du tir est haute. */
  getPitchDeg(): number {
    return mapRangeClamped(
      (this.camera.beta * 180) / Math.PI,
      aimConfig.cameraBetaMinDeg,
      aimConfig.cameraBetaMaxDeg,
      aimConfig.pitchAtBetaMinDeg,
      aimConfig.pitchAtBetaMaxDeg,
    );
  }

  getLaunchSpeed(): number {
    return this.build.launchSpeed(this.powerRatio);
  }

  getTrajectory(groundY = 0): TrajectoryResult {
    return computeTrajectory({
      origin: this.anchor.position,
      direction: this.getDirection(),
      speed: this.getLaunchSpeed(),
      gravity: Math.abs(physicsConfig.gravity.y),
      groundY,
      sampleCount: aimConfig.trajectorySampleCount,
    });
  }
}
