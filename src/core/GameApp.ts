import {
  type ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { engineConfig, physicsConfig } from "../data/config/engineConfig";
import { destructionConfig } from "../data/config/gameplayConfig";
import { prototypeDistrict } from "../data/content/levels/prototypeDistrict";
import { prototypeRagdoll } from "../data/content/characters/prototypeRagdoll";
import { totalMassOf } from "../data/content/characters/characterTypes";
import { AimingController } from "../game/aiming/AimingController";
import { clipTrajectoryToScene } from "../game/aiming/clipTrajectoryToScene";
import { CameraDirector } from "../game/camera/CameraDirector";
import { CharacterSpawner } from "../game/character/CharacterSpawner";
import { DebrisBudget } from "../game/destruction/DebrisBudget";
import { DestructionService } from "../game/destruction/DestructionService";
import { createLauncherMarker } from "../game/launcher/createLauncherMarker";
import { buildLevelBlockout } from "../game/level/buildLevelBlockout";
import { ShotController, type ShotState } from "../game/shot/ShotController";
import { TrajectoryPreview } from "../rendering/TrajectoryPreview";
import { createAimCamera, resetAimCamera } from "../rendering/cameras/createAimCamera";
import { PrototypeHud } from "../ui/PrototypeHud";
import { createHavokPlugin } from "./physics/createHavokPlugin";

const STATE_LABELS: Record<ShotState, string> = {
  Aiming: "Visee",
  InFlight: "En vol",
  Settling: "Stabilisation",
  ShotComplete: "Tir termine",
};

interface GameplaySystems {
  readonly aiming: AimingController;
  readonly shots: ShotController;
  readonly preview: TrajectoryPreview;
  readonly director: CameraDirector;
  readonly destruction: DestructionService;
}

/**
 * Amorce technique : moteur, scene, physique et boucle de rendu.
 * Les regles de jeu vivent dans les services de src/game (spec 15.2).
 */
export class GameApp {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly camera: ArcRotateCamera;
  private readonly hud: PrototypeHud;
  private systems: GameplaySystems | undefined;
  private readonly handleResize = (): void => this.engine.resize();
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code !== "Space") {
      return;
    }
    event.preventDefault();
    if (this.systems?.shots.canLaunch) {
      this.launch();
    } else {
      this.endShot();
    }
  };

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, engineConfig.antialias, { stencil: true }, true);
    this.engine.setHardwareScalingLevel(
      1 / Math.min(window.devicePixelRatio, engineConfig.maxDevicePixelRatio),
    );

    this.scene = new Scene(this.engine);
    this.scene.clearColor = Color4.FromHexString("#10131aff");
    this.camera = createAimCamera(this.scene, prototypeDistrict.launcher);
    this.hud = new PrototypeHud(this.scene, {
      onLaunch: () => this.launch(),
      onEndShot: () => this.endShot(),
      onReset: () => this.reset(),
      onPowerChanged: (ratio) => this.systems?.aiming.setPower(ratio),
    });

    window.addEventListener("resize", this.handleResize);
    window.addEventListener("keydown", this.handleKeyDown);
  }

  async start(): Promise<void> {
    this.hud.setStatus("Chargement de la physique Havok...");
    this.engine.runRenderLoop(() => this.scene.render());

    const plugin = await createHavokPlugin();
    const { x, y, z } = physicsConfig.gravity;
    this.scene.enablePhysics(new Vector3(x, y, z), plugin);

    this.createLighting();
    const destruction = new DestructionService(new DebrisBudget(destructionConfig.maxActiveDebris));
    buildLevelBlockout(this.scene, prototypeDistrict, destruction);
    createLauncherMarker(this.scene, prototypeDistrict.launcher);

    this.systems = {
      aiming: new AimingController(
        this.camera,
        prototypeDistrict.launcher,
        totalMassOf(prototypeRagdoll),
      ),
      shots: new ShotController(
        new CharacterSpawner(this.scene, prototypeRagdoll),
        prototypeDistrict.launcher,
      ),
      preview: new TrajectoryPreview(this.scene),
      director: new CameraDirector(this.scene, this.camera),
      destruction,
    };

    this.scene.onBeforeRenderObservable.add(() => this.tick());
  }

  dispose(): void {
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("keydown", this.handleKeyDown);
    this.hud.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }

  private createLighting(): void {
    const ambient = new HemisphericLight("ambientLight", new Vector3(0.2, 1, -0.3), this.scene);
    ambient.intensity = 0.75;
    ambient.groundColor = Color3.FromHexString("#6b7589");

    const sun = new DirectionalLight("sunLight", new Vector3(-0.35, -1, 0.5), this.scene);
    sun.intensity = 1.1;
  }

  private tick(): void {
    if (!this.systems) {
      return;
    }
    const deltaMs = this.engine.getDeltaTime();
    const { shots, director } = this.systems;

    shots.update(deltaMs);
    this.systems.destruction.update();
    director.setMode(cameraModeFor(shots.currentState));
    director.update(deltaMs / 1000, this.focusOnActiveCharacter());

    this.refreshAimAndHud();
  }

  private focusOnActiveCharacter() {
    const character = this.systems?.shots.activeCharacter;
    if (!character) {
      return null;
    }
    return {
      position: character.root.mesh.getAbsolutePosition(),
      velocity: character.root.aggregate.body.getLinearVelocity(),
      meshes: character.parts.map((part) => part.mesh),
    };
  }

  private refreshAimAndHud(): void {
    if (!this.systems) {
      return;
    }
    const { aiming, preview, shots } = this.systems;
    const isAiming = shots.currentState === "Aiming";
    // La portee annoncee doit correspondre au reticule, donc au trajet tronque par le decor.
    const trajectory = clipTrajectoryToScene(this.scene, aiming.getTrajectory());

    preview.setVisible(isAiming);
    if (isAiming) {
      preview.update(trajectory);
    }

    this.hud.setActionMode(shots.canEndManually ? "end" : "launch");
    this.hud.setPowerEnabled(isAiming);
    this.hud.setStatus(
      [
        `${prototypeDistrict.displayName} - ${STATE_LABELS[shots.currentState]}`,
        `Tirs effectues : ${shots.shotsFired}`,
        `Objets detruits : ${this.systems.destruction.destroyedCount} / ${this.systems.destruction.totalCount}`,
        `Angle de tir : ${aiming.getPitchDeg().toFixed(0)} deg`,
        `Portee estimee : ${trajectory.range.toFixed(0)} m`,
        isAiming
          ? "Clic-glisser pour viser, Espace ou Lancer pour tirer."
          : "Clic-glisser pour regarder autour, Espace pour terminer le tir.",
      ].join("\n"),
    );
  }

  private launch(): void {
    if (!this.systems) {
      return;
    }
    const { aiming, shots } = this.systems;
    shots.launch(aiming.getDirection(), aiming.power);
  }

  private endShot(): void {
    this.systems?.shots.endShotManually();
  }

  private reset(): void {
    if (!this.systems) {
      return;
    }
    const { shots, aiming, director, destruction } = this.systems;
    shots.resetSession();
    destruction.resetAll();
    aiming.resetPower();
    this.hud.setPower(aiming.power);
    director.setMode("aim");
    resetAimCamera(this.camera, prototypeDistrict.launcher);
  }
}

function cameraModeFor(state: ShotState): "aim" | "follow" | "result" {
  switch (state) {
    case "InFlight":
    case "Settling":
      return "follow";
    case "ShotComplete":
      return "result";
    default:
      return "aim";
  }
}
