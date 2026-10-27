import type { Scene } from "@babylonjs/core";
import {
  AdvancedDynamicTexture,
  Button,
  Control,
  Rectangle,
  Slider,
  StackPanel,
  TextBlock,
} from "@babylonjs/gui";
import { aimConfig } from "../data/config/gameplayConfig";
import type { ImpactReport } from "../game/destruction/DestructionService";
import { ImpactIndicator } from "./ImpactIndicator";
import { ResultsPanel, type SessionResults } from "./ResultsPanel";
import { SkillPanel } from "./SkillPanel";
import type { SkillNodeStatus } from "../game/skill/SkillTreeService";
import { CollectionPanel, type CollectionProfileView } from "./CollectionPanel";
import type { CollectionCategory } from "../game/save/saveSchema";
import type { QuestStatus } from "../game/quest/questMath";

export interface PrototypeHudActions {
  readonly onLaunch: () => void;
  readonly onEndShot: () => void;
  readonly onReset: () => void;
  readonly onNextLevel: () => void;
  readonly onPowerChanged: (ratio: number) => void;
  readonly onCycleCharacter: () => void;
  readonly onCycleItem: () => void;
  readonly onCycleLauncher: () => void;
  readonly onActivateAbility: () => void;
  readonly onUpgradeSkill: (nodeId: string) => void;
  readonly onDrawCollection: (category: CollectionCategory) => void;
  readonly onBuyItem: (id: string) => void;
  readonly onEquipCollection: (category: CollectionCategory, id: string) => void;
  readonly onSelectLevel: (index: number) => void;
  readonly onToggleCheat: () => void;
  readonly onActivateCheat: () => void;
}

export interface BuildSummary {
  readonly launcherLabel: string;
  readonly characterLabel: string;
  readonly itemLabel: string;
  readonly itemUses: number | null;
  readonly passivesLabel: string;
}
export type HudActionMode = "launch" | "end";

/** HUD provisoire de la Phase 1. Textes joueur en francais (spec 15.6). */
export class PrototypeHud {
  private readonly texture: AdvancedDynamicTexture;
  private readonly statusPanel: Rectangle;
  private readonly statusText: TextBlock;
  private readonly scorePanel: Rectangle;
  private readonly scoreText: TextBlock;
  private readonly questPanel: Rectangle;
  private readonly questText: TextBlock;
  private readonly buildCard: Rectangle;
  private readonly powerLabel: TextBlock;
  private readonly powerSlider: Slider;
  private readonly actionButton: Button;
  private readonly impactIndicator: ImpactIndicator;
  private readonly resultsPanel: ResultsPanel;
  private readonly buildPanel: StackPanel;
  private readonly characterButton: Button;
  private readonly itemButton: Button;
  private readonly launcherButton: Button;
  private readonly passivesText: TextBlock;
  private readonly abilityButton: Button;
  private readonly secretText: TextBlock;
  private readonly skillPanel: SkillPanel;
  private readonly skillButton: Button;
  private readonly collectionPanel: CollectionPanel;
  private readonly collectionButton: Button;
  private readonly cheatToggleButton: Button;
  private readonly cheatButton: Button;
  private secretMs = 0;
  private actionMode: HudActionMode = "launch";

