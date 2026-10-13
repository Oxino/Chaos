import { describe, expect, it } from "vitest";
import { ComboChainTracker } from "./ComboChainTracker";

const WINDOW_MS = 2500;
const MAX_MULTIPLIER = 5;

function createTracker(): ComboChainTracker {
  return new ComboChainTracker(WINDOW_MS, MAX_MULTIPLIER);
}

describe("ComboChainTracker", () => {
  it("demarre sans chaine", () => {
    const tracker = createTracker();
    expect(tracker.currentChain).toBe(0);
    expect(tracker.currentMultiplier).toBe(1);
  });

  it("allonge la chaine tant que les destructions restent dans la fenetre", () => {
    const tracker = createTracker();
    expect(tracker.register(0)).toBe(1);
    expect(tracker.register(1000)).toBe(2);
    expect(tracker.register(3400)).toBe(3);
  });

  it("repart a un quand la fenetre est depassee", () => {
    const tracker = createTracker();
    tracker.register(0);
    tracker.register(1000);
    expect(tracker.register(4000)).toBe(1);
  });

  it("plafonne le multiplicateur", () => {
    const tracker = createTracker();
    for (let index = 0; index < 7; index += 1) {
      tracker.register(index * 100);
    }
    expect(tracker.currentMultiplier).toBe(MAX_MULTIPLIER);
  });

  it("ferme la chaine a l'expiration de la fenetre", () => {
    const tracker = createTracker();
    tracker.register(0);
    tracker.update(2000);
    expect(tracker.currentChain).toBe(1);
    tracker.update(2600);
    expect(tracker.currentChain).toBe(0);
    expect(tracker.currentMultiplier).toBe(1);
  });

  it("se remet a zero", () => {
    const tracker = createTracker();
    tracker.register(0);
    tracker.reset();
    expect(tracker.currentChain).toBe(0);
    expect(tracker.register(100)).toBe(1);
  });

  it("retient la plus longue chaine de la partie", () => {
    const tracker = createTracker();
    tracker.register(0);
    tracker.register(500);
    tracker.register(1000);
    tracker.register(9000);
    expect(tracker.currentChain).toBe(1);
    expect(tracker.bestChain).toBe(3);
    tracker.reset();
    expect(tracker.bestChain).toBe(0);
  });
});
