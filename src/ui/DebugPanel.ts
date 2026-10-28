import {
  type AdvancedDynamicTexture,
  Button,
  Control,
  InputText,
  Rectangle,
  ScrollViewer,
  StackPanel,
  TextBlock,
} from "@babylonjs/gui";
import type { TimeOfDay, WeatherType } from "../data/content/levels/levelTypes";
import type {
  DestructibleDebugPatch,
  DestructibleDebugValues,
} from "../game/destruction/DestructibleObject";

export interface DebugPanelView {
  readonly cheatEnabled: boolean;
  readonly weather: WeatherType;
  readonly timeOfDay: TimeOfDay;
  readonly currency: number;
  readonly totalXp: number;
  readonly level: number;
  readonly availableSkillPoints: number;
  readonly destructibles: readonly DestructibleDebugValues[];
}

export interface DebugPanelActions {
  readonly onToggleCheat: () => void;
  readonly onSetWeather: (weather: WeatherType) => void;
  readonly onSetTimeOfDay: (timeOfDay: TimeOfDay) => void;
  readonly onSetCurrency: (value: number) => void;
  readonly onSetXp: (value: number) => void;
  readonly onSetLevel: (value: number) => void;
  readonly onSetSkillPoints: (value: number) => void;
  readonly onPatchDestructible: (id: string, patch: DestructibleDebugPatch) => void;
  readonly onResetDestructible: (id: string) => void;
  readonly onResetLevel: () => void;
}

type DebugTab = "game" | "ambience" | "decor";

const WEATHER_OPTIONS: readonly WeatherType[] = ["sunny", "cloudy", "rain", "snow", "fog"];
const TIME_OPTIONS: readonly TimeOfDay[] = ["dawn", "day", "dusk", "night"];
const WEATHER_LABELS: Record<WeatherType, string> = {
  sunny: "Soleil",
  cloudy: "Nuages",
  rain: "Pluie",
  snow: "Neige",
  fog: "Brouillard",
};
const TIME_LABELS: Record<TimeOfDay, string> = {
  dawn: "Matin",
  day: "Jour",
  dusk: "Coucher de soleil",
  night: "Nuit",
};

export class DebugPanel {
  private readonly panel: Rectangle;
  private readonly content: StackPanel;
  private readonly tabButtons = new Map<DebugTab, Button>();
  private view: DebugPanelView | undefined;
  private tab: DebugTab = "game";
  private selectedDestructibleIndex = 0;
  private lastSignature = "";

  constructor(
    private readonly texture: AdvancedDynamicTexture,
    private readonly actions: DebugPanelActions,
    onClose: () => void,
  ) {
    this.panel = new Rectangle("debugPanel");
    this.panel.width = "1080px";
    this.panel.height = "660px";
    this.panel.thickness = 2;
    this.panel.color = "#5aa8c7";
    this.panel.background = "#0b1119f5";
    this.panel.cornerRadius = 6;
    this.panel.zIndex = 100;
    this.panel.isVisible = false;
    this.texture.addControl(this.panel);

    const layout = new StackPanel("debugLayout");
    layout.paddingTop = "14px";
    layout.paddingLeft = "18px";
    layout.paddingRight = "18px";
    this.panel.addControl(layout);

    const header = new StackPanel("debugHeader");
    header.isVertical = false;
    header.height = "54px";
    layout.addControl(header);
    const title = createText("debugTitle", "MODE TRICHE / REGLAGES", 25, "#ffd24a", "760px");
    title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    header.addControl(title);
    const closeButton = createButton("debugClose", "Fermer", "#42536a", onClose);
    closeButton.width = "180px";
    header.addControl(closeButton);

    const tabs = new StackPanel("debugTabs");
    tabs.isVertical = false;
    tabs.height = "52px";
    layout.addControl(tabs);
    for (const [tab, label] of [
      ["game", "Partie"],
      ["ambience", "Ambiance"],
      ["decor", "Decor"],
    ] as const) {
      const button = createButton(`debugTab_${tab}`, label, "#29435d", () => this.setTab(tab));
      button.width = "250px";
      button.height = "42px";
      tabs.addControl(button);
      this.tabButtons.set(tab, button);
    }

    const scroll = new ScrollViewer("debugScroll");
    scroll.width = "1010px";
    scroll.height = "520px";
    scroll.thickness = 0;
    scroll.barSize = 14;
    scroll.background = "#101b28cc";
    layout.addControl(scroll);
    this.content = new StackPanel("debugContent");
    this.content.width = "970px";
    this.content.paddingTop = "14px";
    this.content.paddingBottom = "18px";
    scroll.addControl(this.content);
  }

  get isVisible(): boolean {
    return this.panel.isVisible;
  }

  setVisible(visible: boolean): void {
    this.panel.isVisible = visible;
    if (visible) {
      this.renderCurrentTab();
    }
  }

