import {
  type ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  FreeCamera,
  HemisphericLight,
  type Mesh,
  type PhysicsAggregate,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { engineConfig, physicsConfig } from "../data/config/engineConfig";
import { destructionConfig, progressionConfig, scoreConfig } from "../data/config/gameplayConfig";
import { levelCatalog } from "../data/content/levels/levelCatalog";
import type { LevelBlockout } from "../data/content/levels/levelTypes";
import { describePassive } from "../data/content/passives/passiveTypes";
import { AbilityController, type AbilityState } from "../game/ability/AbilityController";
import { AimingController } from "../game/aiming/AimingController";
import { clipTrajectoryToScene } from "../game/aiming/clipTrajectoryToScene";
import { BuildSelectionService } from "../game/build/BuildSelectionService";
import { CameraDirector } from "../game/camera/CameraDirector";
import { CharacterSpawner } from "../game/character/CharacterSpawner";
import { DebrisBudget } from "../game/destruction/DebrisBudget";
import type { DestructionResult } from "../game/destruction/DestructibleObject";
import { DestructionService } from "../game/destruction/DestructionService";
import { createLauncherMarker } from "../game/launcher/createLauncherMarker";
import { buildLevelBlockout } from "../game/level/buildLevelBlockout";
import { unlockedLevelCount } from "../game/level/levelProgress";
import { resolveLevel, totalSkillPoints, xpFromScore } from "../game/progression/progressionMath";
import { QuestService } from "../game/quest/QuestService";
import { ComboChainTracker } from "../game/score/ComboChainTracker";
import { ScoreService } from "../game/score/ScoreService";
import { SaveService } from "../game/save/SaveService";
import { SecretService } from "../game/secret/SecretService";
import { SkillTreeService } from "../game/skill/SkillTreeService";
import { ShotController, type ShotState } from "../game/shot/ShotController";
import { TrajectoryPreview } from "../rendering/TrajectoryPreview";
import { AbilityEffects } from "../rendering/effects/AbilityEffects";
import { createAimCamera, resetAimCamera } from "../rendering/cameras/createAimCamera";
import { PrototypeHud } from "../ui/PrototypeHud";
import { createHavokPlugin } from "./physics/createHavokPlugin";

const STATE_LABELS: Record<ShotState, string> = {
  Aiming: "Visee",
  InFlight: "En vol",
  Settling: "Stabilisation",
  ShotComplete: "Tir termine",
};

const ABILITY_LABELS: Record<AbilityState, string> = {
  Unavailable: "indisponible",
  Ready: "pret",
  Active: "en cours",
  Used: "utilisee",
};

interface LevelSystems {
  readonly blockout: LevelBlockout;
  readonly camera: ArcRotateCamera;
  readonly aiming: AimingController;
  readonly shots: ShotController;
  readonly preview: TrajectoryPreview;
  readonly director: CameraDirector;
  readonly destruction: DestructionService;
  readonly secrets: SecretService;
  readonly meshes: readonly Mesh[];
  readonly aggregates: readonly PhysicsAggregate[];
}

/**
 * Amorce technique : moteur, scene, physique et boucle de rendu.
 * Les regles de jeu vivent dans les services de src/game (spec 15.2).
 */
export class GameApp {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly hud: PrototypeHud;
  private readonly save = new SaveService();
  private readonly build = new BuildSelectionService();
  private readonly score = new ScoreService();
  private readonly combo = new ComboChainTracker(
    scoreConfig.comboWindowMs,
    scoreConfig.maxComboMultiplier,
  );
  private readonly quests = new QuestService();
  private readonly skills = new SkillTreeService();
  private readonly abilityEffects: AbilityEffects;
  private loadingCamera: FreeCamera | undefined;

  private level: LevelSystems | undefined;
  private levelIndex = 0;
  private sessionResultsShown = false;
  private lastShotState: ShotState = "Aiming";
  private abilityController: AbilityController | undefined;

  private readonly handleResize = (): void => this.engine.resize();
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "KeyA") {
      event.preventDefault();
      this.activateAbility();
      return;
    }
    if (event.code !== "Space") {
      return;
    }
    event.preventDefault();
    if (this.level?.shots.canLaunch) {
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
    // Le niveau n'existe pas encore : sans camera, la boucle de rendu leve "No camera defined".
    this.loadingCamera = new FreeCamera("loadingCamera", Vector3.Zero(), this.scene);
    this.abilityEffects = new AbilityEffects(this.scene);

    this.hud = new PrototypeHud(this.scene, {
      onLaunch: () => this.launch(),
      onEndShot: () => this.endShot(),
      onReset: () => this.restartSession(),
      onNextLevel: () => this.goToNextLevel(),
      onPowerChanged: (ratio) => this.level?.aiming.setPower(ratio),
      onCycleCharacter: () => this.build.cycleCharacter(),
      onCycleItem: () => this.build.cycleItem(),
      onActivateAbility: () => this.activateAbility(),
      onUpgradeSkill: (nodeId) => this.upgradeSkill(nodeId),
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
    this.quests.setKnownCompleted(this.save.completedQuestIds);
    this.skills.load(this.save.skillRanks, this.earnedSkillPoints());
    this.loadLevel(0);

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

  private loadLevel(index: number): void {
    const blockout = levelCatalog[index];
    if (!blockout) {
      return;
    }

    this.unloadLevel();
    this.levelIndex = index;

    const destruction = new DestructionService(new DebrisBudget(destructionConfig.maxActiveDebris));
    const built = buildLevelBlockout(this.scene, blockout, destruction);
    const launcherMeshes = createLauncherMarker(this.scene, blockout.launcher);
    const camera = createAimCamera(this.scene, blockout.launcher);
    this.loadingCamera?.dispose();
    this.loadingCamera = undefined;

    this.abilityController = new AbilityController(destruction, this.abilityEffects);
    this.level = {
      blockout,
      camera,
      aiming: new AimingController(camera, blockout.launcher, this.build),
      shots: new ShotController(
        new CharacterSpawner(this.scene),
        this.build,
        blockout.launcher,
        blockout.shotsAllowed,
      ),
      preview: new TrajectoryPreview(this.scene),
      director: new CameraDirector(this.scene, camera),
      destruction,
      secrets: new SecretService(this.scene, blockout.secrets),
      meshes: [...built.meshes, ...launcherMeshes],
      aggregates: built.aggregates,
    };

    destruction.onImpact((report) => this.hud.showImpact(report));
    destruction.onDestruction((result) => this.awardDestruction(result));

    this.applySkillBonuses();
    this.restartSession();
  }

  private unloadLevel(): void {
    const level = this.level;
    if (!level) {
      return;
    }
    level.shots.resetSession();
    level.secrets.dispose();
    for (const aggregate of level.aggregates) {
      aggregate.dispose();
    }
    for (const mesh of level.meshes) {
      mesh.dispose();
    }
    level.camera.dispose();
    this.level = undefined;
  }

  private tick(): void {
    const level = this.level;
    if (!level) {
      return;
    }
    const deltaMs = this.engine.getDeltaTime();

    level.shots.update(deltaMs);
    if (this.lastShotState !== level.shots.currentState) {
      if (level.shots.currentState === "ShotComplete") {
        this.abilityController?.endShot();
      }
      this.lastShotState = level.shots.currentState;
    }

    this.abilityController?.update(deltaMs);
    this.combo.update(performance.now());
    level.destruction.update();
    level.secrets.animate(deltaMs);
    this.hud.update(deltaMs);

    this.checkSecrets();
    level.director.setMode(cameraModeFor(level.shots.currentState));
    level.director.update(deltaMs / 1000, this.focusOnActiveCharacter());

    this.refreshAimAndHud();
    this.refreshQuestProgress();
    this.checkSessionEnd();
  }

  private checkSecrets(): void {
    const level = this.level;
    const character = level?.shots.activeCharacter;
    if (!level || !character) {
      return;
    }

    for (const secret of level.secrets.check(character.root.mesh.getAbsolutePosition())) {
      this.score.award(`secret:${secret.id}`, secret.scoreBonus, 1);
      this.hud.showSecret(secret.name);
    }
  }

  private focusOnActiveCharacter() {
    const character = this.level?.shots.activeCharacter;
    if (!character) {
      return null;
    }
    return {
      position: character.root.mesh.getAbsolutePosition(),
      velocity: character.root.aggregate.body.getLinearVelocity(),
      meshes: character.parts.map((part) => part.mesh),
    };
  }

  private refreshQuestProgress(): void {
    const level = this.level;
    if (!level) {
      return;
    }
    this.quests.report("sessionScore", this.score.total);
    this.quests.report("bestCombo", this.combo.bestChain);
    this.quests.report("objectsDestroyed", level.destruction.destroyedCount);
    this.quests.report("buildingsCollapsed", level.destruction.collapsedBuildings);
  }

  /** Les resultats ne sont calcules et sauvegardes qu'une seule fois par partie (spec 17). */
  private checkSessionEnd(): void {
    const level = this.level;
    if (!level || this.sessionResultsShown || !level.shots.isSessionComplete) {
      return;
    }
    this.sessionResultsShown = true;

    const { total, direct, combo: comboPoints } = this.score.breakdown;
    const completedQuests = this.quests.collectNewlyCompleted();
    const discoveredSecrets = level.secrets.discoveredIds;
    const questXp = completedQuests.reduce((sum, quest) => sum + quest.xpReward, 0);
    const secretXp = level.blockout.secrets
      .filter((secret) => discoveredSecrets.has(secret.id))
      .reduce((sum, secret) => sum + secret.xpReward, 0);
    const gainedXp = xpFromScore(total, progressionConfig) + questXp + secretXp;

    void this.save
      .recordSessionResult({
        levelId: level.blockout.id,
        score: total,
        gainedXp,
        completedQuestIds: completedQuests.map((quest) => quest.id),
        discoveredSecretIds: [...discoveredSecrets],
      })
      .then((isNewRecord) => {
        const progress = resolveLevel(this.save.totalXp, progressionConfig);
        this.quests.setKnownCompleted(this.save.completedQuestIds);
        this.refreshSkillPoints();
        this.hud.showResults({
          levelName: level.blockout.displayName,
          total,
          direct,
          combo: comboPoints,
          targetScore: level.blockout.targetScore,
          bestChain: this.combo.bestChain,
          destroyedCount: level.destruction.destroyedCount,
          secretsFound: level.secrets.discoveredCount,
          secretsTotal: level.secrets.totalCount,
          bestScore: this.save.getBestScore(level.blockout.id),
          isNewRecord,
          gainedXp,
          playerLevel: progress.level,
          skillPoints: totalSkillPoints(progress.level, progressionConfig),
          completedQuests: completedQuests.map((quest) => quest.name),
          hasNextLevel: this.nextLevelIsUnlocked(),
        });
      });
  }

  private nextLevelIsUnlocked(): boolean {
    const next = this.levelIndex + 1;
    return next < levelCatalog.length && next < unlockedLevelCount(levelCatalog, this.save.bestScores);
  }

  private earnedSkillPoints(): number {
    const progress = resolveLevel(this.save.totalXp, progressionConfig);
    return totalSkillPoints(progress.level, progressionConfig);
  }

  private refreshSkillPoints(): void {
    this.skills.setEarnedPoints(this.earnedSkillPoints());
  }

  private upgradeSkill(nodeId: string): void {
    if (this.skills.upgrade(nodeId)) {
      this.applySkillBonuses();
      void this.save.saveSkillRanks(this.skills.currentRanks);
    }
  }

  /** Les bonus sont relus a chaque changement pour rester la seule source de verite. */
  private applySkillBonuses(): void {
    const bonuses = this.skills.bonuses;
    this.build.applySkillBonuses(bonuses.launchPower, bonuses.bounce);
    this.level?.destruction.setImpactMultiplier(1 + bonuses.impact);
    this.abilityController?.setExplosionRadiusBonus(bonuses.explosionRadius);
  }

  private activateAbility(): void {
    if (this.abilityController?.activate()) {
      this.quests.increment("abilitiesUsed");
    }
  }

  private awardDestruction(result: DestructionResult): void {
    if (result.stagesLost <= 0) {
      return;
    }

    // Chaque etape de degats rapporte sa part, pour que le score progresse a chaque impact.
    const bonuses = this.skills.bonuses;
    const base =
      (result.definition.scoreValue * result.stagesLost * this.build.resolved.scoreMultiplier) /
      result.definition.stages;
    const multiplier = this.combo.register(performance.now());
    const comboBoost = multiplier > 1 ? bonuses.comboScore : 0;
    const points = Math.round(base * (1 + bonuses.destructionScore + comboBoost));
    // L'identifiant inclut l'etape atteinte : un meme objet ne peut pas payer deux fois la meme.
    const awardId = `${result.id}#${result.remainingStages}`;
    this.score.award(awardId, points, multiplier);

    if (result.destroyed && result.definition.id === "car") {
      this.quests.increment("vehiclesDestroyed");
    }
  }

  private refreshAimAndHud(): void {
    const level = this.level;
    if (!level) {
      return;
    }
    const isAiming = level.shots.currentState === "Aiming";
    // La portee annoncee doit correspondre au reticule, donc au trajet tronque par le decor.
    const trajectory = clipTrajectoryToScene(this.scene, level.aiming.getTrajectory());

    level.preview.setVisible(isAiming && !level.shots.isSessionComplete);
    if (isAiming) {
      level.preview.update(trajectory);
    }

    this.hud.setActionMode(level.shots.canEndManually ? "end" : "launch");
    this.hud.setActionEnabled(level.shots.canLaunch || level.shots.canEndManually);
    this.hud.setPowerEnabled(isAiming && !level.shots.isSessionComplete);
    this.hud.setBuildEnabled(isAiming && !level.shots.isSessionComplete);
    this.hud.setBuild({
      characterLabel: this.build.character.displayName,
      itemLabel: this.build.item.displayName,
      passivesLabel: `${describePassive(this.build.character.passive)} / ${describePassive(this.build.item.passive)}`,
    });
    this.refreshAbilityHud(isAiming);
    this.hud.setSkillButtonLabel(this.skills.availablePoints);
    if (this.hud.skillPanelOpen) {
      this.hud.renderSkills(this.skills.statuses, this.skills.availablePoints);
    }
    this.hud.setStatus(this.buildStatusLines(trajectory.range).join("\n"));
  }

  private buildStatusLines(range: number): string[] {
    const level = this.level;
    if (!level) {
      return [];
    }
    const { total, direct, combo: comboPoints } = this.score.breakdown;

    if (level.shots.isSessionComplete) {
      return [
        `${level.blockout.displayName} - Partie terminee`,
        `Score : ${total} / ${level.blockout.targetScore}`,
        `Degats directs ${direct} + combos ${comboPoints}`,
      ];
    }

    const lines = [
      `${level.blockout.displayName} - ${STATE_LABELS[level.shots.currentState]}`,
      `Score : ${total} / ${level.blockout.targetScore}`,
      `Tirs restants : ${level.shots.shotsRemaining} / ${level.blockout.shotsAllowed}`,
      `Objets detruits : ${level.destruction.destroyedCount} / ${level.destruction.totalCount}`,
      `Secrets : ${level.secrets.discoveredCount} / ${level.secrets.totalCount}`,
    ];

    if (this.combo.currentChain > 1) {
      lines.push(`Combo x${this.combo.currentMultiplier} (${this.combo.currentChain} destructions)`);
    }

    lines.push(
      level.shots.currentState === "Aiming"
        ? `Angle ${level.aiming.getPitchDeg().toFixed(0)} deg - portee ${range.toFixed(0)} m`
        : "Clic-glisser pour regarder autour, Espace pour terminer le tir.",
    );
    return lines;
  }

  private refreshAbilityHud(isAiming: boolean): void {
    const configured = this.build.item.ability;
    if (!configured || !this.abilityController) {
      this.hud.setAbility(null, false);
      return;
    }
    if (isAiming) {
      this.hud.setAbility(`${configured.displayName} : pret`, false);
      return;
    }
    this.hud.setAbility(
      `${configured.displayName} : ${ABILITY_LABELS[this.abilityController.currentState]}`,
      this.abilityController.canActivate,
    );
  }

  private launch(): void {
    const level = this.level;
    if (!level) {
      return;
    }
    if (level.shots.launch(level.aiming.getDirection(), level.aiming.power)) {
      level.destruction.beginShot();
      this.hud.clearImpact();
      const character = level.shots.activeCharacter;
      if (character) {
        this.abilityController?.beginShot(this.build.item.ability, character);
      }
    }
  }

  private endShot(): void {
    if (this.level?.shots.endShotManually()) {
      this.abilityController?.endShot();
    }
  }

  private goToNextLevel(): void {
    if (this.nextLevelIsUnlocked()) {
      this.loadLevel(this.levelIndex + 1);
    }
  }

  private restartSession(): void {
    const level = this.level;
    if (!level) {
      return;
    }
    level.shots.resetSession();
    level.destruction.resetAll();
    level.secrets.resetSession();
    this.score.reset();
    this.combo.reset();
    this.quests.resetSession();
    level.aiming.resetPower();
    this.sessionResultsShown = false;
    this.lastShotState = "Aiming";
    this.hud.hideResults();
    this.hud.clearImpact();
    this.hud.setPower(level.aiming.power);
    level.director.setMode("aim");
    resetAimCamera(level.camera, level.blockout.launcher);
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
