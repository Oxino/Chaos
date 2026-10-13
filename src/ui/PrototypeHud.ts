import type { Scene } from "@babylonjs/core";
import {
  AdvancedDynamicTexture,
  Button,
  Control,
  Slider,
  StackPanel,
  TextBlock,
} from "@babylonjs/gui";
import { aimConfig } from "../data/config/gameplayConfig";
import type { ImpactReport } from "../game/destruction/DestructionService";
import { ImpactIndicator } from "./ImpactIndicator";
import { ResultsPanel, type SessionResults } from "./ResultsPanel";

export interface PrototypeHudActions {
  readonly onLaunch: () => void;
  readonly onEndShot: () => void;
  readonly onReset: () => void;
  readonly onPowerChanged: (ratio: number) => void;
}
export type HudActionMode = "launch" | "end";

/** HUD provisoire de la Phase 1. Textes joueur en francais (spec 15.6). */
export class PrototypeHud {
  private readonly texture: AdvancedDynamicTexture;
  private readonly statusText: TextBlock;
  private readonly powerLabel: TextBlock;
  private readonly powerSlider: Slider;
  private readonly actionButton: Button;
  private readonly impactIndicator: ImpactIndicator;
  private readonly resultsPanel: ResultsPanel;
  private actionMode: HudActionMode = "launch";

  constructor(scene: Scene, actions: PrototypeHudActions) {
    this.texture = AdvancedDynamicTexture.CreateFullscreenUI("chaosUi", true, scene);

    this.statusText = new TextBlock("statusText");
    this.statusText.color = "#f2f4f8";
    this.statusText.fontSize = 20;
    this.statusText.outlineColor = "#10131a";
    this.statusText.outlineWidth = 4;
    this.statusText.width = "640px";
    this.statusText.height = "150px";
    this.statusText.paddingLeft = "16px";
    this.statusText.paddingTop = "16px";
    this.statusText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.statusText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.statusText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.statusText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.texture.addControl(this.statusText);

    const bottomPanel = new StackPanel("bottomPanel");
    bottomPanel.width = "520px";
    bottomPanel.height = "180px";
    bottomPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    bottomPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    bottomPanel.paddingBottom = "24px";
    this.texture.addControl(bottomPanel);

    this.powerLabel = new TextBlock("powerLabel");
    this.powerLabel.height = "32px";
    this.powerLabel.color = "#f2f4f8";
    this.powerLabel.fontSize = 20;
    this.powerLabel.outlineColor = "#10131a";
    this.powerLabel.outlineWidth = 4;
    bottomPanel.addControl(this.powerLabel);

    this.powerSlider = new Slider("powerSlider");
    this.powerSlider.minimum = aimConfig.minPowerRatio;
    this.powerSlider.maximum = 1;
    this.powerSlider.value = aimConfig.defaultPowerRatio;
    this.powerSlider.width = "480px";
    this.powerSlider.height = "30px";
    this.powerSlider.color = "#e8613c";
    this.powerSlider.background = "#2a3142";
    this.powerSlider.borderColor = "#10131a";
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

    buttonRow.addControl(this.createButton("launchButton", "Lancer", "#e8613c", () => {
      if (this.actionMode === "launch") {
        actions.onLaunch();
      } else {
        actions.onEndShot();
      }
    }));
    this.actionButton = buttonRow.children[0] as Button;
    buttonRow.addControl(
      this.createButton("resetButton", "Reinitialiser", "#4a5873", actions.onReset),
    );

    this.powerLabel.text = formatPower(this.powerSlider.value);
    this.impactIndicator = new ImpactIndicator(this.texture);
    this.resultsPanel = new ResultsPanel(this.texture, actions.onReset);
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
    this.actionButton.background = mode === "launch" ? "#e8613c" : "#3f8f6b";
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
    button.cornerRadius = 10;
    button.thickness = 0;
    button.fontSize = 20;
    button.onPointerClickObservable.add(() => onClick());
    return button;
  }
}

function formatPower(ratio: number): string {
  return `Puissance : ${Math.round(ratio * 100)} %`;
}
