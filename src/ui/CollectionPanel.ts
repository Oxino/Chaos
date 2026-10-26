import {
  type AdvancedDynamicTexture,
  Button,
  Rectangle,
  StackPanel,
  TextBlock,
} from "@babylonjs/gui";
import type { CollectionCategory } from "../game/save/saveSchema";

export interface CollectionLevelView {
  readonly index: number;
  readonly name: string;
  readonly targetScore: number;
  readonly bestScore: number;
  readonly unlocked: boolean;
}

export interface CollectionEntryView {
  readonly category: CollectionCategory;
  readonly id: string;
  readonly name: string;
  readonly count: number;
  readonly upgradeLevel: number;
  readonly available: boolean;
  readonly stats: readonly string[];
}

export interface CollectionProfileView {
  readonly currency: number;
  readonly totalXp: number;
  readonly playerLevel: number;
  readonly xpIntoLevel: number;
  readonly xpForNextLevel: number;
  readonly gachaCost: number;
  readonly entries: readonly CollectionEntryView[];
  readonly levels: readonly CollectionLevelView[];
}

export class CollectionPanel {
  private readonly panel: Rectangle;
  private readonly balanceText: TextBlock;
  private readonly progressionText: TextBlock;
  private readonly messageText: TextBlock;
  private readonly list: StackPanel;
  private readonly drawButtons: Partial<Record<CollectionCategory, Button>> = {};
  private selectedCategory: CollectionCategory | "levels" = "characters";

  constructor(
    texture: AdvancedDynamicTexture,
    private readonly onDraw: (category: CollectionCategory) => void,
    private readonly onEquip: (category: CollectionCategory, id: string) => void,
    private readonly onSelectLevel: (index: number) => void,
    onClose: () => void,
  ) {
    this.panel = new Rectangle("collectionPanel");
    this.panel.width = "620px";
    this.panel.height = "620px";
    this.panel.thickness = 0;
    this.panel.cornerRadius = 16;
    this.panel.background = "#10131aee";
    this.panel.isVisible = false;
    texture.addControl(this.panel);

    const layout = new StackPanel("collectionLayout");
    layout.paddingTop = "18px";
    this.panel.addControl(layout);
    layout.addControl(createText("collectionTitle", "Collection", 27, "#ffd24a", "42px"));

    this.balanceText = createText("collectionBalance", "Monnaie : 0", 20, "#5fd38d", "34px");
    layout.addControl(this.balanceText);
    this.progressionText = createText("collectionProgression", "Niveau 1 - XP 0", 17, "#9aa7bd", "34px");
    layout.addControl(this.progressionText);

    const drawRow = new StackPanel("collectionDrawRow");
    drawRow.isVertical = false;
    drawRow.height = "52px";
    for (const [category, label] of [
      ["launchers", "Lanceur"],
      ["characters", "Personnage"],
      ["items", "Objet"],
    ] as const) {
      const button = Button.CreateSimpleButton(`draw_${category}`, `Tirage ${label}`);
      button.width = "180px";
      button.height = "44px";
      button.color = "#ffffff";
      button.background = "#3f8f6b";
      button.cornerRadius = 8;
      button.thickness = 0;
      button.fontSize = 16;
      button.onPointerClickObservable.add(() => this.onDraw(category));
      this.drawButtons[category] = button;
      drawRow.addControl(button);
    }
    layout.addControl(drawRow);

    const tabs = new StackPanel("collectionTabs");
    tabs.isVertical = false;
    tabs.height = "44px";
    for (const [category, label] of [
      ["launchers", "Lanceurs"],
      ["characters", "Personnages"],
      ["items", "Objets"],
      ["levels", "Carte"],
    ] as const) {
      const tab = Button.CreateSimpleButton(`collectionTab_${category}`, label);
      tab.width = "140px";
      tab.height = "38px";
      tab.color = "#ffffff";
      tab.background = "#4a5873";
      tab.cornerRadius = 8;
      tab.thickness = 0;
      tab.fontSize = 16;
      tab.onPointerClickObservable.add(() => {
        this.selectedCategory = category;
        this.lastProfile && this.renderProfile(this.lastProfile);
      });
      tabs.addControl(tab);
    }
    layout.addControl(tabs);

    this.messageText = createText("collectionMessage", "", 17, "#ffd24a", "44px");
    layout.addControl(this.messageText);
    this.list = new StackPanel("collectionList");
    this.list.height = "350px";
    layout.addControl(this.list);

    const close = Button.CreateSimpleButton("collectionClose", "Fermer");
    close.width = "180px";
    close.height = "44px";
    close.color = "#ffffff";
    close.background = "#4a5873";
    close.cornerRadius = 8;
    close.thickness = 0;
    close.fontSize = 18;
    close.onPointerClickObservable.add(() => onClose());
    layout.addControl(close);
  }