  constructor(scene: Scene, actions: PrototypeHudActions) {
    this.texture = AdvancedDynamicTexture.CreateFullscreenUI("chaosUi", true, scene);
    this.texture.idealWidth = 1280;
    this.texture.idealHeight = 720;
    this.texture.useSmallestIdeal = true;

    this.statusPanel = new Rectangle("statusPanel");
    this.statusPanel.width = "320px";
    this.statusPanel.height = "190px";
    this.statusPanel.thickness = 2;
    this.statusPanel.color = "#8db6ce";
    this.statusPanel.cornerRadius = 6;
    this.statusPanel.background = "#13243bd9";
    this.statusPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.statusPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.statusPanel.left = "16px";
    this.statusPanel.top = "16px";
    this.statusPanel.isPointerBlocker = false;
    this.texture.addControl(this.statusPanel);

    this.statusText = new TextBlock("statusText");
    this.statusText.color = "#ffffff";
    this.statusText.fontSize = 15;
    this.statusText.fontWeight = "bold";
    this.statusText.outlineColor = "#122033";
    this.statusText.outlineWidth = 5;
    this.statusText.width = "300px";
    this.statusText.height = "270px";
    this.statusText.textWrapping = true;
    this.statusText.left = "28px";
    this.statusText.top = "24px";
    this.statusText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.statusText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.statusText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.statusText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.texture.addControl(this.statusText);

    this.scorePanel = new Rectangle("scorePanel");
    this.scorePanel.width = "190px";
    this.scorePanel.height = "74px";
    this.scorePanel.thickness = 2;
    this.scorePanel.color = "#8db6ce";
    this.scorePanel.cornerRadius = 6;
    this.scorePanel.background = "#13243bd9";
    this.scorePanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.scorePanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.scorePanel.top = "72px";
    this.scorePanel.paddingRight = "16px";
    this.scorePanel.isPointerBlocker = false;
    this.texture.addControl(this.scorePanel);

    this.scoreText = new TextBlock("scoreText");
    this.scoreText.color = "#ffcb2f";
    this.scoreText.fontSize = 20;
    this.scoreText.fontWeight = "bold";
    this.scoreText.outlineColor = "#122033";
    this.scoreText.outlineWidth = 4;
    this.scoreText.width = "176px";
    this.scoreText.height = "66px";
    this.scoreText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.scoreText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.scorePanel.addControl(this.scoreText);

    this.questPanel = new Rectangle("questPanel");
    this.questPanel.width = "300px";
    this.questPanel.height = "116px";
    this.questPanel.thickness = 2;
    this.questPanel.color = "#8db6ce";
    this.questPanel.cornerRadius = 6;
    this.questPanel.background = "#13243bd9";
    this.questPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.questPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.questPanel.top = "160px";
    this.questPanel.paddingRight = "16px";
    this.questPanel.isPointerBlocker = false;
    this.texture.addControl(this.questPanel);

    this.questText = new TextBlock("questText");
    this.questText.color = "#ffffff";
    this.questText.fontSize = 14;
    this.questText.fontWeight = "bold";
    this.questText.outlineColor = "#122033";
    this.questText.outlineWidth = 3;
    this.questText.width = "280px";
    this.questText.height = "104px";
    this.questText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.questText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.questPanel.addControl(this.questText);

    const bottomPanel = new StackPanel("bottomPanel");
    bottomPanel.width = "360px";
    bottomPanel.height = "180px";
    bottomPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    bottomPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    bottomPanel.paddingRight = "24px";
    bottomPanel.paddingBottom = "24px";
    this.texture.addControl(bottomPanel);

    this.powerLabel = new TextBlock("powerLabel");
    this.powerLabel.height = "32px";
    this.powerLabel.color = "#ffffff";
    this.powerLabel.fontSize = 20;
    this.powerLabel.fontWeight = "bold";
    this.powerLabel.outlineColor = "#122033";
    this.powerLabel.outlineWidth = 4;
    bottomPanel.addControl(this.powerLabel);

    this.powerSlider = new Slider("powerSlider");
    this.powerSlider.minimum = aimConfig.minPowerRatio;
    this.powerSlider.maximum = 1;
    this.powerSlider.value = aimConfig.defaultPowerRatio;
    this.powerSlider.width = "340px";
    this.powerSlider.height = "30px";
    this.powerSlider.color = "#ffca28";
    this.powerSlider.background = "#263b53";
    this.powerSlider.borderColor = "#0d1928";
    this.powerSlider.thumbWidth = "24px";
    this.powerSlider.isThumbCircle = true;
    this.powerSlider.paddingBottom = "16px";
    this.powerSlider.onValueChangedObservable.add((value) => {
      this.powerLabel.text = formatPower(value);
      actions.onPowerChanged(value);
    });
    bottomPanel.addControl(this.powerSlider);

    const buttonRow = new StackPanel("buttonRow");
    buttonRow.isVertical = false;
    buttonRow.height = "70px";
    bottomPanel.addControl(buttonRow);

    buttonRow.addControl(this.createButton("launchButton", "LANCER", "#ffbd19", () => {
      if (this.actionMode === "launch") {
        actions.onLaunch();
      } else {
        actions.onEndShot();
      }
    }));
    this.actionButton = buttonRow.children[0] as Button;
    this.actionButton.width = "165px";
    const resetButton = this.createButton("resetButton", "REJOUER", "#29435d", actions.onReset);
    resetButton.width = "165px";
    buttonRow.addControl(resetButton);

    this.powerLabel.text = formatPower(this.powerSlider.value);
    this.impactIndicator = new ImpactIndicator(this.texture);
    this.resultsPanel = new ResultsPanel(this.texture, actions.onReset, actions.onNextLevel);

    this.secretText = new TextBlock("secretText");
    this.secretText.height = "40px";
    this.secretText.fontSize = 26;
    this.secretText.color = "#ffd24a";
    this.secretText.outlineColor = "#10131a";
    this.secretText.outlineWidth = 5;
    this.secretText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.secretText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.secretText.paddingTop = "120px";
    this.secretText.alpha = 0;
    this.texture.addControl(this.secretText);

    this.skillPanel = new SkillPanel(this.texture, actions.onUpgradeSkill, () =>
      this.skillPanel.setVisible(false),
    );

    this.skillButton = this.createButton("skillButton", "COMPETENCES", "#2f6686", () =>
      this.skillPanel.setVisible(!this.skillPanel.isVisible),
    );
    this.skillButton.width = "200px";
    this.skillButton.height = "44px";
    // En haut a gauche sous le bandeau d'etat : la zone haut-droite est occupee par
    // l'indicateur d'impact, qui intercepterait le clic.
    this.skillButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.skillButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.skillButton.left = "16px";
    this.skillButton.top = "320px";
    this.texture.addControl(this.skillButton);

    this.collectionPanel = new CollectionPanel(
      this.texture,
      actions.onDrawCollection,
      actions.onBuyItem,
      actions.onEquipCollection,
      actions.onSelectLevel,
      () => this.collectionPanel.setVisible(false),
    );
    this.collectionButton = this.createButton("collectionButton", "COLLECTION", "#2f6686", () =>
      this.collectionPanel.setVisible(!this.collectionPanel.isVisible),
    );
    this.collectionButton.width = "200px";
    this.collectionButton.height = "44px";
    this.collectionButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.collectionButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.collectionButton.left = "16px";
    this.collectionButton.top = "370px";
    this.texture.addControl(this.collectionButton);

    this.cheatToggleButton = this.createButton("cheatToggleButton", "Triche : desactivee", "#6b3f3f", actions.onToggleCheat);
    this.cheatToggleButton.width = "220px";
    this.cheatToggleButton.height = "44px";
    this.cheatToggleButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.cheatToggleButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.cheatToggleButton.paddingRight = "16px";
    this.cheatToggleButton.paddingTop = "16px";
    this.texture.addControl(this.cheatToggleButton);

    this.cheatButton = this.createButton(
      "cheatButton",
      "Bombe atomique (apres lancer)",
      "#8f3f3f",
      actions.onActivateCheat,
    );
    this.cheatButton.width = "240px";
    this.cheatButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.cheatButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.cheatButton.paddingRight = "16px";
    this.cheatButton.top = "-88px";
    this.cheatButton.zIndex = 10;
    this.cheatButton.isVisible = false;
    this.texture.addControl(this.cheatButton);

    this.buildCard = new Rectangle("buildCard");
    this.buildCard.width = "250px";
    this.buildCard.height = "270px";
    this.buildCard.thickness = 2;
    this.buildCard.color = "#8db6ce";
    this.buildCard.cornerRadius = 6;
    this.buildCard.background = "#13243bd9";
    this.buildCard.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.buildCard.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.buildCard.paddingLeft = "16px";
    this.buildCard.paddingBottom = "16px";
    this.texture.addControl(this.buildCard);

    this.buildPanel = new StackPanel("buildPanel");
    this.buildPanel.width = "250px";
    this.buildPanel.height = "250px";
    this.buildCard.addControl(this.buildPanel);

    const buildTitle = new TextBlock("buildTitle", "BUILD DU TIR");
    buildTitle.height = "28px";
    buildTitle.color = "#ffcb2f";
    buildTitle.fontSize = 17;
    buildTitle.fontWeight = "bold";
    buildTitle.outlineColor = "#122033";
    buildTitle.outlineWidth = 3;
    this.buildPanel.addControl(buildTitle);

    this.characterButton = this.createButton(
      "characterButton",
      "Personnage",
      "#315c78",
      actions.onCycleCharacter,
    );
    this.itemButton = this.createButton("itemButton", "Objet", "#315c78", actions.onCycleItem);
    this.characterButton.width = "220px";
    this.itemButton.width = "220px";
    this.characterButton.height = "50px";
    this.itemButton.height = "50px";
    this.characterButton.paddingBottom = "8px";
    this.itemButton.paddingBottom = "8px";
    this.buildPanel.addControl(this.characterButton);
    this.buildPanel.addControl(this.itemButton);

    this.passivesText = new TextBlock("passivesText");
    this.passivesText.height = "26px";
    this.passivesText.fontSize = 16;
    this.passivesText.color = "#ffd24a";
    this.passivesText.outlineColor = "#10131a";
    this.passivesText.outlineWidth = 4;
    this.buildPanel.addControl(this.passivesText);

    this.abilityButton = this.createButton(
      "abilityButton",
      "Capacite",
      "#e87925",
      actions.onActivateAbility,
    );
    this.abilityButton.width = "240px";
    this.abilityButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.abilityButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.abilityButton.paddingRight = "16px";
    this.abilityButton.paddingBottom = "24px";
    this.abilityButton.isVisible = false;
    this.texture.addControl(this.abilityButton);
    this.launcherButton = this.createButton("launcherButton", "Lanceur", "#315c78", actions.onCycleLauncher);
    this.launcherButton.width = "220px";
    this.launcherButton.height = "50px";
    this.launcherButton.paddingBottom = "8px";
    this.buildPanel.addControl(this.launcherButton);
  }

