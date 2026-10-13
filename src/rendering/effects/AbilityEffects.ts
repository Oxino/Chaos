import { Color3, type Mesh, MeshBuilder, type Scene, StandardMaterial, Vector3 } from "@babylonjs/core";

const SHOCKWAVE_DURATION_MS = 520;
const THRUSTER_FLAME_DIAMETER = 1.1;

/**
 * Retours visuels des capacites actives (spec 14) : onde de choc de la bombe et flamme du
 * reacteur. Les maillages sont crees une fois puis reutilises, sans allocation en cours de vol.
 */
export class AbilityEffects {
  private readonly shockwave: Mesh;
  private readonly shockwaveMaterial: StandardMaterial;
  private readonly flame: Mesh;
  private shockwaveMs = 0;
  private shockwaveRadius = 1;

  constructor(scene: Scene) {
    this.shockwaveMaterial = new StandardMaterial("shockwaveMaterial", scene);
    this.shockwaveMaterial.emissiveColor = Color3.FromHexString("#ffb13c");
    this.shockwaveMaterial.diffuseColor = Color3.Black();
    this.shockwaveMaterial.specularColor = Color3.Black();
    this.shockwaveMaterial.alpha = 0;
    this.shockwaveMaterial.backFaceCulling = false;

    this.shockwave = MeshBuilder.CreateSphere("shockwave", { diameter: 1, segments: 16 }, scene);
    this.shockwave.material = this.shockwaveMaterial;
    this.shockwave.isPickable = false;
    this.shockwave.setEnabled(false);

    const flameMaterial = new StandardMaterial("thrusterFlameMaterial", scene);
    flameMaterial.emissiveColor = Color3.FromHexString("#ff6b2c");
    flameMaterial.diffuseColor = Color3.Black();
    flameMaterial.specularColor = Color3.Black();

    this.flame = MeshBuilder.CreateSphere(
      "thrusterFlame",
      { diameter: THRUSTER_FLAME_DIAMETER, segments: 10 },
      scene,
    );
    this.flame.material = flameMaterial;
    this.flame.isPickable = false;
    this.flame.setEnabled(false);
  }

  triggerShockwave(center: Vector3, radius: number): void {
    this.shockwave.position.copyFrom(center);
    this.shockwaveRadius = radius;
    this.shockwaveMs = SHOCKWAVE_DURATION_MS;
    this.shockwave.setEnabled(true);
  }

  setThrusterActive(active: boolean, position: Vector3 | null): void {
    this.flame.setEnabled(active);
    if (active && position) {
      this.flame.position.copyFrom(position);
    }
  }

  update(deltaMs: number): void {
    if (this.shockwaveMs <= 0) {
      return;
    }

    this.shockwaveMs = Math.max(0, this.shockwaveMs - deltaMs);
    const progress = 1 - this.shockwaveMs / SHOCKWAVE_DURATION_MS;
    const diameter = this.shockwaveRadius * 2 * progress;
    this.shockwave.scaling.setAll(Math.max(diameter, 0.01));
    this.shockwaveMaterial.alpha = 0.55 * (1 - progress);

    if (this.shockwaveMs === 0) {
      this.shockwave.setEnabled(false);
    }
  }

  reset(): void {
    this.shockwaveMs = 0;
    this.shockwave.setEnabled(false);
    this.flame.setEnabled(false);
  }
}