  render(view: DebugPanelView): void {
    this.view = view;
    const signature = this.viewSignature(view);
    if (this.isVisible && signature !== this.lastSignature && !this.hasFocusedInput()) {
      this.lastSignature = signature;
      this.renderCurrentTab();
    }
  }

  private setTab(tab: DebugTab): void {
    this.tab = tab;
    this.renderCurrentTab();
  }

  private renderCurrentTab(): void {
    const view = this.view;
    if (!view) {
      return;
    }
    this.content.clearControls();
    for (const [tab, button] of this.tabButtons) {
      button.background = tab === this.tab ? "#317894" : "#29435d";
    }
    switch (this.tab) {
      case "game":
        this.renderGame(view);
        break;
      case "ambience":
        this.renderAmbience(view);
        break;
      case "decor":
        this.renderDecor(view);
        break;
    }
  }

  private renderGame(view: DebugPanelView): void {
    this.addNotice("Les changements de monnaie et d'XP sont sauvegardes. Le niveau est calcule depuis l'XP.");
    const cheat = createButton(
      "debugCheatToggle",
      view.cheatEnabled ? "Triche activee" : "Triche desactivee",
      view.cheatEnabled ? "#a44444" : "#5a3940",
      this.actions.onToggleCheat,
    );
    cheat.width = "360px";
    this.content.addControl(cheat);
    this.addNumberSetting("Monnaie", view.currency, this.actions.onSetCurrency, 0, 999999999);
    this.addNumberSetting("XP totale", view.totalXp, this.actions.onSetXp, 0, 999999999);
    this.addNumberSetting("Niveau joueur", view.level, this.actions.onSetLevel, 1, 50);
    this.addNumberSetting(
      "Points de competence disponibles (session)",
      view.availableSkillPoints,
      this.actions.onSetSkillPoints,
      0,
      9999,
    );
    const reset = createButton("debugResetLevel", "Reinitialiser la partie", "#8f5c32", this.actions.onResetLevel);
    reset.width = "360px";
    reset.paddingTop = "18px";
    this.content.addControl(reset);
  }

  private renderAmbience(view: DebugPanelView): void {
    this.addNotice("Les changements sont immediats et restent actifs jusqu'au chargement d'un autre niveau.");
    this.content.addControl(createSectionTitle("debugWeatherTitle", "METEO"));
    this.content.addControl(this.createChoiceRow(
      "weatherChoices",
      WEATHER_OPTIONS,
      view.weather,
      WEATHER_LABELS,
      this.actions.onSetWeather,
    ));
    this.content.addControl(createSectionTitle("debugTimeTitle", "PERIODE"));
    this.content.addControl(this.createChoiceRow(
      "timeChoices",
      TIME_OPTIONS,
      view.timeOfDay,
      TIME_LABELS,
      this.actions.onSetTimeOfDay,
    ));
  }

  private renderDecor(view: DebugPanelView): void {
    if (view.destructibles.length === 0) {
      this.addNotice("Aucun element destructible dans ce niveau.");
      return;
    }
    this.selectedDestructibleIndex = Math.min(
      this.selectedDestructibleIndex,
      view.destructibles.length - 1,
    );
    const object = view.destructibles[this.selectedDestructibleIndex]!;
    const navigation = new StackPanel("debugDecorNavigation");
    navigation.isVertical = false;
    navigation.height = "48px";
    const previous = createButton("debugPreviousDecor", "<", "#29435d", () => {
      this.selectedDestructibleIndex =
        (this.selectedDestructibleIndex - 1 + view.destructibles.length) % view.destructibles.length;
      this.renderCurrentTab();
    });
    previous.width = "90px";
    navigation.addControl(previous);
    const selection = createText(
      "debugDecorSelection",
      `${this.selectedDestructibleIndex + 1}/${view.destructibles.length}  ${object.displayName}  [${object.id}]`,
      18,
      "#ffffff",
      "760px",
    );
    navigation.addControl(selection);
    const next = createButton("debugNextDecor", ">", "#29435d", () => {
      this.selectedDestructibleIndex = (this.selectedDestructibleIndex + 1) % view.destructibles.length;
      this.renderCurrentTab();
    });
    next.width = "90px";
    navigation.addControl(next);
    this.content.addControl(navigation);
    this.addNotice(`Etat : ${object.state}. Valeurs appliquees uniquement a cette instance.`);

    const inputs = new Map<keyof DestructibleDebugPatch, InputText>();
    this.addPatchInput(inputs, "currentHealth", "Vie actuelle", object.currentHealth);
    this.addPatchInput(inputs, "maxHealth", "Vie maximale", object.maxHealth);
    this.addPatchInput(inputs, "minimumImpactThreshold", "Seuil d'impact (N.s)", object.minimumImpactThreshold);
    this.addPatchInput(inputs, "damageScale", "Multiplicateur de degats", object.damageScale);
    this.addPatchInput(inputs, "scoreValue", "Valeur de score", object.scoreValue);
    this.addPatchInput(inputs, "dynamicMass", "Masse dynamique (kg)", object.dynamicMass);
    this.addPatchInput(inputs, "destructionImpulse", "Impulsion de dispersion (N.s)", object.destructionImpulse);

    const actions = new StackPanel("debugDecorActions");
    actions.isVertical = false;
    actions.height = "58px";
    const apply = createButton("debugApplyDecor", "Appliquer", "#347052", () => {
      const patch: Record<string, number> = {};
      for (const [key, input] of inputs) {
        const value = Number(input.text.replace(",", "."));
        if (Number.isFinite(value)) {
          patch[key] = value;
        }
      }
      this.actions.onPatchDestructible(object.id, patch);
    });
    apply.width = "280px";
    actions.addControl(apply);
    const destroy = createButton("debugDestroyDecor", "Detruire", "#8f3f3f", () =>
      this.actions.onPatchDestructible(object.id, { currentHealth: 0 }),
    );
    destroy.width = "280px";
    actions.addControl(destroy);
    const restore = createButton("debugRestoreDecor", "Restaurer", "#315c78", () =>
      this.actions.onResetDestructible(object.id),
    );
    restore.width = "280px";
    actions.addControl(restore);
    this.content.addControl(actions);
  }

