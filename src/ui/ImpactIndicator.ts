import { AdvancedDynamicTexture, Control, Rectangle, StackPanel, TextBlock } from "@babylonjs/gui";
import type { ImpactReport } from "../game/destruction/DestructionService";

const VISIBLE_MS = 1400;
const FADE_MS = 700;

const COLOR_DESTROYED = "#ff6b4a";
const COLOR_DAMAGED = "#ffd24a";
const COLOR_IGNORED = "#9aa7bd";

/**
 * Indicateur d'impact (spec 14) : intensite du choc, seuil de la cible et resultat.
 * Il s'efface tout seul pour ne pas masquer l'action (spec 13.3).
 */
export class ImpactIndicator {
  private readonly panel: Rectangle;
  private readonly targetText: TextBlock;
  private readonly intensityText: TextBlock;
  private readonly outcomeText: TextBlock;
  private remainingMs = 0;

  constructor(texture: AdvancedDynamicTexture) {
    this.panel = new Rectangle("impactPanel");
    this.panel.width = "280px";
    this.panel.height = "108px";
    this.panel.thickness = 0;
    this.panel.cornerRadius = 10;
    this.panel.background = "#10131acc";
    this.panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.panel.paddingTop = "16px";
    this.panel.paddingRight = "16px";
    this.panel.alpha = 0;
    this.panel.isPointerBlocker = false;
    texture.addControl(this.panel);

    const stack = new StackPanel("impactStack");
    stack.paddingTop = "10px";
    this.panel.addControl(stack);

    this.targetText = createLine(18, "#f2f4f8");
    this.intensityText = createLine(28, "#f2f4f8");
    this.outcomeText = createLine(18, COLOR_IGNORED);
    stack.addControl(this.targetText);
    stack.addControl(this.intensityText);
    stack.addControl(this.outcomeText);
  }

  show(report: ImpactReport): void {
    this.targetText.text = report.targetName;
    this.intensityText.text = `${report.intensity.toFixed(0)} / ${report.threshold}`;
    this.intensityText.color = report.qualifies ? COLOR_DAMAGED : COLOR_IGNORED;

    if (report.destroyed) {
      this.outcomeText.text = "Detruit";
      this.outcomeText.color = COLOR_DESTROYED;
    } else if (report.qualifies) {
      this.outcomeText.text = `Endommage (${report.state})`;
      this.outcomeText.color = COLOR_DAMAGED;
    } else {
      this.outcomeText.text = "Impact trop faible";
      this.outcomeText.color = COLOR_IGNORED;
    }

    this.remainingMs = VISIBLE_MS + FADE_MS;
  }

  update(deltaMs: number): void {
    if (this.remainingMs <= 0) {
      return;
    }
    this.remainingMs = Math.max(0, this.remainingMs - deltaMs);
    this.panel.alpha = Math.min(1, this.remainingMs / FADE_MS);
  }

  clear(): void {
    this.remainingMs = 0;
    this.panel.alpha = 0;
  }
}

function createLine(fontSize: number, color: string): TextBlock {
  const text = new TextBlock();
  text.height = `${fontSize + 12}px`;
  text.fontSize = fontSize;
  text.color = color;
  return text;
}
