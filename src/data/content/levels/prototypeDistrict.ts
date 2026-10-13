import {
  BUILDING_COLOR_A,
  BUILDING_COLOR_C,
  building,
  car,
  pole,
  sign,
} from "./blockoutHelpers";
import type { LevelBlockout } from "./levelTypes";

/** Premier quartier : apprentissage du tir, de la destruction et des chaines. */
export const prototypeDistrict: LevelBlockout = {
  id: "level_proto_district",
  displayName: "Quartier de prototypage",
  // Niveau 1 : 3 tirs (spec 4.3).
  shotsAllowed: 3,
  targetScore: 15000,
  groundSize: 180,
  groundColor: "#3c4557",
  launcher: {
    position: { x: 0, y: 4, z: -46 },
    restDirection: { x: 0, y: 0.42, z: 1 },
  },
  boxes: [
    building("building_left_1", -16, -6, 12, 20, 12, BUILDING_COLOR_A),
    building("building_left_3", -16, 30, 12, 16, 12, BUILDING_COLOR_C),
    building("building_left_4", -16, 48, 12, 30, 12, BUILDING_COLOR_A),
    building("building_right_1", 16, -6, 12, 24, 12, BUILDING_COLOR_C),
    building("building_right_2", 16, 12, 12, 18, 12, BUILDING_COLOR_A),
    building("building_right_4", 16, 48, 12, 20, 12, BUILDING_COLOR_C),
    building("block_far", 0, 70, 44, 22, 14, BUILDING_COLOR_C),

    car("car_1", -4, -10),
    car("car_2", 4, 2),
    car("car_3", -4, 16),
    car("car_center", 0, 17),
    car("car_4", 4, 24),
    car("car_5", -4, 38),
    car("car_6", 4, 52),

    pole("pole_1", -8, -4),
    pole("pole_2", 8, 8),
    pole("pole_3", -8, 20),
    pole("pole_4", 8, 32),
    pole("pole_5", -8, 44),
    pole("pole_6", 8, 56),

    sign("sign_1", -9.5, 2),
    sign("sign_2", 9.5, 18),
    sign("sign_3", -9.5, 30),
    sign("sign_4", 9.5, 46),
  ],
  buildings: [
    { id: "tower_left", buildingId: "officeTower", position: { x: -13.5, y: 0, z: 18 } },
    { id: "tower_right", buildingId: "officeTower", position: { x: 13.5, y: 0, z: 36 } },
  ],
  secrets: [
    {
      id: "secret_proto_rooftop",
      name: "Survol des toits",
      position: { x: 0, y: 28, z: 10 },
      radius: 5,
      xpReward: 120,
      scoreBonus: 800,
    },
    {
      id: "secret_proto_alley",
      name: "Ruelle oubliee",
      position: { x: -24, y: 3, z: 40 },
      radius: 5,
      xpReward: 120,
      scoreBonus: 800,
    },
    {
      id: "secret_proto_far",
      name: "Bout de la rue",
      position: { x: 0, y: 6, z: 58 },
      radius: 5,
      xpReward: 150,
      scoreBonus: 1000,
    },
  ],
};
