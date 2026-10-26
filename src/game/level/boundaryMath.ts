export interface MapBounds {
  readonly halfWidth: number;
  readonly halfDepth: number;
  readonly lowerY: number;
  readonly upperY: number;
}

export interface PositionLike {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export function mapBounds(
  groundSize: number,
  margin: number,
  lowerY: number,
  upperY: number,
): MapBounds {
  return {
    halfWidth: groundSize / 2 + margin,
    halfDepth: groundSize / 2 + margin,
    lowerY,
    upperY,
  };
}

export function isOutsideMap(position: PositionLike, bounds: MapBounds): boolean {
  return (
    Math.abs(position.x) > bounds.halfWidth ||
    Math.abs(position.z) > bounds.halfDepth ||
    position.y < bounds.lowerY ||
    position.y > bounds.upperY
  );
}