  /** `label` a null masque le bouton : l'objet equipe n'a pas de capacite active. */
  setAbility(label: string | null, enabled: boolean): void {
    this.abilityButton.isVisible = label !== null;
    if (label === null) {
      return;
    }
    setButtonLabel(this.abilityButton, label);
    this.abilityButton.isEnabled = enabled;
    this.abilityButton.alpha = enabled ? 1 : 0.45;
  }

  setCheatEnabled(enabled: boolean, canActivate: boolean): void {
    setButtonLabel(this.cheatToggleButton, enabled ? "Triche : activee" : "Triche : desactivee");
    this.cheatToggleButton.background = enabled ? "#8f3f3f" : "#6b3f3f";
    this.cheatButton.isVisible = enabled;
    this.cheatButton.isEnabled = canActivate;
    this.cheatButton.alpha = canActivate ? 1 : 0.45;
  }

  setBuild(summary: BuildSummary): void {
    setButtonLabel(this.characterButton, summary.characterLabel);
    setButtonLabel(
      this.itemButton,
      summary.itemUses === null ? summary.itemLabel : `${summary.itemLabel} (${summary.itemUses})`,
    );
    this.passivesText.text = summary.passivesLabel;
    setButtonLabel(this.launcherButton, summary.launcherLabel);
  }