  private addNumberSetting(
    label: string,
    value: number,
    apply: (value: number) => void,
    minimum: number,
    maximum: number,
  ): void {
    const row = createInputRow(label, value);
    const input = row.children[1] as InputText;
    const button = createButton(`apply_${label}`, "Appliquer", "#347052", () => {
      const parsed = Number(input.text.replace(",", "."));
      if (Number.isFinite(parsed)) {
        apply(Math.max(minimum, Math.min(maximum, Math.floor(parsed))));
      }
    });
    button.width = "180px";
    row.addControl(button);
    this.content.addControl(row);
  }

  private addPatchInput(
    inputs: Map<keyof DestructibleDebugPatch, InputText>,
    key: keyof DestructibleDebugPatch,
    label: string,
    value: number,
  ): void {
    const row = createInputRow(label, value);
    inputs.set(key, row.children[1] as InputText);
    this.content.addControl(row);
  }

  private createChoiceRow<T extends string>(
    name: string,
    values: readonly T[],
    selected: T,
    labels: Record<T, string>,
    choose: (value: T) => void,
  ): StackPanel {
    const row = new StackPanel(name);
    row.isVertical = false;
    row.height = "58px";
    for (const value of values) {
      const button = createButton(
        `${name}_${value}`,
        labels[value],
        value === selected ? "#317894" : "#29435d",
        () => choose(value),
      );
      button.width = `${Math.floor(900 / values.length)}px`;
      button.height = "44px";
      row.addControl(button);
    }
    return row;
  }

  private addNotice(text: string): void {
    const notice = createText(`debugNotice_${this.content.children.length}`, text, 15, "#9fc5d6", "940px");
    notice.height = "44px";
    notice.textWrapping = true;
    notice.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.content.addControl(notice);
  }

  private hasFocusedInput(): boolean {
    return this.texture.focusedControl instanceof InputText;
  }

  private viewSignature(view: DebugPanelView): string {
    const selected = view.destructibles[this.selectedDestructibleIndex];
    return [
      this.tab,
      view.cheatEnabled,
      view.weather,
      view.timeOfDay,
      view.currency,
      view.totalXp,
      view.level,
      view.availableSkillPoints,
      view.destructibles.length,
      selected && Object.values(selected).join(":"),
    ].join("|");
  }
}

function createInputRow(label: string, value: number): StackPanel {
  const row = new StackPanel(`debugRow_${label}`);
  row.isVertical = false;
  row.height = "52px";
  const labelText = createText(`debugLabel_${label}`, label, 17, "#dce8ef", "480px");
  labelText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  row.addControl(labelText);
  const input = new InputText(`debugInput_${label}`, formatNumber(value));
  input.width = "260px";
  input.height = "40px";
  input.color = "#ffffff";
  input.background = "#17283a";
  input.focusedBackground = "#203a51";
  input.thickness = 1;
  input.fontSize = 17;
  input.maxWidth = "260px";
  row.addControl(input);
  return row;
}

function createText(name: string, text: string, fontSize: number, color: string, width: string): TextBlock {
  const block = new TextBlock(name, text);
  block.width = width;
  block.height = "40px";
  block.fontSize = fontSize;
  block.color = color;
  return block;
}

function createSectionTitle(name: string, text: string): TextBlock {
  const title = createText(name, text, 18, "#ffd24a", "940px");
  title.height = "46px";
  title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  return title;
}

function createButton(name: string, label: string, background: string, action: () => void): Button {
  const button = Button.CreateSimpleButton(name, label);
  button.height = "42px";
  button.color = "#ffffff";
  button.background = background;
  button.cornerRadius = 5;
  button.thickness = 0;
  button.fontSize = 17;
  button.paddingLeft = "5px";
  button.paddingRight = "5px";
  button.onPointerClickObservable.add(action);
  return button;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}