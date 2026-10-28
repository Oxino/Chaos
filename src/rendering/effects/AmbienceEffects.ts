import {
  Color3,
  Color4,
  DirectionalLight,
  HemisphericLight,
  ParticleSystem,
  RawTexture,
  Scene,
  Texture,
  Vector3,
} from "@babylonjs/core";
import type { AmbienceSelection } from "../../game/level/ambienceMath";

export interface AmbienceVisualProfile {
  readonly clearColor: string;
  readonly fogColor: string;
  readonly fogDensity: number;
  readonly ambientIntensity: number;
  readonly sunIntensity: number;
  readonly ambientColor: string;
  readonly groundColor: string;
  readonly sunColor: string;
  readonly contrast: number;
  readonly exposure: number;
}

const TIME_PROFILES: Record<AmbienceSelection["timeOfDay"], AmbienceVisualProfile> = {
  dawn: {
    clearColor: "#e89b83ff",
    fogColor: "#d9a99d",
    fogDensity: 0,
    ambientIntensity: 0.64,
    sunIntensity: 0.72,
    ambientColor: "#ffd2b8",
    groundColor: "#65556b",
    sunColor: "#ffb274",
    contrast: 1.06,
    exposure: 0.96,
  },
  day: {
    clearColor: "#78b8e3ff",
    fogColor: "#78b8e3",
    fogDensity: 0,
    ambientIntensity: 0.75,
    sunIntensity: 1.1,
    ambientColor: "#d9edff",
    groundColor: "#4d6680",
    sunColor: "#fff0c7",
    contrast: 1.1,
    exposure: 1,
  },
  dusk: {
    clearColor: "#b36f72ff",
    fogColor: "#a06f78",
    fogDensity: 0,
    ambientIntensity: 0.62,
    sunIntensity: 0.8,
    ambientColor: "#ffc49a",
    groundColor: "#70505e",
    sunColor: "#ff9b55",
    contrast: 1.13,
    exposure: 1.04,
  },
  night: {
    clearColor: "#172a46ff",
    fogColor: "#203955",
    fogDensity: 0,
    ambientIntensity: 0.5,
    sunIntensity: 0.32,
    ambientColor: "#8eb4df",
    groundColor: "#29435f",
    sunColor: "#b5d3ff",
    contrast: 1.14,
    exposure: 0.92,
  },
};

const WEATHER_SKIES: Record<Exclude<AmbienceSelection["weather"], "sunny">, Record<AmbienceSelection["timeOfDay"], string>> = {
  cloudy: { dawn: "#a88783ff", day: "#8397a5ff", dusk: "#806f7dff", night: "#172538ff" },
  rain: { dawn: "#766c79ff", day: "#536d84ff", dusk: "#655568ff", night: "#101d30ff" },
  snow: { dawn: "#c5aeb1ff", day: "#b7c9d5ff", dusk: "#a899b0ff", night: "#26364dff" },
  fog: { dawn: "#b0a4a3ff", day: "#91a7adff", dusk: "#9b8c94ff", night: "#344354ff" },
};

export function ambienceVisualProfile(selection: AmbienceSelection): AmbienceVisualProfile {
  const base = TIME_PROFILES[selection.timeOfDay];
  switch (selection.weather) {
    case "cloudy":
      return {
        ...base,
        clearColor: WEATHER_SKIES.cloudy[selection.timeOfDay],
        fogColor: "#8397a5",
        ambientIntensity: base.ambientIntensity * 0.9,
        sunIntensity: base.sunIntensity * 0.55,
        ambientColor: "#c4d1d8",
        sunColor: "#d9e1e5",
        contrast: 1,
      };
    case "rain":
      return {
        ...base,
        clearColor: WEATHER_SKIES.rain[selection.timeOfDay],
        fogColor: "#61798a",
        fogDensity: 0.0015,
        ambientIntensity: base.ambientIntensity * 0.82,
        sunIntensity: base.sunIntensity * 0.45,
        ambientColor: "#adc2d0",
        sunColor: "#c2d4eb",
        exposure: base.exposure * 0.9,
      };
    case "snow":
      return {
        ...base,
        clearColor: WEATHER_SKIES.snow[selection.timeOfDay],
        fogColor: "#d4dee3",
        fogDensity: 0.0025,
        ambientIntensity: base.ambientIntensity * 1.05,
        sunIntensity: base.sunIntensity * 0.65,
        ambientColor: "#e9f4f8",
        groundColor: "#7f929d",
        sunColor: "#f4fbff",
        contrast: 0.98,
        exposure: base.exposure * 1.02,
      };
    case "fog":
      return {
        ...base,
        clearColor: WEATHER_SKIES.fog[selection.timeOfDay],
        fogColor: "#9baeb0",
        fogDensity: 0.008,
        ambientIntensity: 0.62,
        sunIntensity: base.sunIntensity * 0.35,
        ambientColor: "#d8e6e5",
        groundColor: "#60777c",
        sunColor: "#dce8e7",
        contrast: 0.95,
        exposure: 0.96,
      };
    default:
      return base;
  }
}