  private lastProfile: CollectionProfileView | undefined;

  get isVisible(): boolean {
    return this.panel.isVisible;
  }

  setVisible(visible: boolean): void {
    this.panel.isVisible = visible;
  }

  renderProfile(profile: CollectionProfileView, message = this.messageText.text): void {
    this.lastProfile = profile;
    this.balanceText.text = `Monnaie : ${profile.currency} - Tirage : ${profile.gachaCost}`;
    for (const [category, label] of [
      ["launchers", "Lanceur"],
      ["characters", "Personnage"],
      ["items", "Objet"],
    ] as const) {
      const button = this.drawButtons[category];
      if (button?.textBlock) {
        button.textBlock.text = `Tirage ${label} (${profile.gachaCost})`;
      }
    }
    this.progressionText.text =
      `Niveau ${profile.playerLevel} - XP ${profile.totalXp} (${profile.xpIntoLevel}/${profile.xpForNextLevel || "max"})`;
    this.messageText.text = message;
    this.list.clearControls();
    if (this.selectedCategory === "levels") {
      for (const level of profile.levels) {
        const row = new StackPanel(`collectionLevel_${level.index}`);
        row.height = "76px";
        row.addControl(createText(
          `collectionLevelDetails_${level.index}`,
          `${level.unlocked ? "Disponible" : "Verrouille"} - ${level.name}\nObjectif ${level.targetScore} | Meilleur ${level.bestScore}`,
          16,
          level.unlocked ? "#f2f4f8" : "#69758a",
          "52px",
        ));
        if (level.unlocked) {
          const freeButton = Button.CreateSimpleButton(`freeLevel_${level.index}`, "Mode libre");
          freeButton.width = "150px";
          freeButton.height = "28px";
          freeButton.color = "#ffffff";
          freeButton.background = "#3f8f6b";
          freeButton.cornerRadius = 6;
          freeButton.thickness = 0;
          freeButton.fontSize = 14;
          freeButton.onPointerClickObservable.add(() => this.onSelectLevel(level.index));
          row.addControl(freeButton);
        }
        this.list.addControl(
          row,
        );
      }
      return;
    }

    const entries = profile.entries.filter((entry) => entry.category === this.selectedCategory);
    for (const entry of entries) {
      const ownership = entry.available ? `${entry.count} exemplaire(s)` : "Indisponible";
      const upgrade = entry.upgradeLevel > 0 ? ` | amelioration ${entry.upgradeLevel}` : "";
      const row = new StackPanel(`collectionEntry_${entry.category}_${entry.id}`);
      row.height = "82px";
      const details = createText(
        `collectionDetails_${entry.category}_${entry.id}`,
        `${entry.name} - ${ownership}${upgrade}\n${entry.stats.join(" | ")}`,
        15,
        entry.available ? "#f2f4f8" : "#69758a",
        "56px",
      );
      row.addControl(details);
      if (entry.available) {
        const equip = Button.CreateSimpleButton(
          `equip_${entry.category}_${entry.id}`,
          "Equiper",
        );
        equip.width = "140px";
        equip.height = "26px";
        equip.color = "#ffffff";
        equip.background = "#3f8f6b";
        equip.cornerRadius = 6;
        equip.thickness = 0;
        equip.fontSize = 14;
        equip.onPointerClickObservable.add(() => this.onEquip(entry.category, entry.id));
        row.addControl(equip);
      }
      this.list.addControl(row);
    }
    if (entries.length === 0) {
      this.list.addControl(createText("collectionEmpty", "Aucun contenu dans cette categorie", 17, "#9aa7bd", "32px"));
    }
  }

  render(currency: number, entries: readonly CollectionEntryView[], message = ""): void {
    this.renderProfile({
      currency,
      totalXp: 0,
      playerLevel: 1,
      xpIntoLevel: 0,
      xpForNextLevel: 0,
      gachaCost: 0,
      entries,
      levels: [],
    }, message);
  }
}

function createText(name: string, text: string, fontSize: number, color: string, height: string): TextBlock {
  const block = new TextBlock(name, text);
  block.height = height;
  block.fontSize = fontSize;
  block.color = color;
  block.textWrapping = true;
  return block;
}