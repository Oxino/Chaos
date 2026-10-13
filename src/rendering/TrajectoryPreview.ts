import {
  Color3,
  type LinesMesh,
  type Mesh,
  MeshBuilder,
  Quaternion,
  type Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { aimConfig } from "../data/config/gameplayConfig";
import type { Vector3Like } from "../data/content/levels/levelTypes";
import type { ClippedTrajectory } from "../game/aiming/clipTrajectoryToScene";

const LINE_COLOR = "#ffd24a";
const RETICLE_COLOR = "#ff4d4d";
/** Decolle le reticule de la surface touchee pour eviter le z-fighting. */
const RETICLE_SURFACE_OFFSET = 0.1;

/**
 * Ligne de trajectoire et reticule de point d'impact (spec 5.2, 13.2).
 */
export class TrajectoryPreview {
  private lines: LinesMesh;
  private readonly reticle: Mesh;

  constructor(private readonly scene: Scene) {
    const placeholder = Array.from(
      { length: aimConfig.trajectorySampleCount },
      () => Vector3.Zero(),
    );
    this.lines = MeshBuilder.CreateLines(
      "trajectoryPreview",
      { points: placeholder, updatable: true },
      scene,
    );
    this.lines.color = Color3.FromHexString(LINE_COLOR);
    this.lines.isPickable = false;

    const reticleMaterial = new StandardMaterial("reticleMaterial", scene);
    reticleMaterial.emissiveColor = Color3.FromHexString(RETICLE_COLOR);
    reticleMaterial.diffuseColor = Color3.Black();
    reticleMaterial.specularColor = Color3.Black();

    this.reticle = MeshBuilder.CreateTorus(
      "reticle",
      { diameter: aimConfig.reticleDiameter, thickness: 0.45, tessellation: 32 },
      scene,
    );
    this.reticle.material = reticleMaterial;
    this.reticle.isPickable = false;
  }

  update(trajectory: ClippedTrajectory): void {
    this.lines = MeshBuilder.CreateLines(
      "trajectoryPreview",
      { points: trajectory.points.map(toVector3), instance: this.lines },
      this.scene,
    );

    const normal = trajectory.impactNormal
      ? toVector3(trajectory.impactNormal).normalize()
      : Vector3.Up();
    this.reticle.rotationQuaternion = alignUpTo(normal);
    this.reticle.position = toVector3(trajectory.impact).add(
      normal.scale(RETICLE_SURFACE_OFFSET),
    );
  }

  setVisible(visible: boolean): void {
    this.lines.setEnabled(visible);
    this.reticle.setEnabled(visible);
  }
}

function toVector3(point: Vector3Like): Vector3 {
  return new Vector3(point.x, point.y, point.z);
}

/** Oriente l'axe Y du tore (plan du cercle) vers la normale de la surface. */
function alignUpTo(normal: Vector3): Quaternion {
  const dot = Vector3.Dot(Vector3.Up(), normal);
  if (dot > 0.9999) {
    return Quaternion.Identity();
  }
  if (dot < -0.9999) {
    return Quaternion.RotationAxis(Vector3.Right(), Math.PI);
  }
  const axis = Vector3.Cross(Vector3.Up(), normal).normalize();
  return Quaternion.RotationAxis(axis, Math.acos(dot));
}
