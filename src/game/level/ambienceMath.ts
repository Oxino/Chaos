import type { TimeOfDay, WeatherType } from "../../data/content/levels/levelTypes";

export interface AmbienceSelection {
  readonly weather: WeatherType;
  readonly timeOfDay: TimeOfDay;
}

export function selectAmbience(
  weatherOptions: readonly WeatherType[],
  timeOfDayOptions: readonly TimeOfDay[],
  random: () => number = Math.random,
): AmbienceSelection {
  if (weatherOptions.length === 0 || timeOfDayOptions.length === 0) {
    throw new RangeError("Un niveau doit proposer une météo et une heure valides.");
  }
  return {
    weather: weatherOptions[Math.min(weatherOptions.length - 1, Math.floor(random() * weatherOptions.length))]!,
    timeOfDay: timeOfDayOptions[Math.min(timeOfDayOptions.length - 1, Math.floor(random() * timeOfDayOptions.length))]!,
  };
}