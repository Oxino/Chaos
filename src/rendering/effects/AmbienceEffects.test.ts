import { describe, expect, it } from "vitest";
import { ambienceVisualProfile } from "./AmbienceEffects";

describe("ambienceVisualProfile", () => {
  it("gives each time of day a distinct clear color", () => {
    const colors = (["dawn", "day", "dusk", "night"] as const).map((timeOfDay) =>
      ambienceVisualProfile({ weather: "sunny", timeOfDay }).clearColor,
    );

    expect(new Set(colors).size).toBe(4);
  });

  it("uses dense fog only for foggy weather", () => {
    const fog = ambienceVisualProfile({ weather: "fog", timeOfDay: "day" });
    const rain = ambienceVisualProfile({ weather: "rain", timeOfDay: "day" });

    expect(fog.fogDensity).toBeGreaterThan(rain.fogDensity);
    expect(fog.contrast).toBeLessThan(1);
  });

  it("keeps snowy scenes cold without erasing night", () => {
    const day = ambienceVisualProfile({ weather: "snow", timeOfDay: "day" });
    const night = ambienceVisualProfile({ weather: "snow", timeOfDay: "night" });

    expect(night.exposure).toBeLessThan(day.exposure);
    expect(night.clearColor).not.toBe(day.clearColor);
    expect(night.sunColor).toBe("#f4fbff");
  });
});