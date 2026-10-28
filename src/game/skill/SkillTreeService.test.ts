import { describe, expect, it } from "vitest";
import { SkillTreeService } from "./SkillTreeService";

describe("SkillTreeService debug points", () => {
  it("sets the requested available points on top of points already spent", () => {
    const service = new SkillTreeService();
    service.load({ skill_power_1: 2 }, 10);

    service.setAvailablePoints(7);

    expect(service.availablePoints).toBe(7);
    expect(service.currentRanks.skill_power_1).toBe(2);
  });

  it("clamps invalid available points to zero", () => {
    const service = new SkillTreeService();
    service.load({}, 10);

    service.setAvailablePoints(-5);

    expect(service.availablePoints).toBe(0);
  });
});