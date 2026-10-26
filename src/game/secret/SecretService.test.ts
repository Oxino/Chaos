import { describe, expect, it } from "vitest";
import { Vector3 } from "@babylonjs/core";
import { SecretService } from "./SecretService";

describe("SecretService", () => {
  it("keeps secrets hidden until a character enters their zone", () => {
    const service = new SecretService({} as never, [
      {
        id: "hidden",
        name: "Passage secret",
        position: { x: 10, y: 4, z: 10 },
        radius: 5,
        xpReward: 100,
        scoreBonus: 500,
      },
    ]);

    expect(service.discoveredCount).toBe(0);
    expect(service.check(new Vector3(0, 4, 0))).toHaveLength(0);
    expect(service.check(new Vector3(10, 4, 10))).toHaveLength(1);
    expect(service.check(new Vector3(10, 4, 10))).toHaveLength(0);
  });
});