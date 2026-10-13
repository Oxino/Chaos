import { comboMultiplier } from "./scoreMath";

/**
 * Suit la chaine causale de destructions sur une fenetre temporelle (spec 8.3).
 * Le temps est fourni par l'appelant pour rester testable et independant de la boucle de rendu.
 */
export class ComboChainTracker {
  private chainLength = 0;
  private lastEventMs = 0;
  private longestChain = 0;

  constructor(
    private readonly windowMs: number,
    private readonly maxMultiplier: number,
  ) {}

  get currentChain(): number {
    return this.chainLength;
  }

  /** Plus longue chaine atteinte depuis la derniere remise a zero (spec 13.4). */
  get bestChain(): number {
    return this.longestChain;
  }

  get currentMultiplier(): number {
    return this.chainLength === 0 ? 1 : comboMultiplier(this.chainLength, this.maxMultiplier);
  }

  /** Enregistre une destruction et renvoie le multiplicateur qui lui est applique. */
  register(nowMs: number): number {
    const continuesChain = this.chainLength > 0 && nowMs - this.lastEventMs <= this.windowMs;
    this.chainLength = continuesChain ? this.chainLength + 1 : 1;
    this.lastEventMs = nowMs;
    this.longestChain = Math.max(this.longestChain, this.chainLength);
    return this.currentMultiplier;
  }

  /** Ferme la chaine lorsque la fenetre est depassee. */
  update(nowMs: number): void {
    if (this.chainLength > 0 && nowMs - this.lastEventMs > this.windowMs) {
      this.chainLength = 0;
    }
  }

  reset(): void {
    this.chainLength = 0;
    this.lastEventMs = 0;
    this.longestChain = 0;
  }
}
