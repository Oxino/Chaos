import {
  BUILDING_COLOR_A,
  BUILDING_COLOR_B,
  BUILDING_COLOR_C,
  building,
  car,
  pole,
  sign,
} from "./blockoutHelpers";
import type { LevelBlockout } from "./levelTypes";

/** Quatrieme quartier : village ouvert, espace large et tirs plus longs. */
export const ruralDistrict: LevelBlockout = {
  id: "level_rural_district",
  displayName: "Village de la campagne",
  shotsAllowed: 4,
  targetScore: 60000,
  groundSize: 240,
  groundColor: "#59634a",
  weatherOptions: ["sunny", "cloudy", "rain", "snow"],
  timeOfDayOptions: ["dawn", "day", "dusk"],
  launcher: {
    position: { x: 0, y: 4, z: -64 },
    restDirection: { x: 0, y: 0.34, z: 1 },
  },
  boxes: [
    building("rural_left_1", -24, 0, 18, 14, 18, BUILDING_COLOR_A),
    building("rural_left_2", -24, 38, 18, 18, 18, BUILDING_COLOR_C),
    building("rural_right_1", 24, 12, 18, 16, 18, BUILDING_COLOR_B),
    building("rural_right_2", 24, 54, 18, 22, 18, BUILDING_COLOR_A),
    building("rural_far", 0, 100, 64, 24, 20, BUILDING_COLOR_C),

    car("rural_car_1", -7, -16),
    car("rural_car_2", 7, 0),
    car("rural_car_3", -7, 18),
    car("rural_car_4", 7, 36),
    car("rural_car_5", -7, 54),
    car("rural_car_6", 7, 72),

    pole("rural_pole_1", -12, -6),
    pole("rural_pole_2", 12, 8),
    pole("rural_pole_3", -12, 24),
    pole("rural_pole_4", 12, 40),
    pole("rural_pole_5", -12, 56),
    pole("rural_pole_6", 12, 72),

    sign("rural_sign_1", -13.5, 4),
    sign("rural_sign_2", 13.5, 20),
    sign("rural_sign_3", -13.5, 42),
    sign("rural_sign_4", 13.5, 64),
  ],
  buildings: [
    { id: "rural_tower_a", buildingId: "officeTower", position: { x: -18, y: 0, z: 10 } },
    { id: "rural_tower_b", buildingId: "officeTower", position: { x: 18, y: 0, z: 30 } },
    { id: "rural_tower_c", buildingId: "officeTower", position: { x: -18, y: 0, z: 52 } },
  ],
  secrets: [
    {
      id: "secret_rural_windmill",
      name: "Le vieux moulin",
      position: { x: 0, y: 24, z: 16 },
      radius: 5,
      xpReward: 200,
      scoreBonus: 1400,
    },
    {
      id: "secret_rural_barn",
      name: "Grange cachee",
      position: { x: -32, y: 5, z: 46 },
      radius: 5,
      xpReward: 200,
      scoreBonus: 1400,
    },
    {
      id: "secret_rural_bridge",
      name: "Sous le vieux pont",
      position: { x: 0, y: 12, z: 70 },
      radius: 5,
      xpReward: 220,
      scoreBonus: 1600,
    },
  ],
};