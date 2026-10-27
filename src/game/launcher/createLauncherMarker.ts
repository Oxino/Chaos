import { Color3, type Mesh, MeshBuilder, type Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import type { LauncherAnchor } from "../../data/content/levels/levelTypes";

/**
 * Repere visuel de la fronde. Sans collision : le lanceur ne doit pas gener le personnage au depart.
 */
export function createLauncherMarker(scene: Scene, anchor: LauncherAnchor): readonly Mesh[] {
  const wood = new StandardMaterial("launcherWood", scene);
  wood.diffuseColor = Color3.FromHexString("#9b552c");
  wood.specularColor = Color3.Black();

  const elastic = new StandardMaterial("launcherElastic", scene);
  elastic.diffuseColor = Color3.FromHexString("#263649");
  elastic.specularColor = Color3.Black();

  const pouchMaterial = new StandardMaterial("launcherPouch", scene);
  pouchMaterial.diffuseColor = Color3.FromHexString("#d49a49");
  pouchMaterial.specularColor = Color3.Black();

  const meshes: Mesh[] = [];

  const post = MeshBuilder.CreateCylinder(
    "launcherPost",
    { height: anchor.position.y, diameter: 0.8 },
    scene,
  );
  post.position.set(anchor.position.x, anchor.position.y / 2, anchor.position.z);
  post.material = wood;
  post.isPickable = false;
  meshes.push(post);

  for (const side of [-1, 1]) {
    const arm = MeshBuilder.CreateCylinder("launcherArm", { height: 3, diameter: 0.4 }, scene);
    arm.position.set(
      anchor.position.x + side * 0.9,
      anchor.position.y + 1.1,
      anchor.position.z,
    );
    arm.rotation.z = side * 0.35;
    arm.material = wood;
    arm.isPickable = false;
    meshes.push(arm);
  }

  const pouch = MeshBuilder.CreateSphere("launcherPouch", { diameter: 1.15, segments: 12 }, scene);
  pouch.position.set(anchor.position.x, anchor.position.y + 0.18, anchor.position.z - 0.12);
  pouch.scaling.y = 0.55;
  pouch.material = pouchMaterial;
  pouch.isPickable = false;
  meshes.push(pouch);

  for (const side of [-1, 1]) {
    const band = MeshBuilder.CreateLines(
      `launcherBand_${side}`,
      {
        points: [
          new Vector3(anchor.position.x + side * 0.96, anchor.position.y + 2.45, anchor.position.z),
          new Vector3(anchor.position.x + side * 0.3, anchor.position.y + 0.55, anchor.position.z - 0.08),
        ],
      },
      scene,
    );
    band.color = elastic.diffuseColor;
    band.isPickable = false;
    meshes.push(band);
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
  guide.color = Color3.FromHexString("#ffcf31");
  guide.alpha = 0.7;
  guide.isPickable = false;
  meshes.push(guide);

  return meshes;
}
