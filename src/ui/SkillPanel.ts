import {
  type AdvancedDynamicTexture,
  Button,
  Control,
  Rectangle,
  ScrollViewer,
  StackPanel,
  TextBlock,
} from "@babylonjs/gui";
import type { SkillNodeStatus } from "../game/skill/SkillTreeService";

const BRANCH_LABELS: Record<string, string> = {
  propulsion: "Propulsion",
  impact: "Impact",
  bounce: "Rebond",
  explosive: "Explosifs",
  chaos: "Chaos",
};

const BLOCKER_LABELS: Record<string, string> = {
  maxRank: "Rang max",
  prerequisite: "Prerequis manquant",
  points: "Points insuffisants",
};

/** Arbre de competences depensable (spec 9.2). */
export class SkillPanel {
  private readonly panel: Rectangle;
  private readonly pointsText: TextBlock;
  private readonly list: StackPanel;
  private readonly rows: { container: StackPanel; label: TextBlock; button: Button }[] = [];

  constructor(
    texture: AdvancedDynamicTexture,
    private readonly onUpgrade: (nodeId: string) => void,
    onClose: () => void,
  ) {
    this.panel = new Rectangle("skillPanel");
    this.panel.width = "560px";
    this.panel.height = "600px";
    this.panel.thickness = 0;
    this.panel.cornerRadius = 16;
    this.panel.background = "#10131aee";
    this.panel.isVisible = false;
    texture.addControl(this.panel);

    const layout = new StackPanel("skillLayout");
    layout.paddingTop = "18px";
    this.panel.addControl(layout);

    const title = new TextBlock("skillTitle");
    title.text = "Competences";
    title.height = "36px";
    title.fontSize = 26;
    title.color = "#ffd24a";
    layout.addControl(title);

    this.pointsText = new TextBlock("skillPoints");
    this.pointsText.height = "32px";
    this.pointsText.fontSize = 19;
    this.pointsText.color = "#5fd38d";
    layout.addControl(this.pointsText);

    const scroll = new ScrollViewer("skillScroll");
    scroll.width = "520px";
    scroll.height = "440px";
    scroll.thickness = 0;
    scroll.barSize = 12;
    layout.addControl(scroll);

    this.list = new StackPanel("skillList");
    this.list.isVertical = true;
    scroll.addControl(this.list);

    const close = Button.CreateSimpleButton("skillClose", "Fermer");
    close.width = "180px";
    close.height = "48px";
    close.paddingTop = "12px";
    close.color = "#ffffff";
    close.background = "#4a5873";
    close.cornerRadius = 10;
    close.thickness = 0;
    close.fontSize = 19;
    close.onPointerClickObservable.add(() => onClose());
    layout.addControl(close);
  }

  get isVisible(): boolean {
    return this.panel.isVisible;
  }

  setVisible(visible: boolean): void {
    this.panel.isVisible = visible;
  }

  render(statuses: readonly SkillNodeStatus[], availablePoints: number): void {
    this.pointsText.text = `Points disponibles : ${availablePoints}`;
    this.ensureRows(statuses.length);

    for (const [index, status] of statuses.entries()) {
      const row = this.rows[index];
      if (!row) {
        continue;
      }

      const branch = BRANCH_LABELS[status.node.branch] ?? status.node.branch;
      row.label.text = `${branch} - ${status.node.name} (${status.rank}/${status.node.maxRank})\n${status.node.description}`;

      const canUpgrade = status.blocker === null;
      if (row.button.textBlock) {
        row.button.textBlock.text = canUpgrade
          ? `Ameliorer (${status.node.cost} pt)`
          : (BLOCKER_LABELS[status.blocker ?? ""] ?? "Indisponible");
      }
      row.button.isEnabled = canUpgrade;
      row.button.alpha = canUpgrade ? 1 : 0.45;
      row.button.background = canUpgrade ? "#3f8f6b" : "#2a3142";
      row.button.metadata = status.node.id;
    }
  }

  private ensureRows(count: number): void {
    while (this.rows.length < count) {
      const container = new StackPanel(`skillRow_${this.rows.length}`);
      container.height = "96px";
      container.paddingBottom = "8px";

      const label = new TextBlock();
      label.height = "52px";
      label.fontSize = 16;
      label.color = "#f2f4f8";
      label.textWrapping = true;
      container.addControl(label);

      const button = Button.CreateSimpleButton(`skillUpgrade_${this.rows.length}`, "Ameliorer");
      button.width = "260px";
      button.height = "34px";
      button.color = "#ffffff";
      button.cornerRadius = 8;
      button.thickness = 0;
      button.fontSize = 16;
      button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      button.onPointerClickObservable.add(() => {
        const nodeId = button.metadata;
        if (typeof nodeId === "string") {
          this.onUpgrade(nodeId);
        }
      });
      container.addControl(button);

      this.list.addControl(container);
      this.rows.push({ container, label, button });
    }
  }
}