  setBuildEnabled(enabled: boolean): void {
    this.buildPanel.alpha = enabled ? 1 : 0.4;
    this.characterButton.isEnabled = enabled;
    this.itemButton.isEnabled = enabled;
  }

  get skillPanelOpen(): boolean {
    return this.skillPanel.isVisible;
  }

  renderSkills(
    statuses: readonly SkillNodeStatus[],
    availablePoints: number,
    activeBonuses: readonly string[],
  ): void {
    this.skillPanel.render(statuses, availablePoints, activeBonuses);
  }

  setSkillButtonLabel(availablePoints: number): void {
    setButtonLabel(
      this.skillButton,
      availablePoints > 0 ? `Competences (${availablePoints})` : "Competences",
    );
  }

  renderCollection(profile: CollectionProfileView, message?: string): void {
    this.collectionPanel.renderProfile(profile, message);
  }

  setCollectionVisible(visible: boolean): void {
    this.collectionPanel.setVisible(visible);
  }

  showResults(results: SessionResults): void {
    this.impactIndicator.clear();
    this.resultsPanel.show(results);
  }

  hideResults(): void {
    this.resultsPanel.hide();
  }

  showImpact(report: ImpactReport): void {
    this.impactIndicator.show(report);
  }

  clearImpact(): void {
    this.impactIndicator.clear();
  }

