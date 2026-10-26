import { describe, expect, it } from "vitest";
import { selectAmbience } from "./ambienceMath";

describe("selectAmbience", () => {
  it("selects deterministic options from the level data", () => {
    expect(selectAmbience(["sunny", "rain"], ["dawn", "night"], () => 0.99)).toEqual({
      weather: "rain",
      timeOfDay: "night",
    });
  });

  it("rejects an empty ambience catalogue", () => {
    expect(() => selectAmbience([], ["day"], () => 0)).toThrow(RangeError);
  });
});