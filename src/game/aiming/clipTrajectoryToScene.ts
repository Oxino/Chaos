import { Ray, type Scene, Vector3 } from "@babylonjs/core";
import type { Vector3Like } from "../../data/content/levels/levelTypes";
import type { TrajectoryResult } from "../shot/trajectory";

export interface ClippedTrajectory extends TrajectoryResult {
  /** Normale de la surface touchee, ou null si la trajectoire n'a rencontre aucun obstacle. */
  readonly impactNormal: Vector3Like | null;
}

/**
 * Tronque la trajectoire au premier obstacle rencontre pour que le reticule reste visible
 * sur la premiere surface touchee (spec 5.2). Le nombre de points est conserve afin de
 * permettre la mise a jour en place du maillage de lignes.
 */
export function clipTrajectoryToScene(
  scene: Scene,
  trajectory: TrajectoryResult,
): ClippedTrajectory {
  const points = trajectory.points;

  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    if (!from || !to) {
      break;
    }

    const origin = toVector3(from);
    const segment = toVector3(to).subtract(origin);
    const length = segment.length();
    if (length === 0) {
      continue;
    }

    const hit = scene.pickWithRay(new Ray(origin, segment.normalize(), length));
    if (!hit?.hit || !hit.pickedPoint) {
      continue;
    }

    const impact: Vector3Like = {
      x: hit.pickedPoint.x,
      y: hit.pickedPoint.y,
      z: hit.pickedPoint.z,
    };
    const clipped = points.slice(0, index + 1);
    while (clipped.length < points.length) {
      clipped.push(impact);
    }

    const start = points[0] ?? impact;
    const normal = hit.getNormal(true);
    return {
      points: clipped,
      impact,
      impactNormal: normal ? { x: normal.x, y: normal.y, z: normal.z } : null,
      range: Math.hypot(impact.x - start.x, impact.z - start.z),
      flightTime: (trajectory.flightTime * index) / (points.length - 1),
    };
  }

  return { ...trajectory, impactNormal: { x: 0, y: 1, z: 0 } };
}

function toVector3(point: Vector3Like): Vector3 {
  return new Vector3(point.x, point.y, point.z);
}
