import { Color3, MeshBuilder, type Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import type { LauncherAnchor } from "../../data/content/levels/levelTypes";

/**
 * Repere visuel de la fronde. Sans collision : le lanceur ne doit pas gener le personnage au depart.
 */
export function createLauncherMarker(scene: Scene, anchor: LauncherAnchor): void {
  const material = new StandardMaterial("launcherMaterial", scene);
  material.diffuseColor = Color3.FromHexString("#c8d4e8");
  material.specularColor = Color3.Black();

  const post = MeshBuilder.CreateCylinder(
    "launcherPost",
    { height: anchor.position.y, diameter: 0.8 },
    scene,
  );
  post.position.set(anchor.position.x, anchor.position.y / 2, anchor.position.z);
  post.material = material;
  post.isPickable = false;

  for (const side of [-1, 1]) {
    const arm = MeshBuilder.CreateCylinder("launcherArm", { height: 3, diameter: 0.4 }, scene);
    arm.position.set(
      anchor.position.x + side * 0.9,
      anchor.position.y + 1.1,
      anchor.position.z,
    );
    arm.rotation.z = side * 0.35;
    arm.material = material;
    arm.isPickable = false;
  }

  const direction = new Vector3(
    anchor.restDirection.x,
    anchor.restDirection.y,
    anchor.restDirection.z,
  ).normalize();

  const guide = MeshBuilder.CreateLines("launcherGuide", {
    points: [
      new Vector3(anchor.position.x, anchor.position.y, anchor.position.z),
      new Vector3(anchor.position.x, anchor.position.y, anchor.position.z).add(
        direction.scale(8),
      ),
    ],
  });
  guide.color = Color3.FromHexString("#ffd24a");
  guide.isPickable = false;
}
