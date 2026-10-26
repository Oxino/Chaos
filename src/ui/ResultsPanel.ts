import {
  type AdvancedDynamicTexture,
  Button,
  Control,
  Rectangle,
  StackPanel,
  TextBlock,
} from "@babylonjs/gui";

export interface SessionResults {
  readonly levelName: string;
  readonly total: number;
  readonly direct: number;
  readonly combo: number;
  readonly targetScore: number;
  readonly bestChain: number;
  readonly destroyedCount: number;
  readonly bestScore: number;
  readonly isNewRecord: boolean;
  readonly gainedXp: number;
  readonly gainedCurrency: number;
  readonly playerLevel: number;
  readonly skillPoints: number;
  readonly completedQuests: readonly string[];
  readonly secretsFound: number;
  readonly secretsTotal: number;
  readonly hasNextLevel: boolean;
  readonly official: boolean;
}

/**
 * Ecran de resultats de fin de partie (spec 13.4) : score total, repartition, meilleur combo,
 * progression et origine des recompenses.
 */
export class ResultsPanel {
  private readonly panel: Rectangle;
  private readonly stack: StackPanel;
  private readonly lines: TextBlock[] = [];
  private readonly title: TextBlock;
  private readonly nextLevelButton: Button;

  constructor(texture: AdvancedDynamicTexture, onReplay: () => void, onNextLevel: () => void) {
    this.panel = new Rectangle("resultsPanel");
    this.panel.width = "500px";
    this.panel.height = "580px";
    this.panel.thickness = 0;
    this.panel.cornerRadius = 16;
    this.panel.background = "#10131aee";
    this.panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.panel.isVisible = false;
    texture.addControl(this.panel);

    this.stack = new StackPanel("resultsStack");
    this.stack.paddingTop = "24px";
    this.panel.addControl(this.stack);

    this.title = createLine(26, "#ffd24a");
    this.stack.addControl(this.title);

    for (let index = 0; index < 12; index += 1) {
      const line = createLine(19, "#f2f4f8");
      this.lines.push(line);
      this.stack.addControl(line);
    }

    // La liste des quetes peut etre longue : elle doit revenir a la ligne plutot que deborder.
    const questLine = this.lines[11];
    if (questLine) {
      questLine.textWrapping = true;
      questLine.width = "440px";
      questLine.height = "64px";
    }

    const replay = Button.CreateSimpleButton("replayButton", "Rejouer");
    replay.width = "220px";
    replay.height = "56px";
    replay.paddingTop = "20px";
    replay.color = "#ffffff";
    replay.background = "#e8613c";
    replay.cornerRadius = 10;
    replay.thickness = 0;
    replay.fontSize = 20;
    replay.onPointerClickObservable.add(() => onReplay());
    this.stack.addControl(replay);

    this.nextLevelButton = Button.CreateSimpleButton("nextLevelButton", "Niveau suivant");
    this.nextLevelButton.width = "220px";
    this.nextLevelButton.height = "56px";
    this.nextLevelButton.paddingTop = "10px";
    this.nextLevelButton.color = "#ffffff";
    this.nextLevelButton.background = "#3f8f6b";
    this.nextLevelButton.cornerRadius = 10;
    this.nextLevelButton.thickness = 0;
    this.nextLevelButton.fontSize = 20;
    this.nextLevelButton.onPointerClickObservable.add(() => onNextLevel());
    this.stack.addControl(this.nextLevelButton);
  }

  get isVisible(): boolean {
    return this.panel.isVisible;
  }

  show(results: SessionResults): void {
    const objectiveReached = results.total >= results.targetScore;

    this.title.text = objectiveReached ? "Objectif atteint !" : "Objectif non atteint";
    this.title.color = objectiveReached ? "#5fd38d" : "#ff6b4a";

    this.setLine(0, results.levelName, "#9aa7bd");
    this.setLine(1, results.official ? "Partie officielle" : "Partie non officielle", results.official ? "#5fd38d" : "#ffb13c");
    this.setLine(2, `Score total : ${results.total} / ${results.targetScore}`, "#f2f4f8");
    this.setLine(3, `Degats directs : ${results.direct}`, "#f2f4f8");
    this.setLine(4, `Bonus de combos : ${results.combo}`, "#f2f4f8");
    this.setLine(
      5,
      `Meilleure chaine : ${results.bestChain} destructions`,
      "#f2f4f8",
    );
    this.setLine(
      6,
      `Objets detruits : ${results.destroyedCount} - secrets ${results.secretsFound}/${results.secretsTotal}`,
      "#f2f4f8",
    );
    this.setLine(
      7,
      results.isNewRecord
        ? `Nouveau record : ${results.bestScore}`
        : `Meilleur score : ${results.bestScore}`,
      results.isNewRecord ? "#ffd24a" : "#9aa7bd",
    );
    this.setLine(8, `XP gagnee : ${results.gainedXp}`, "#5fd38d");
    this.setLine(
      9,
      `Niveau ${results.playerLevel} - ${results.skillPoints} point(s) de competence`,
      "#5fd38d",
    );
    this.setLine(
      10,
      `Monnaie gagnee : ${results.gainedCurrency}`,
      "#ffd24a",
    );
    this.setLine(
      11,
      results.completedQuests.length > 0
        ? `Quetes : ${results.completedQuests.join(", ")}`
        : "Aucune nouvelle quete",
      results.completedQuests.length > 0 ? "#ffd24a" : "#9aa7bd",
    );

    this.nextLevelButton.isVisible = results.hasNextLevel;
    this.panel.isVisible = true;
  }

  hide(): void {
    this.panel.isVisible = false;
  }

  private setLine(index: number, text: string, color: string): void {
    const line = this.lines[index];
    if (!line) {
      return;
    }
    line.text = text;
    line.color = color;
  }
}

function createLine(fontSize: number, color: string): TextBlock {
  const text = new TextBlock();
  text.height = `${fontSize + 18}px`;
  text.fontSize = fontSize;
  text.color = color;
  return text;
}