export class AmbienceEffects {
  private precipitation: ParticleSystem | undefined;
  private precipitationTexture: Texture | undefined;
  private precipitationEmitter: Vector3 | undefined;
  private precipitationHeight = 0;

  constructor(
    private readonly scene: Scene,
    private readonly ambientLight: HemisphericLight,
    private readonly sunLight: DirectionalLight,
  ) {}

  apply(selection: AmbienceSelection): void {
    this.clearPrecipitation();
    const profile = ambienceVisualProfile(selection);
    this.scene.clearColor = Color4.FromHexString(profile.clearColor);
    this.scene.fogMode = profile.fogDensity > 0 ? Scene.FOGMODE_EXP2 : Scene.FOGMODE_NONE;
    this.scene.fogColor = Color3.FromHexString(profile.fogColor);
    this.scene.fogDensity = profile.fogDensity;
    this.scene.imageProcessingConfiguration.contrast = profile.contrast;
    this.scene.imageProcessingConfiguration.exposure = profile.exposure;
    this.ambientLight.intensity = profile.ambientIntensity;
    this.ambientLight.diffuse = Color3.FromHexString(profile.ambientColor);
    this.ambientLight.groundColor = Color3.FromHexString(profile.groundColor);
    this.sunLight.intensity = profile.sunIntensity;
    this.sunLight.diffuse = Color3.FromHexString(profile.sunColor);

    if (selection.weather === "rain" || selection.weather === "snow") {
      this.createPrecipitation(selection.weather);
    }
  }

  update(position: Vector3): void {
    this.precipitationEmitter?.copyFromFloats(
      position.x,
      position.y + this.precipitationHeight,
      position.z,
    );
  }

  dispose(): void {
    this.clearPrecipitation();
  }

  get activeParticleCount(): number {
    return this.precipitation?.getActiveCount() ?? 0;
  }

  private createPrecipitation(weather: "rain" | "snow"): void {
    const rain = weather === "rain";
    const texture = createParticleTexture(this.scene, rain);
    const particles = new ParticleSystem(`ambience_${weather}`, rain ? 900 : 250, this.scene);
    const cameraPosition = this.scene.activeCamera?.position ?? Vector3.Zero();
    const emitterHeight = rain ? 18 : 6;
    const emitter = new Vector3(cameraPosition.x, cameraPosition.y + emitterHeight, cameraPosition.z);
    particles.particleTexture = texture;
    particles.emitter = emitter;
    particles.minEmitBox = new Vector3(-28, rain ? 0 : -8, 4);
    particles.maxEmitBox = new Vector3(28, 8, 42);
    particles.color1 = Color4.FromHexString(rain ? "#c6e5f5b8" : "#ffffffff");
    particles.color2 = Color4.FromHexString(rain ? "#8fbcd6a0" : "#ddecf4e8");
    particles.colorDead = new Color4(1, 1, 1, 0);
    particles.minSize = rain ? 0.15 : 0.08;
    particles.maxSize = rain ? 0.3 : 0.22;
    particles.minLifeTime = rain ? 0.7 : 4;
    particles.maxLifeTime = rain ? 1.15 : 7;
    particles.emitRate = rain ? 760 : 100;
    particles.direction1 = rain ? new Vector3(-3, -42, 1) : new Vector3(-1.4, -3.5, -1);
    particles.direction2 = rain ? new Vector3(1, -50, 4) : new Vector3(1.4, -5.5, 1);
    particles.gravity = rain ? new Vector3(0, -14, 0) : new Vector3(0, -0.35, 0);
    particles.blendMode = rain
      ? ParticleSystem.BLENDMODE_ADD
      : ParticleSystem.BLENDMODE_STANDARD;
    particles.minAngularSpeed = rain ? 0 : -0.8;
    particles.maxAngularSpeed = rain ? 0 : 0.8;
    particles.updateSpeed = 0.012;
    particles.preWarmCycles = rain ? 30 : 120;
    particles.preWarmStepOffset = 1;
    particles.start();
    this.precipitation = particles;
    this.precipitationTexture = texture;
    this.precipitationEmitter = emitter;
    this.precipitationHeight = emitterHeight;
  }

  private clearPrecipitation(): void {
    this.precipitation?.dispose();
    this.precipitationTexture?.dispose();
    this.precipitation = undefined;
    this.precipitationTexture = undefined;
    this.precipitationEmitter = undefined;
    this.precipitationHeight = 0;
  }
}

function createParticleTexture(scene: Scene, rain: boolean): Texture {
  const width = rain ? 8 : 16;
  const height = rain ? 32 : 16;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const centeredX = x + 0.5 - width / 2;
      const centeredY = y + 0.5 - height / 2;
      const visible = rain
        ? Math.abs(centeredX) <= 1.5
        : centeredX * centeredX + centeredY * centeredY <= 42;
      pixels[offset] = 255;
      pixels[offset + 1] = 255;
      pixels[offset + 2] = 255;
      pixels[offset + 3] = visible ? 255 : 0;
    }
  }
  const texture = RawTexture.CreateRGBATexture(
    pixels,
    width,
    height,
    scene,
    false,
    false,
    Texture.BILINEAR_SAMPLINGMODE,
  );
  texture.hasAlpha = true;
  return texture;
}