import { describe, expect, it } from "vitest";
import { destructibleCatalog } from "./destructibleCatalog";

describe("destructibleCatalog", () => {
  it("conserve les degats partiels d'une voiture", () => {
    expect(destructibleCatalog.car?.stages).toBeGreaterThan(1);
  });
});