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
  MeshBuilder,
} from "@babylonjs/core";
import { engineConfig, physicsConfig } from "../data/config/engineConfig";
import {
  boundaryConfig,
  destructionConfig,
  launcherConfig,
  progressionConfig,
  scoreConfig,
} from "../data/config/gameplayConfig";
import { collectionConfig } from "../data/config/collectionConfig";
import { levelCatalog } from "../data/content/levels/levelCatalog";
import type { LevelBlockout } from "../data/content/levels/levelTypes";
import { describePassive } from "../data/content/passives/passiveTypes";
import { AbilityController, type AbilityState } from "../game/ability/AbilityController";
import { AimingController } from "../game/aiming/AimingController";
import { clipTrajectoryToScene } from "../game/aiming/clipTrajectoryToScene";
import { BuildSelectionService, upgradeMultiplier } from "../game/build/BuildSelectionService";
import { CameraDirector } from "../game/camera/CameraDirector";
import { CharacterSpawner } from "../game/character/CharacterSpawner";
import { DebrisBudget } from "../game/destruction/DebrisBudget";
import type { DestructionResult } from "../game/destruction/DestructibleObject";
import { DestructionService } from "../game/destruction/DestructionService";
import { createLauncherMarker } from "../game/launcher/createLauncherMarker";
import { buildLevelBlockout } from "../game/level/buildLevelBlockout";
import { mapBounds } from "../game/level/boundaryMath";
import { selectAmbience, type AmbienceSelection } from "../game/level/ambienceMath";
import { unlockedLevelCount } from "../game/level/levelProgress";
import { resolveLevel, totalSkillPoints, xpFromScore } from "../game/progression/progressionMath";
import { QuestService } from "../game/quest/QuestService";
import { ComboChainTracker } from "../game/score/ComboChainTracker";
import { ScoreService } from "../game/score/ScoreService";
import { SaveService } from "../game/save/SaveService";
import { GachaService } from "../game/collection/GachaService";
import {
  createEmptySave,
  withCollectionItem,
  withCurrency,
  withUpgradeLevel,
  type CollectionCategory,
  type SaveData,
} from "../game/save/saveSchema";
import { installChaosDebugApi, removeChaosDebugApi } from "../game/save/debugSaveTools";
import { characterCatalog } from "../data/content/characters/characterCatalog";
import { totalMassOf } from "../data/content/characters/characterTypes";
import { itemCatalog } from "../data/content/items/itemCatalog";
import { launcherCatalog } from "../data/content/launchers/launcherCatalog";
import { SecretService } from "../game/secret/SecretService";
import { SkillTreeService } from "../game/skill/SkillTreeService";
import { describeBonuses } from "../data/content/skills/skillTypes";
import { ShotController, type ShotState } from "../game/shot/ShotController";
import { TrajectoryPreview } from "../rendering/TrajectoryPreview";
import { AbilityEffects } from "../rendering/effects/AbilityEffects";
import { createAimCamera, resetAimCamera } from "../rendering/cameras/createAimCamera";
import { PrototypeHud } from "../ui/PrototypeHud";
import type { CollectionProfileView } from "../ui/CollectionPanel";
import { createHavokPlugin } from "./physics/createHavokPlugin";

const STATE_LABELS: Record<ShotState, string> = {
  Aiming: "Visee",
  InFlight: "En vol",
  Settling: "Stabilisation",
  ShotComplete: "Tir termine",
};

const DAMAGE_STATE_LABELS = {
  Intact: "intacte",
  Damaged: "endommagee",
  Critical: "critique",
  Destroyed: "detruite",
} as const;

