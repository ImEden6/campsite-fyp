import type { Point } from '@/types/fabricTypes';

/** Snap world-space top-left (or any point) to the nearest grid intersection. */
export function snapWorldPointToGrid(point: Point, gridSize: number, enabled: boolean): Point {
  if (!enabled || gridSize <= 0) return point;
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}
