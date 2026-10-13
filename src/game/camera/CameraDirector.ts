import {
  type AbstractMesh,
  ArcRotateCamera,
  PointerEventTypes,
  Ray,
  type Scene,
  Vector3,
} from "@babylonjs/core";
import { cameraConfig } from "../../data/config/gameplayConfig";
import { lerpAngleRad, pullInRadius } from "./cameraMath";

export type CameraMode = "aim" | "follow" | "result";

/** Le rayon anti-obstacle part legerement au-dessus du personnage pour eviter le ras du sol. */
const OBSTACLE_RAY_LIFT = 1.2;

export interface CameraFocus {
  readonly position: Vector3;
  readonly velocity: Vector3;
  /** Maillages du personnage suivi, exclus du test d'obstacle. */
  readonly meshes: readonly AbstractMesh[];
}

/**
 * Enchaine les cadrages du tir (spec 5.5). Pendant le vol, la camera se place automatiquement
 * derriere le personnage mais reste orientable : des que le joueur fait glisser l'ecran,
 * le recadrage automatique se met en retrait jusqu'au tir suivant.
 * La camera d'impact arrivera avec la destruction de la Phase 2.
 */
export class CameraDirector {
  private readonly followCamera: ArcRotateCamera;
  private mode: CameraMode = "aim";
  private userTookOver = false;

  constructor(
    private readonly scene: Scene,
    private readonly aimCamera: ArcRotateCamera,
  ) {
    this.followCamera = new ArcRotateCamera(
      "flightFollowCamera",
      aimCamera.alpha,
      defaultBeta(),
      cameraConfig.followDistance,
      aimCamera.getTarget().clone(),
      scene,
    );
    this.followCamera.minZ = 0.5;
    this.followCamera.lowerBetaLimit = 0.2;
    this.followCamera.upperBetaLimit = Math.PI / 2.05;
    this.followCamera.angularSensibilityX = 1800;
    this.followCamera.angularSensibilityY = 1800;

    scene.onPointerObservable.add((info) => {
      if (info.type === PointerEventTypes.POINTERDOWN && this.mode !== "aim") {
        this.userTookOver = true;
      }
    });

    scene.activeCamera = aimCamera;
  }

  get currentMode(): CameraMode {
    return this.mode;
  }

  setMode(mode: CameraMode): void {
    if (mode === this.mode) {
      return;
    }

    if (mode === "aim") {
      this.followCamera.detachControl();
      this.aimCamera.attachControl(true);
      this.scene.activeCamera = this.aimCamera;
    } else {
      if (this.mode === "aim") {
        // Depart du suivi sur la vue de visee pour eviter un saut de cadrage.
        this.aimCamera.detachControl();
        this.followCamera.alpha = this.aimCamera.alpha;
        this.followCamera.beta = this.aimCamera.beta;
        this.followCamera.setTarget(this.aimCamera.getTarget().clone());
        this.userTookOver = false;
        this.followCamera.attachControl(true);
      }
      this.scene.activeCamera = this.followCamera;
    }

    this.mode = mode;
  }

  update(deltaSeconds: number, focus: CameraFocus | null): void {
    if (this.mode === "aim" || !focus || deltaSeconds <= 0) {
      return;
    }

    const isResult = this.mode === "result";
    const blend = 1 - Math.exp(-cameraConfig.dampingPerSecond * deltaSeconds);

    const desiredTarget = isResult
      ? focus.position
      : focus.position.add(
          horizontalOf(focus.velocity).scale(cameraConfig.followLookAheadSeconds),
        );
    this.followCamera.setTarget(
      Vector3.Lerp(this.followCamera.getTarget(), desiredTarget, blend),
    );

    const desiredRadius = isResult ? cameraConfig.resultDistance : cameraConfig.followDistance;
    this.followCamera.radius += (desiredRadius - this.followCamera.radius) * blend;

    if (!this.userTookOver) {
      const heading = horizontalOf(focus.velocity);
      if (heading.lengthSquared() > 1) {
        heading.normalize();
        this.followCamera.alpha = lerpAngleRad(
          this.followCamera.alpha,
          Math.atan2(-heading.z, -heading.x),
          blend,
        );
      }
      const desiredBeta = isResult
        ? cameraConfig.resultBetaDeg * (Math.PI / 180)
        : defaultBeta();
      this.followCamera.beta += (desiredBeta - this.followCamera.beta) * blend;
    }

    this.avoidObstacles(focus.meshes);
  }

  /** Rapproche la camera si un element du decor s'interpose entre elle et le personnage. */
  private avoidObstacles(ignoredMeshes: readonly AbstractMesh[]): void {
    const target = this.followCamera.getTarget().add(new Vector3(0, OBSTACLE_RAY_LIFT, 0));
    const offset = directionFromOrbit(this.followCamera.alpha, this.followCamera.beta);
    const hit = this.scene.pickWithRay(
      new Ray(target, offset, this.followCamera.radius),
      (mesh) =>
        mesh.isPickable &&
        mesh.metadata?.blocksCamera === true &&
        !ignoredMeshes.includes(mesh),
    );

    if (hit?.hit && hit.distance > 0) {
      this.followCamera.radius = pullInRadius(
        this.followCamera.radius,
        hit.distance,
        cameraConfig.collisionMargin,
        cameraConfig.minFollowDistance,
      );
    }
  }
}

function directionFromOrbit(alpha: number, beta: number): Vector3 {
  return new Vector3(
    Math.cos(alpha) * Math.sin(beta),
    Math.cos(beta),
    Math.sin(alpha) * Math.sin(beta),
  );
}

/** Inclinaison donnant la hauteur de suivi voulue a la distance de suivi. */
function defaultBeta(): number {
  return Math.acos(
    Math.min(cameraConfig.followHeight / cameraConfig.followDistance, 1),
  );
}

function horizontalOf(vector: Vector3): Vector3 {
  return new Vector3(vector.x, 0, vector.z);
}