function damageStateLabel(state: keyof typeof DAMAGE_STATE_LABELS): string {
  return DAMAGE_STATE_LABELS[state];
}

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
  private readonly gacha = new GachaService();
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
  private ambientLight: HemisphericLight | undefined;
  private sunLight: DirectionalLight | undefined;
  private ambience: AmbienceSelection | undefined;
  private ambienceMeshes: Mesh[] = [];

  private level: LevelSystems | undefined;
  private levelIndex = 0;
  private sessionResultsShown = false;
  private sessionMode: "campaign" | "free" | "cheat" = "campaign";
  private baseSessionMode: "campaign" | "free" = "campaign";
  private cheatEnabled = false;
  private lastShotState: ShotState = "Aiming";
  private abilityController: AbilityController | undefined;

  private readonly handleResize = (): void => this.engine.resize();
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "KeyA") {
      event.preventDefault();
      this.activateAbility();
      return;
    }
    if (event.code === "KeyB") {
      event.preventDefault();
      this.activateCheat();
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
      onCycleLauncher: () => this.build.cycleLauncher(),
      onActivateAbility: () => this.activateAbility(),
      onUpgradeSkill: (nodeId) => this.upgradeSkill(nodeId),
      onDrawCollection: (category) => this.drawCollection(category),
      onEquipCollection: (category, id) => this.equipCollection(category, id),
      onSelectLevel: (index) => this.startFreeLevel(index),
      onToggleCheat: () => this.toggleCheat(),
      onActivateCheat: () => this.activateCheat(),
    });

    window.addEventListener("resize", this.handleResize);
    window.addEventListener("keydown", this.handleKeyDown);
  }

  async start(): Promise<void> {
    this.hud.setStatus("Chargement de la physique Havok...");
    this.engine.runRenderLoop(() => this.scene.render());

    await this.save.load();
    await this.ensureStarterCollection();
    const plugin = await createHavokPlugin();
    const { x, y, z } = physicsConfig.gravity;
    this.scene.enablePhysics(new Vector3(x, y, z), plugin);

    this.createLighting();
    this.quests.setKnownCompleted(this.save.completedQuestIds);
    this.skills.load(this.save.skillRanks, this.earnedSkillPoints());
    this.build.applyCollectionUpgrades(this.save.upgrades);
    this.build.applyCollectionOwnership(this.save.inventory);
    this.refreshCollection();
    this.installDebugTools();
    this.loadLevel(0);

    this.scene.onBeforeRenderObservable.add(() => this.tick());
  }

  dispose(): void {
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("keydown", this.handleKeyDown);
    if (import.meta.env.DEV) {
      removeChaosDebugApi();
    }
    this.hud.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }

  private createLighting(): void {
    const ambient = new HemisphericLight("ambientLight", new Vector3(0.2, 1, -0.3), this.scene);
    ambient.intensity = 0.75;
    ambient.groundColor = Color3.FromHexString("#6b7589");
    this.ambientLight = ambient;

    const sun = new DirectionalLight("sunLight", new Vector3(-0.35, -1, 0.5), this.scene);
    sun.intensity = 1.1;
    this.sunLight = sun;
  }

  private loadLevel(index: number, mode: "campaign" | "free" = "campaign"): void {
    const blockout = levelCatalog[index];
    if (!blockout) {
      return;
    }

    this.unloadLevel();
    this.levelIndex = index;
    this.sessionMode = mode;
    this.baseSessionMode = mode;
    this.cheatEnabled = false;
    this.ambience = selectAmbience(blockout.weatherOptions, blockout.timeOfDayOptions);
    this.applyAmbience();

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

  private applyAmbience(): void {
    if (!this.ambience || !this.ambientLight || !this.sunLight) {
      return;
    }
    const night = this.ambience.timeOfDay === "night";
    const dusk = this.ambience.timeOfDay === "dusk";
    const fog = this.ambience.weather === "fog";
    const rain = this.ambience.weather === "rain";
    this.clearAmbienceMeshes();
    this.scene.clearColor = Color4.FromHexString(
      night ? "#101522ff" : dusk ? "#342d3dff" : fog ? "#4d5660ff" : "#10131aff",
    );
    this.scene.fogMode = fog ? Scene.FOGMODE_EXP2 : Scene.FOGMODE_NONE;
    this.scene.fogColor = Color3.FromHexString(fog ? "#6c747b" : "#10131a");
    this.scene.fogDensity = fog ? 0.008 : 0;
    this.ambientLight.intensity = night ? 0.42 : fog ? 0.62 : 0.75;
    this.sunLight.intensity = night ? 0.25 : rain ? 0.7 : dusk ? 0.8 : 1.1;
    if (rain) {
      this.createRainVisual();
    }
  }

  private createRainVisual(): void {
    for (let index = 0; index < 72; index += 1) {
      const x = (Math.random() - 0.5) * 120;
      const z = Math.random() * 150 - 45;
      const y = 10 + Math.random() * 24;
      const streak = MeshBuilder.CreateLines(
        `rain_${index}`,
        { points: [new Vector3(x, y, z), new Vector3(x - 0.3, y - 2.4, z + 0.15)] },
        this.scene,
      );
      streak.color = Color3.FromHexString("#9dbbd0");
      streak.alpha = 0.45;
      streak.isPickable = false;
      this.ambienceMeshes.push(streak);
    }
  }

  private clearAmbienceMeshes(): void {
    for (const mesh of this.ambienceMeshes) {
      mesh.dispose();
    }
    this.ambienceMeshes = [];
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
    this.rescueCharacterIfNeeded();
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

  private rescueCharacterIfNeeded(): void {
    const level = this.level;
    if (!level) {
      return;
    }

    const bounds = mapBounds(
      level.blockout.groundSize,
      boundaryConfig.horizontalMargin,
      boundaryConfig.lowerY,
      boundaryConfig.upperY,
    );
    const bucketCenter = {
      x: 0,
      y: boundaryConfig.bucketCenterY,
      z: 0,
    };
    const rescuedCount = level.shots.rescueCharactersOutside(bounds, bucketCenter);
    if (rescuedCount > 0) {
      level.director.setMode("follow");
      level.director.focusImmediately(new Vector3(bucketCenter.x, bucketCenter.y, bucketCenter.z));
      this.hud.showSecret(
        rescuedCount === 1
          ? "Easter egg : bienvenue dans les Back Rooms."
          : `${rescuedCount} personnages ont rejoint les Back Rooms.`,
      );
    }
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
    const official = this.sessionMode === "campaign";
    const gainedXp = official
      ? xpFromScore(total, progressionConfig) + questXp + secretXp
      : 0;
    const gainedCurrency = official
      ? Math.floor(total * collectionConfig.currencyPerScorePoint)
      : 0;

    const resultSave = official
      ? this.save.recordSessionResult({
          levelId: level.blockout.id,
          score: total,
          gainedXp,
          gainedCurrency,
          completedQuestIds: completedQuests.map((quest) => quest.id),
          discoveredSecretIds: [...discoveredSecrets],
        })
      : Promise.resolve(false);
    void resultSave
      .then((isNewRecord) => {
        const progress = resolveLevel(this.save.totalXp, progressionConfig);
        this.quests.setKnownCompleted(this.save.completedQuestIds);
        this.refreshSkillPoints();
        this.refreshCollection();
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
          gainedCurrency,
          playerLevel: progress.level,
          skillPoints: totalSkillPoints(progress.level, progressionConfig),
          completedQuests: completedQuests.map((quest) => quest.name),
          hasNextLevel: this.nextLevelIsUnlocked(),
          official,
        });
      });
  }

  private drawCollection(category: CollectionCategory): void {
    const reward = this.gacha.draw(this.save.snapshot, category);
    if (!reward) {
      this.refreshCollection("Monnaie insuffisante pour un tirage");
      return;
    }
    void this.save.saveCollection(reward.save);
    this.build.applyCollectionOwnership(reward.save.inventory);
    this.build.applyCollectionUpgrades(reward.save.upgrades);
    this.refreshCollection(
      `${reward.duplicate ? "Doublon" : "Nouveau contenu"} : ${collectionName(category, reward.itemId)}`,
    );
  }

  private async ensureStarterCollection(): Promise<void> {
    let save = this.save.snapshot;
    const starterContent = [
      ["launchers", "launcher_giant_slingshot"],
      ["characters", "character_dummy"],
      ["items", "item_stone"],
    ] as const;
    for (const [category, id] of starterContent) {
      if (!save.inventory[category][id]) save = withCollectionItem(save, category, id);
    }
    if (save !== this.save.snapshot) {
      await this.save.saveCollection(save);
    }
    this.build.applyCollectionOwnership(this.save.inventory);
  }

  private installDebugTools(): void {
    if (!import.meta.env.DEV) {
      return;
    }

    const persistAndRefresh = async (data: SaveData): Promise<SaveData> => {
      await this.save.replace(data);
      this.build.applyCollectionOwnership(this.save.inventory);
      this.build.applyCollectionUpgrades(this.save.upgrades);
      this.skills.load(this.save.skillRanks, this.earnedSkillPoints());
      this.applySkillBonuses();
      this.refreshCollection();
      return this.save.snapshot;
    };

    installChaosDebugApi({
      save: () => this.save.snapshot,
      build: () => ({
        launcherId: this.build.launcher.id,
        characterId: this.build.character.id,
        itemId: this.build.item.id,
        upgrades: {
          launcher: this.save.upgrades.launchers.launcher_giant_slingshot ?? 0,
          character: this.save.upgrades.characters[this.build.character.id] ?? 0,
          item: this.save.upgrades.items[this.build.item.id] ?? 0,
        },
        resolved: this.build.resolved,
        characterMass: this.build.characterMass,
        launchSpeedAtFullPower: this.build.launchSpeed(1),
        launchImpulseAtFullPower: this.build.launchImpulse(1),
        ability: this.build.ability,
      }),
      setCurrency: (amount) =>
        persistAndRefresh({ ...this.save.snapshot, currency: Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0 }),
      addCurrency: (amount) => persistAndRefresh(withCurrency(this.save.snapshot, amount)),
      setXp: (totalXp) =>
        persistAndRefresh({
          ...this.save.snapshot,
          totalXp: Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0,
        }),
      addItem: (category, itemId, count = 1) => {
        let updated = this.save.snapshot;
        for (let index = 0; index < Math.max(0, Math.floor(count)); index += 1) {
          const alreadyOwned = (updated.inventory[category][itemId] ?? 0) > 0;
          updated = withCollectionItem(updated, category, itemId);
          if (alreadyOwned) {
            updated = withUpgradeLevel(
              updated,
              category,
              itemId,
              collectionConfig.maxDuplicateUpgradeLevel,
            );
          }
        }
        return persistAndRefresh(updated);
      },
      setSkillRank: (skillId, rank) =>
        persistAndRefresh({
          ...this.save.snapshot,
          skillRanks: { ...this.save.skillRanks, [skillId]: Math.max(0, Math.floor(rank)) },
        }),
      reset: async () => {
        await this.save.replace(createEmptySave());
        await this.ensureStarterCollection();
        this.build.applyCollectionOwnership(this.save.inventory);
        this.skills.load(this.save.skillRanks, this.earnedSkillPoints());
        this.applySkillBonuses();
        this.refreshCollection();
        return this.save.snapshot;
      },
    });
  }

  private refreshCollection(message = ""): void {
    const progress = resolveLevel(this.save.totalXp, progressionConfig);
    const entries: CollectionProfileView["entries"] = [
      ...launcherCatalog.map((launcher) => ({
        category: "launchers" as const,
        id: launcher.id,
        name: launcher.displayName,
        count: this.save.inventory.launchers[launcher.id] ?? 0,
        available: (this.save.inventory.launchers[launcher.id] ?? 0) > 0,
        upgradeLevel: this.save.upgrades.launchers[launcher.id] ?? 0,
        stats: [
          `Impulsion ${Math.round(launcherConfig.maxLaunchImpulse * launcher.launchImpulseScale * upgradeMultiplier(this.save.upgrades.launchers[launcher.id] ?? 0))} N.s`,
          `Bonus lancement +${Math.round((upgradeMultiplier(this.save.upgrades.launchers[launcher.id] ?? 0) - 1) * 100)} %`,
          `Plafond vitesse ${launcher.maxLaunchSpeed} m/s`,
          `Amplitude ${launcherConfig.horizontalAmplitudeDeg}° / ${launcherConfig.verticalAmplitudeDeg}°`,
        ],
      })),
      ...characterCatalog.map((character) => ({
        category: "characters" as const,
        id: character.id,
        name: character.displayName,
        count: this.save.inventory.characters[character.id] ?? 0,
        available: (this.save.inventory.characters[character.id] ?? 0) > 0,
        upgradeLevel: this.save.upgrades.characters[character.id] ?? 0,
        stats: [
          `Masse ${Math.round(totalMassOf(character.ragdoll) * character.massScale)} kg`,
          `Rebond ${(character.restitution * upgradeMultiplier(this.save.upgrades.characters[character.id] ?? 0)).toFixed(2)}`,
          `Friction ${character.friction.toFixed(2)}`,
          `Score x${upgradeMultiplier(this.save.upgrades.characters[character.id] ?? 0).toFixed(2)} | ${describePassive(character.passive)}`,
        ],
      })),
      ...itemCatalog.map((item) => ({
        category: "items" as const,
        id: item.id,
        name: item.displayName,
        count: this.save.inventory.items[item.id] ?? 0,
        available: (this.save.inventory.items[item.id] ?? 0) > 0,
        upgradeLevel: this.save.upgrades.items[item.id] ?? 0,
        stats: [
          `Masse x${item.massScale.toFixed(2)}`,
          `Lancement x${(item.launchImpulseScale * upgradeMultiplier(this.save.upgrades.items[item.id] ?? 0)).toFixed(2)}`,
          `Passif ${describePassive(item.passive)}`,
          `Capacite ${item.ability ? `${item.ability.displayName} x${upgradeMultiplier(this.save.upgrades.items[item.id] ?? 0).toFixed(2)}` : "Aucune"}`,
        ],
      })),
    ];
    this.hud.renderCollection(
      {
        currency: this.save.currency,
        totalXp: this.save.totalXp,
        playerLevel: progress.level,
        xpIntoLevel: progress.xpIntoLevel,
        xpForNextLevel: progress.xpForNextLevel,
        gachaCost: collectionConfig.gachaCost,
        entries,
        levels: levelCatalog.map((level, index) => ({
          index,
          name: level.displayName,
          targetScore: level.targetScore,
          bestScore: this.save.getBestScore(level.id),
          unlocked: index < unlockedLevelCount(levelCatalog, this.save.bestScores),
        })),
      },
      message,
    );
  }

  private equipCollection(category: CollectionCategory, id: string): void {
    if (this.level?.shots.currentState !== "Aiming") {
      this.refreshCollection("Equipement disponible uniquement pendant la visee");
      return;
    }
    if (this.build.equip(category, id)) {
      this.refreshCollection(`${collectionName(category, id)} equipe`);
    }
  }

  private nextLevelIsUnlocked(): boolean {
    if (this.sessionMode !== "campaign") {
      return false;
    }
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

  private toggleCheat(): void {
    if (this.level?.shots.currentState !== "Aiming" || this.sessionMode === "free") {
      return;
    }
    this.cheatEnabled = !this.cheatEnabled;
    this.sessionMode = this.cheatEnabled ? "cheat" : this.baseSessionMode;
    this.hud.showSecret(
      this.cheatEnabled
        ? "Mode triche active : lancez un personnage, puis utilisez la bombe atomique."
        : "Mode triche desactive.",
    );
  }

  private activateCheat(): void {
    if (!this.cheatEnabled) {
      this.hud.showSecret("Activez d'abord le mode triche.");
      return;
    }
    if (this.level?.shots.currentState === "Aiming") {
      this.hud.showSecret("Lancez d'abord un personnage pour utiliser la bombe atomique.");
      return;
    }
    if (this.abilityController?.activateCheat()) {
      this.hud.showSecret("Bravo, vous etes le plus fort. Vous avez gagne.");
    } else {
      this.hud.showSecret("La bombe atomique a deja ete utilisee pour ce tir.");
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
    const aimTarget = level.destruction.getAimTarget(trajectory.impactMesh);

    level.preview.setVisible(isAiming && !level.shots.isSessionComplete);
    if (isAiming) {
      level.preview.update(trajectory);
      level.preview.setTarget(aimTarget);
    }

    this.hud.setActionMode(level.shots.canEndManually ? "end" : "launch");
    this.hud.setActionEnabled(level.shots.canLaunch || level.shots.canEndManually);
    this.hud.setPowerEnabled(isAiming && !level.shots.isSessionComplete);
    this.hud.setBuildEnabled(isAiming && !level.shots.isSessionComplete);
    this.hud.setBuild({
      launcherLabel: this.build.launcher.displayName,
      characterLabel: this.build.character.displayName,
      itemLabel: this.build.item.displayName,
      passivesLabel: `${describePassive(this.build.character.passive)} / ${describePassive(this.build.item.passive)}`,
    });
    this.refreshAbilityHud(isAiming);
    this.hud.setCheatEnabled(
      this.cheatEnabled,
      !isAiming && this.sessionMode === "cheat" && level.shots.canEndManually,
    );
    this.hud.setSkillButtonLabel(this.skills.availablePoints);
    if (this.hud.skillPanelOpen) {
      this.hud.renderSkills(
        this.skills.statuses,
        this.skills.availablePoints,
        describeBonuses(this.skills.bonuses),
      );
    }
    this.hud.setStatus(this.buildStatusLines(trajectory.range, aimTarget).join("\n"));
  }

  private buildStatusLines(
    range: number,
    aimTarget: ReturnType<DestructionService["getAimTarget"]>,
  ): string[] {
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
      `${ambienceLabel(this.ambience)} - effets visuels`,
      `Score : ${total} / ${level.blockout.targetScore}`,
      `Tirs restants : ${level.shots.shotsRemaining} / ${level.blockout.shotsAllowed}`,
      `Objets detruits : ${level.destruction.destroyedCount} / ${level.destruction.totalCount}`,
      `Secrets : ${level.secrets.discoveredCount} / ${level.secrets.totalCount}`,
    ];

    if (level.shots.currentState === "Aiming" && aimTarget) {
      lines.push(
        `Cible : ${aimTarget.displayName} - ${damageStateLabel(aimTarget.state)} (${aimTarget.totalStages - aimTarget.remainingStages}/${aimTarget.totalStages} degats)`,
      );
    }

    if (this.combo.currentChain > 1) {
      lines.push(`Combo x${this.combo.currentMultiplier} (${this.combo.currentChain} destructions)`);
    }

    const bonuses = describeBonuses(this.skills.bonuses);
    if (bonuses.length > 0) {
      lines.push(`Competences : ${bonuses.join(" - ")}`);
    }

    lines.push(
      level.shots.currentState === "Aiming"
        ? `Angle ${level.aiming.getPitchDeg().toFixed(0)} deg - portee ${range.toFixed(0)} m`
        : "Clic-glisser pour regarder autour, Espace pour terminer le tir.",
    );
    return lines;
  }

  private refreshAbilityHud(isAiming: boolean): void {
    const configured = this.build.ability;
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
        this.abilityController?.beginShot(this.build.ability, character);
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

  private startFreeLevel(index: number): void {
    if (this.level?.shots.currentState !== "Aiming") {
      this.refreshCollection("Selection disponible uniquement pendant la visee");
      return;
    }
    if (index < 0 || index >= unlockedLevelCount(levelCatalog, this.save.bestScores)) {
      this.refreshCollection("Niveau encore verrouille");
      return;
    }
    this.hud.setCollectionVisible(false);
    this.loadLevel(index, "free");
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

function ambienceLabel(ambience: AmbienceSelection | undefined): string {
  if (!ambience) {
    return "Ambiance standard";
  }
  const weather: Record<AmbienceSelection["weather"], string> = {
    sunny: "Soleil",
    cloudy: "Nuages",
    rain: "Pluie",
    fog: "Brouillard",
  };
  const timeOfDay: Record<AmbienceSelection["timeOfDay"], string> = {
    dawn: "Aube",
    day: "Jour",
    dusk: "Crepuscule",
    night: "Nuit",
  };
  return `${weather[ambience.weather]} / ${timeOfDay[ambience.timeOfDay]}`;
}

function collectionName(category: CollectionCategory, id: string): string {
  const catalog =
    category === "launchers"
      ? launcherCatalog
      : category === "characters"
        ? characterCatalog
        : itemCatalog;
  return catalog.find((entry) => entry.id === id)?.displayName ?? id;
}
