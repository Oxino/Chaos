import { ArcRotateCamera, type Scene, Vector3 } from "@babylonjs/core";
import { aimConfig, cameraConfig, launcherConfig } from "../../data/config/gameplayConfig";
import type { LauncherAnchor } from "../../data/content/levels/levelTypes";
import { yawPitchDegFromDirection } from "../../game/aiming/aimMath";

/** Recul et hauteur de la camera derriere le lanceur. Valeurs provisoires. */
const BEHIND_DISTANCE = 26;
const HEIGHT_OFFSET = 9;
const DEG_TO_RAD = Math.PI / 180;

/**
 * Camera de visee : elle pivote autour du lanceur et sert de reference d'orientation du tir
 * (spec 5.3, 5.5). Ses bornes reproduisent l'amplitude du lanceur pour que la vue ne puisse
 * jamais montrer une direction hors de portee du tir.
 */
export function createAimCamera(scene: Scene, anchor: LauncherAnchor): ArcRotateCamera {
  const camera = new ArcRotateCamera(
    "aimCamera",
    0,
    0,
    0,
    new Vector3(anchor.position.x, anchor.position.y, anchor.position.z),
    scene,
  );
  camera.attachControl(true);
  camera.lowerRadiusLimit = BEHIND_DISTANCE;
  camera.upperRadiusLimit = BEHIND_DISTANCE;
  camera.lowerBetaLimit = aimConfig.cameraBetaMinDeg * DEG_TO_RAD;
  camera.upperBetaLimit = aimConfig.cameraBetaMaxDeg * DEG_TO_RAD;
  camera.angularSensibilityX = 1800;
  camera.angularSensibilityY = 1800;

  // alpha et lacet de visee sont lies par yaw = -(alpha + PI/2).
  const restYawRad = yawPitchDegFromDirection(anchor.restDirection).yawDeg * DEG_TO_RAD;
  const halfAmplitudeRad = (launcherConfig.horizontalAmplitudeDeg / 2) * DEG_TO_RAD;
  const centerAlpha = -Math.PI / 2 - restYawRad;
  camera.lowerAlphaLimit = centerAlpha - halfAmplitudeRad;
  camera.upperAlphaLimit = centerAlpha + halfAmplitudeRad;

  resetAimCamera(camera, anchor);
  return camera;
}

export function resetAimCamera(camera: ArcRotateCamera, anchor: LauncherAnchor): void {
  camera.setTarget(new Vector3(anchor.position.x, anchor.position.y, anchor.position.z));
  camera.setPosition(
    new Vector3(
      anchor.position.x,
      anchor.position.y + HEIGHT_OFFSET,
      anchor.position.z - BEHIND_DISTANCE,
    ),
  );
  camera.targetScreenOffset.x = cameraConfig.aimScreenOffsetX;
}
