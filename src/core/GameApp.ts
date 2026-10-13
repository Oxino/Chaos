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
import { destructionConfig, scoreConfig } from "../data/config/gameplayConfig";import { prototypeDistrict } from "../data/content/levels/prototypeDistrict";
import { describePassive } from "../data/content/passives/passiveTypes";
import { AimingController } from "../game/aiming/AimingController";
import { BuildSelectionService } from "../game/build/BuildSelectionService";
import { clipTrajectoryToScene } from "../game/aiming/clipTrajectoryToScene";
import { CameraDirector } from "../game/camera/CameraDirector";
import { CharacterSpawner } from "../game/character/CharacterSpawner";
import { DebrisBudget } from "../game/destruction/DebrisBudget";
import type { DestructionResult } from "../game/destruction/DestructibleObject";
import { DestructionService } from "../game/destruction/DestructionService";
import { createLauncherMarker } from "../game/launcher/createLauncherMarker";
import { buildLevelBlockout } from "../game/level/buildLevelBlockout";
import { ShotController, type ShotState } from "../game/shot/ShotController";
import { ComboChainTracker } from "../game/score/ComboChainTracker";
import { ScoreService } from "../game/score/ScoreService";
import { SaveService } from "../game/save/SaveService";
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
  readonly score: ScoreService;
  readonly combo: ComboChainTracker;
  readonly build: BuildSelectionService;
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
  private readonly save = new SaveService();
  private systems: GameplaySystems | undefined;
  private sessionResultsShown = false;
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
      onCycleCharacter: () => this.systems?.build.cycleCharacter(),
      onCycleItem: () => this.systems?.build.cycleItem(),
    });

    window.addEventListener("resize", this.handleResize);
    window.addEventListener("keydown", this.handleKeyDown);
  }

  async start(): Promise<void> {
    this.hud.setStatus("Chargement de la physique Havok...");
    this.engine.runRenderLoop(() => this.scene.render());

    await this.save.load();
    const plugin = await createHavokPlugin();
    const { x, y, z } = physicsConfig.gravity;
    this.scene.enablePhysics(new Vector3(x, y, z), plugin);

    this.createLighting();
    const destruction = new DestructionService(new DebrisBudget(destructionConfig.maxActiveDebris));
    buildLevelBlockout(this.scene, prototypeDistrict, destruction);
    createLauncherMarker(this.scene, prototypeDistrict.launcher);

    const build = new BuildSelectionService();
    this.systems = {
      aiming: new AimingController(this.camera, prototypeDistrict.launcher, build),
      shots: new ShotController(
        new CharacterSpawner(this.scene),
        build,
        prototypeDistrict.launcher,
        prototypeDistrict.shotsAllowed,
      ),
      preview: new TrajectoryPreview(this.scene),
      director: new CameraDirector(this.scene, this.camera),
      destruction,
      score: new ScoreService(),
      combo: new ComboChainTracker(scoreConfig.comboWindowMs, scoreConfig.maxComboMultiplier),
      build,
    };

    this.scene.onBeforeRenderObservable.add(() => this.tick());
    destruction.onImpact((report) => this.hud.showImpact(report));
    destruction.onDestruction((result) => this.awardDestruction(result));
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
    this.systems.combo.update(performance.now());
    this.systems.destruction.update();
    this.hud.update(deltaMs);
    director.setMode(cameraModeFor(shots.currentState));
    director.update(deltaMs / 1000, this.focusOnActiveCharacter());

    this.refreshAimAndHud();
    this.checkSessionEnd();
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

  /** Les resultats ne sont calcules et sauvegardes qu'une seule fois par partie (spec 17). */
  private checkSessionEnd(): void {
    if (!this.systems || this.sessionResultsShown || !this.systems.shots.isSessionComplete) {
      return;
    }
    this.sessionResultsShown = true;

    const { score, combo, destruction } = this.systems;
    const { total, direct, combo: comboPoints } = score.breakdown;

    void this.save.recordBestScore(prototypeDistrict.id, total).then((isNewRecord) => {
      this.hud.showResults({
        levelName: prototypeDistrict.displayName,
        total,
        direct,
        combo: comboPoints,
        targetScore: prototypeDistrict.targetScore,
        bestChain: combo.bestChain,
        destroyedCount: destruction.destroyedCount,
        bestScore: this.save.getBestScore(prototypeDistrict.id),
        isNewRecord,
      });
    });
  }

  private awardDestruction(result: DestructionResult): void {
    if (!this.systems || result.stagesLost <= 0) {
      return;
    }
    const { combo, score, build } = this.systems;

    // Chaque etape de degats rapporte sa part, pour que le score progresse a chaque impact.
    const points = Math.round(
      (result.definition.scoreValue * result.stagesLost * build.resolved.scoreMultiplier) /
        result.definition.stages,
    );
    // L'identifiant inclut l'etape atteinte : un meme objet ne peut pas payer deux fois la meme.
    const awardId = `${result.id}#${result.remainingStages}`;
    score.award(awardId, points, combo.register(performance.now()));
  }

  private refreshAimAndHud(): void {
    if (!this.systems) {
      return;
    }
    const { aiming, preview, shots } = this.systems;
    const isAiming = shots.currentState === "Aiming";
    // La portee annoncee doit correspondre au reticule, donc au trajet tronque par le decor.
    const trajectory = clipTrajectoryToScene(this.scene, aiming.getTrajectory());

    preview.setVisible(isAiming && !shots.isSessionComplete);
    if (isAiming) {
      preview.update(trajectory);
    }

    this.hud.setActionMode(shots.canEndManually ? "end" : "launch");
    this.hud.setActionEnabled(shots.canLaunch || shots.canEndManually);
    this.hud.setPowerEnabled(isAiming && !shots.isSessionComplete);
    this.hud.setBuildEnabled(isAiming && !shots.isSessionComplete);
    this.hud.setBuild({
      characterLabel: this.systems.build.character.displayName,
      itemLabel: this.systems.build.item.displayName,
      passivesLabel: `${describePassive(this.systems.build.character.passive)} / ${describePassive(this.systems.build.item.passive)}`,
    });
    this.hud.setStatus(this.buildStatusLines(trajectory.range).join("\n"));
  }

  private buildStatusLines(range: number): string[] {
    if (!this.systems) {
      return [];
    }
    const { aiming, shots, score, combo, destruction } = this.systems;
    const { total, direct, combo: comboPoints } = score.breakdown;

    if (shots.isSessionComplete) {
      return [
        `${prototypeDistrict.displayName} - Partie terminee`,
        `Score : ${total} / ${prototypeDistrict.targetScore}`,
        `Degats directs ${direct} + combos ${comboPoints}`,
        total >= prototypeDistrict.targetScore ? "Objectif atteint !" : "Objectif non atteint.",
        "Reinitialiser pour rejouer.",
      ];
    }

    const lines = [
      `${prototypeDistrict.displayName} - ${STATE_LABELS[shots.currentState]}`,
      `Score : ${total} / ${prototypeDistrict.targetScore}`,
      `Tirs restants : ${shots.shotsRemaining} / ${prototypeDistrict.shotsAllowed}`,
      `Objets detruits : ${destruction.destroyedCount} / ${destruction.totalCount}`,
    ];

    if (combo.currentChain > 1) {
      lines.push(`Combo x${combo.currentMultiplier} (${combo.currentChain} destructions)`);
    }

    lines.push(
      shots.currentState === "Aiming"
        ? `Angle ${aiming.getPitchDeg().toFixed(0)} deg - portee ${range.toFixed(0)} m`
        : "Clic-glisser pour regarder autour, Espace pour terminer le tir.",
    );
    return lines;
  }

  private launch(): void {
    if (!this.systems) {
      return;
    }
    const { aiming, shots, destruction } = this.systems;
    if (shots.launch(aiming.getDirection(), aiming.power)) {
      destruction.beginShot();
      this.hud.clearImpact();
    }
  }

  private endShot(): void {
    this.systems?.shots.endShotManually();
  }

  private reset(): void {
    if (!this.systems) {
      return;
    }
    const { shots, aiming, director, destruction, score, combo } = this.systems;
    shots.resetSession();
    destruction.resetAll();
    score.reset();
    combo.reset();
    aiming.resetPower();
    this.sessionResultsShown = false;
    this.hud.hideResults();
    this.hud.clearImpact();
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
