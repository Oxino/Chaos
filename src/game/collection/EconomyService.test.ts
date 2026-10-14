import { describe, expect, it } from "vitest";
import { createEmptySave } from "../save/saveSchema";
import { EconomyService } from "./EconomyService";

describe("EconomyService", () => {
  it("accorde et depense une monnaie unique sans solde negatif", () => {
    const economy = new EconomyService();
    const funded = economy.grant(createEmptySave(), 250);

    expect(economy.balance(funded)).toBe(250);
    expect(economy.balance(economy.spend(funded, 100))).toBe(150);
    expect(economy.spend(funded, 300)).toBe(funded);
  });

  it("ignore les gains invalides", () => {
    const economy = new EconomyService();
    const save = createEmptySave();

    expect(economy.grant(save, -1)).toBe(save);
    expect(economy.grant(save, Number.NaN)).toBe(save);
  });
});