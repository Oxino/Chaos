import type { BlockoutBox, LevelBlockout } from "./levelTypes";

const BUILDING_COLOR_A = "#5c6b8a";
const BUILDING_COLOR_B = "#6f7f9e";
const BUILDING_COLOR_C = "#4a5873";
const CAR_COLOR = "#e8613c";
const POLE_COLOR = "#9aa7bd";
const SIGN_COLOR = "#4ec9b0";

function building(id: string, x: number, z: number, width: number, height: number, depth: number, color: string): BlockoutBox {
  return {
    id,
    position: { x, y: height / 2, z },
    size: { x: width, y: height, z: depth },
    color,
    mass: 0,
  };
}

function car(id: string, x: number, z: number): BlockoutBox {
  return {
    id,
    position: { x, y: 0.8, z },
    size: { x: 2, y: 1.6, z: 4.4 },
    color: CAR_COLOR,
    mass: 1200,
    destructibleId: "car",
  };
}

function pole(id: string, x: number, z: number): BlockoutBox {
  return {
    id,
    position: { x, y: 3.5, z },
    size: { x: 0.4, y: 7, z: 0.4 },
    color: POLE_COLOR,
    mass: 0,
    destructibleId: "lamppost",
  };
}

function sign(id: string, x: number, z: number): BlockoutBox {
  return {
    id,
    position: { x, y: 1.8, z },
    size: { x: 2.6, y: 3.6, z: 0.2 },
    color: SIGN_COLOR,
    mass: 0,
    destructibleId: "sign",
  };
}

/**
 * Blockout du quartier de prototypage (spec 19, Phase 1).
 * Uniquement des primitives : aucun asset .glb avant la Phase 7.
 */
export const prototypeDistrict: LevelBlockout = {
  id: "level_proto_district",
  displayName: "Quartier de prototypage",
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
    building("tower_back_left", -34, 26, 16, 40, 16, BUILDING_COLOR_B),
    building("tower_back_right", 34, 34, 16, 36, 16, BUILDING_COLOR_A),
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
};
