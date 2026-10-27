import {
  Color3,
  type Mesh,
  MeshBuilder,
  PointLight,
  type Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";

const SHOCKWAVE_DURATION_MS = 520;
const THRUSTER_FLAME_DIAMETER = 1.1;
const DESTRUCTION_BURST_DURATION_MS = 260;

/**
 * Retours visuels des capacites actives (spec 14) : onde de choc de la bombe et flamme du
 * reacteur. Les maillages sont crees une fois puis reutilises, sans allocation en cours de vol.
 */
export class AbilityEffects {
  private readonly shockwave: Mesh;
  private readonly shockwaveMaterial: StandardMaterial;
  private readonly shockwaveLight: PointLight;
  private readonly flame: Mesh;
  private readonly thrusterLight: PointLight;
  private readonly destructionBurst: Mesh;
  private readonly destructionBurstMaterial: StandardMaterial;
  private readonly destructionLight: PointLight;
  private shockwaveMs = 0;
  private shockwaveRadius = 1;
  private destructionBurstMs = 0;

  constructor(scene: Scene) {
    this.shockwaveMaterial = new StandardMaterial("shockwaveMaterial", scene);
    this.shockwaveMaterial.emissiveColor = Color3.FromHexString("#ffb13c");
    this.shockwaveMaterial.diffuseColor = Color3.Black();
    this.shockwaveMaterial.specularColor = Color3.Black();
    this.shockwaveMaterial.alpha = 0;
    this.shockwaveMaterial.backFaceCulling = false;

    this.shockwave = MeshBuilder.CreateTorus(
      "shockwave",
      { diameter: 1, thickness: 0.12, tessellation: 24 },
      scene,
    );
    this.shockwave.material = this.shockwaveMaterial;
    this.shockwave.isPickable = false;
    this.shockwave.setEnabled(false);

    this.shockwaveLight = new PointLight("shockwaveLight", Vector3.Zero(), scene);
    this.shockwaveLight.diffuse = Color3.FromHexString("#ffad38");
    this.shockwaveLight.intensity = 0;
    this.shockwaveLight.range = 18;

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

    this.thrusterLight = new PointLight("thrusterLight", Vector3.Zero(), scene);
    this.thrusterLight.diffuse = Color3.FromHexString("#ff6b2c");
    this.thrusterLight.intensity = 0;
    this.thrusterLight.range = 8;

    this.destructionBurstMaterial = new StandardMaterial("destructionBurstMaterial", scene);
    this.destructionBurstMaterial.emissiveColor = Color3.FromHexString("#ffdb4d");
    this.destructionBurstMaterial.diffuseColor = Color3.Black();
    this.destructionBurstMaterial.specularColor = Color3.Black();
    this.destructionBurstMaterial.alpha = 0;
    this.destructionBurst = MeshBuilder.CreateSphere(
      "destructionBurst",
      { diameter: 1, segments: 12 },
      scene,
    );
    this.destructionBurst.material = this.destructionBurstMaterial;
    this.destructionBurst.isPickable = false;
    this.destructionBurst.setEnabled(false);

    this.destructionLight = new PointLight("destructionLight", Vector3.Zero(), scene);
    this.destructionLight.diffuse = Color3.FromHexString("#ffb13c");
    this.destructionLight.intensity = 0;
    this.destructionLight.range = 10;
  }

  triggerShockwave(center: Vector3, radius: number): void {
    this.shockwave.position.copyFrom(center);
    this.shockwaveRadius = radius;
    this.shockwaveMs = SHOCKWAVE_DURATION_MS;
    this.shockwaveLight.position.copyFrom(center);
    this.shockwaveLight.intensity = Math.min(7, 1.6 + radius * 0.14);
    this.shockwave.setEnabled(true);
  }

  setThrusterActive(active: boolean, position: Vector3 | null): void {
    this.flame.setEnabled(active);
    this.thrusterLight.intensity = active ? 2.4 : 0;
    if (active && position) {
      this.flame.position.copyFrom(position);
      this.flame.scaling.set(0.7, 1.5, 0.7);
      this.thrusterLight.position.copyFrom(position);
    }
  }

  triggerDestructionBurst(center: Vector3): void {
    this.destructionBurst.position.copyFrom(center);
    this.destructionBurst.scaling.setAll(0.35);
    this.destructionBurstMs = DESTRUCTION_BURST_DURATION_MS;
    this.destructionLight.position.copyFrom(center);
    this.destructionLight.intensity = 4;
    this.destructionBurst.setEnabled(true);
  }

  update(deltaMs: number): void {
    if (this.shockwaveMs > 0) {
      this.shockwaveMs = Math.max(0, this.shockwaveMs - deltaMs);
      const progress = 1 - this.shockwaveMs / SHOCKWAVE_DURATION_MS;
      const scale = this.shockwaveRadius * 2 * progress;
      this.shockwave.scaling.setAll(Math.max(scale, 0.01));
      this.shockwaveMaterial.alpha = 0.8 * (1 - progress);
      this.shockwaveLight.intensity = Math.max(0, 4 * (1 - progress));

      if (this.shockwaveMs === 0) {
        this.shockwave.setEnabled(false);
        this.shockwaveLight.intensity = 0;
      }
    }

    if (this.destructionBurstMs > 0) {
      this.destructionBurstMs = Math.max(0, this.destructionBurstMs - deltaMs);
      const burstProgress = 1 - this.destructionBurstMs / DESTRUCTION_BURST_DURATION_MS;
      this.destructionBurst.scaling.setAll(0.35 + burstProgress * 1.6);
      this.destructionBurstMaterial.alpha = 0.72 * (1 - burstProgress);
      this.destructionLight.intensity = Math.max(0, 4 * (1 - burstProgress));
      if (this.destructionBurstMs === 0) {
        this.destructionBurst.setEnabled(false);
        this.destructionLight.intensity = 0;
      }
    }
  }

  reset(): void {
    this.shockwaveMs = 0;
    this.shockwave.setEnabled(false);
    this.shockwaveLight.intensity = 0;
    this.flame.setEnabled(false);
    this.thrusterLight.intensity = 0;
    this.destructionBurstMs = 0;
    this.destructionBurst.setEnabled(false);
    this.destructionLight.intensity = 0;
  }
}
