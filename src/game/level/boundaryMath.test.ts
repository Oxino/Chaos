import { describe, expect, it } from "vitest";
import { isOutsideMap, mapBounds } from "./boundaryMath";

const bounds = mapBounds(100, 2, -10, 72);

describe("map bounds", () => {
  it("keeps positions inside the playable volume", () => {
    expect(isOutsideMap({ x: 0, y: 1, z: 0 }, bounds)).toBe(false);
    expect(isOutsideMap({ x: 52, y: 1, z: 0 }, bounds)).toBe(false);
  });

  it("detects side, top and bottom escapes", () => {
    expect(isOutsideMap({ x: 53, y: 1, z: 0 }, bounds)).toBe(true);
    expect(isOutsideMap({ x: 0, y: 73, z: 0 }, bounds)).toBe(true);
    expect(isOutsideMap({ x: 0, y: -11, z: 0 }, bounds)).toBe(true);
  });
});