  update(deltaMs: number): void {
    this.impactIndicator.update(deltaMs);
    if (this.secretMs > 0) {
      this.secretMs = Math.max(0, this.secretMs - deltaMs);
      this.secretText.alpha = Math.min(1, this.secretMs / 600);
    }
  }

  showSecret(name: string): void {
    this.secretText.text = `Secret decouvert : ${name}`;
    this.secretMs = name.includes("Back Rooms") ? 6000 : 2600;
  }

  setActionMode(mode: HudActionMode): void {
    if (mode === this.actionMode) {
      return;
    }
    this.actionMode = mode;
    const label = this.actionButton.textBlock;
    if (label) {
      label.text = mode === "launch" ? "Lancer" : "Terminer le tir";
    }
    this.actionButton.background = mode === "launch" ? "#ffbd19" : "#2f8a65";
  }

  setPowerEnabled(enabled: boolean): void {
    this.powerSlider.isEnabled = enabled;
    this.powerSlider.alpha = enabled ? 1 : 0.45;
  }

  setActionEnabled(enabled: boolean): void {
    this.actionButton.isEnabled = enabled;
    this.actionButton.alpha = enabled ? 1 : 0.45;
  }

  setStatus(message: string): void {
    this.statusText.text = message;
    const lineCount = message.split("\n").length;
    const height = Math.max(190, lineCount * 19 + 20);
    this.statusPanel.height = `${height}px`;
    this.statusText.height = `${height - 20}px`;
  }

  setScore(score: number, target: number): void {
    this.scoreText.text = `SCORE\n${score.toLocaleString("fr-FR")} / ${target.toLocaleString("fr-FR")}`;
  }

  setQuests(statuses: readonly QuestStatus[]): void {
    this.questText.text = [
      "QUETES",
      ...statuses.slice(0, 3).map((status) => {
        const marker = status.completed
          ? status.current >= status.definition.targetValue
            ? "OK"
            : "FAIT"
          : "-";
        return `${marker} ${status.definition.name} ${status.current}/${status.definition.targetValue}`;
      }),
    ].join("\n");
  }

  setPower(ratio: number): void {
    this.powerSlider.value = ratio;
    this.powerLabel.text = formatPower(ratio);
  }

  dispose(): void {
    this.texture.dispose();
  }

  private createButton(name: string, label: string, color: string, onClick: () => void): Button {
    const button = Button.CreateSimpleButton(name, label);
    button.width = "200px";
    button.height = "56px";
    button.paddingLeft = "12px";
    button.paddingRight = "12px";
    button.color = "#ffffff";
    button.background = color;
    button.cornerRadius = 6;
    button.thickness = 2;
    button.fontSize = 18;
    button.fontWeight = "bold";
    if (button.textBlock) {
      button.textBlock.outlineColor = "#101d2d";
      button.textBlock.outlineWidth = 2;
    }
    button.onPointerClickObservable.add(() => onClick());
    return button;
  }
}

function formatPower(ratio: number): string {
  return `Puissance : ${Math.round(ratio * 100)} %`;
}

function setButtonLabel(button: Button, label: string): void {
  if (button.textBlock) {
    button.textBlock.text = label;
  }
}
