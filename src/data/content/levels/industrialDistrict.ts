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

/** Troisieme quartier : zone industrielle ouverte, avec lignes de tir laterales. */
export const industrialDistrict: LevelBlockout = {
  id: "level_industrial_district",
  displayName: "Zone industrielle",
  shotsAllowed: 4,
  targetScore: 45000,
  groundSize: 220,
  groundColor: "#4a4a46",
  weatherOptions: ["sunny", "cloudy", "fog"],
  timeOfDayOptions: ["day", "dusk", "night"],
  launcher: {
    position: { x: 0, y: 4, z: -58 },
    restDirection: { x: 0, y: 0.38, z: 1 },
  },
  boxes: [
    building("industrial_left_1", -22, 0, 16, 20, 16, BUILDING_COLOR_B),
    building("industrial_left_2", -22, 42, 16, 28, 16, BUILDING_COLOR_A),
    building("industrial_right_1", 22, 8, 16, 24, 16, BUILDING_COLOR_C),
    building("industrial_right_2", 22, 52, 16, 18, 16, BUILDING_COLOR_B),
    building("industrial_far", 0, 92, 60, 30, 18, BUILDING_COLOR_A),

    car("industrial_car_1", -6, -18),
    car("industrial_car_2", 6, -6),
    car("industrial_car_3", -6, 10),
    car("industrial_car_4", 6, 26),
    car("industrial_car_5", -6, 42),
    car("industrial_car_6", 6, 58),
    car("industrial_car_7", 0, 76),

    pole("industrial_pole_1", -11, -10),
    pole("industrial_pole_2", 11, 2),
    pole("industrial_pole_3", -11, 18),
    pole("industrial_pole_4", 11, 34),
    pole("industrial_pole_5", -11, 50),
    pole("industrial_pole_6", 11, 66),

    sign("industrial_sign_1", -12.5, 6),
    sign("industrial_sign_2", 12.5, 24),
    sign("industrial_sign_3", -12.5, 44),
    sign("industrial_sign_4", 12.5, 62),
  ],
  buildings: [
    { id: "industrial_tower_a", buildingId: "officeTower", position: { x: -17, y: 0, z: 12 } },
    { id: "industrial_tower_b", buildingId: "officeTower", position: { x: 17, y: 0, z: 30 } },
    { id: "industrial_tower_c", buildingId: "officeTower", position: { x: -17, y: 0, z: 56 } },
  ],
  secrets: [
    {
      id: "secret_industrial_stack",
      name: "Sommet des containers",
      position: { x: 0, y: 30, z: 18 },
      radius: 5,
      xpReward: 180,
      scoreBonus: 1200,
    },
    {
      id: "secret_industrial_silo",
      name: "Derriere le silo",
      position: { x: -30, y: 6, z: 48 },
      radius: 5,
      xpReward: 180,
      scoreBonus: 1200,
    },
    {
      id: "secret_industrial_crane",
      name: "Passage sous la grue",
      position: { x: 0, y: 18, z: 70 },
      radius: 5,
      xpReward: 200,
      scoreBonus: 1400,
    },
    {
      id: "secret_industrial_end",
      name: "Fin de la chaine",
      position: { x: 0, y: 10, z: 98 },
      radius: 5,
      xpReward: 220,
      scoreBonus: 1600,
    },
  ],
};