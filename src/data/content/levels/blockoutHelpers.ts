import type { BlockoutBox } from "./levelTypes";

export const BUILDING_COLOR_A = "#5c6b8a";
export const BUILDING_COLOR_B = "#6f7f9e";
export const BUILDING_COLOR_C = "#4a5873";

const CAR_COLOR = "#e8613c";
const POLE_COLOR = "#9aa7bd";
const SIGN_COLOR = "#4ec9b0";

export function building(
  id: string,
  x: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  color: string,
): BlockoutBox {
  return {
    id,
    position: { x, y: height / 2, z },
    size: { x: width, y: height, z: depth },
    color,
    mass: 0,
  };
}

export function car(id: string, x: number, z: number): BlockoutBox {
  return {
    id,
    position: { x, y: 0.8, z },
    size: { x: 2, y: 1.6, z: 4.4 },
    color: CAR_COLOR,
    mass: 350,
    destructibleId: "car",
  };
}

export function pole(id: string, x: number, z: number): BlockoutBox {
  return {
    id,
    position: { x, y: 3.5, z },
    size: { x: 0.4, y: 7, z: 0.4 },
    color: POLE_COLOR,
    mass: 0,
    destructibleId: "lamppost",
  };
}

export function sign(id: string, x: number, z: number): BlockoutBox {
  return {
    id,
    position: { x, y: 1.8, z },
    size: { x: 2.6, y: 3.6, z: 0.2 },
    color: SIGN_COLOR,
    mass: 0,
    destructibleId: "sign",
  };
}
