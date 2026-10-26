import { describe, expect, it } from "vitest";
import { levelCatalog } from "./levelCatalog";

describe("levelCatalog", () => {
  it("contains unique levels with three to four secrets each", () => {
    const levelIds = levelCatalog.map((level) => level.id);
    const secretIds = levelCatalog.flatMap((level) => level.secrets.map((secret) => secret.id));

    expect(new Set(levelIds).size).toBe(levelIds.length);
    expect(new Set(secretIds).size).toBe(secretIds.length);
    expect(levelCatalog.length).toBeGreaterThanOrEqual(4);
    for (const level of levelCatalog) {
      expect(level.secrets.length).toBeGreaterThanOrEqual(3);
      expect(level.secrets.length).toBeLessThanOrEqual(4);
      expect(level.shotsAllowed).toBeGreaterThanOrEqual(3);
      expect(level.targetScore).toBeGreaterThan(0);
    }
  });
});