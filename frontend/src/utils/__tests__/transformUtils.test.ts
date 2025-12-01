/**
 * Unit tests for TransformUtils
 * Tests resize calculations, rotation, snap-to-grid, and boundary clamping
 */

import { describe, it, expect } from 'vitest';
import {
  calculateResize,
  calculateRotation,
  snapToGrid,
  snapSizeToGrid,
  clampPosition,
  clampSize,
  preserveAspectRatio,
  calculateBoundingBox,
  getBoundsCenter,
  rotatePoint,
  distance,
  type Bounds,
} from '../transformUtils';
import type { Position, Size } from '@/types';

describe('TransformUtils', () => {
  describe('calculateResize', () => {
    const currentBounds: Bounds = { x: 100, y: 100, width: 200, height: 100 };
    const startMousePosition: Position = { x: 300, y: 200 };

    it('should resize from bottom-right corner', () => {
      const mousePosition: Position = { x: 350, y: 250 };
      const result = calculateResize(
        'bottom-right',
        currentBounds,
        mousePosition,
        startMousePosition
      );

      expect(result.size.width).toBe(250);
      expect(result.size.height).toBe(150);
      expect(result.position.x).toBe(100);
      expect(result.position.y).toBe(100);
    });

    it('should resize from top-left corner', () => {
      const mousePosition: Position = { x: 320, y: 220 };
      const result = calculateResize(
        'top-left',
        currentBounds,
        mousePosition,
        startMousePosition
      );

      expect(result.size.width).toBe(180);
      expect(result.size.height).toBe(80);
      expect(result.position.x).toBe(120);
      expect(result.position.y).toBe(120);
    });

    it('should resize from middle-right edge', () => {
      const mousePosition: Position = { x: 350, y: 200 };
      const result = calculateResize(
        'middle-right',
        currentBounds,
        mousePosition,
        startMousePosition
      );

      expect(result.size.width).toBe(250);
      expect(result.size.height).toBe(100);
      expect(result.position.x).toBe(100);
    });

    it('should enforce minimum size constraints', () => {
      const mousePosition: Position = { x: 110, y: 110 };
      const result = calculateResize(
        'bottom-right',
        currentBounds,
        mousePosition,
        startMousePosition,
        { minSize: { width: 50, height: 50 } }
      );

      expect(result.size.width).toBe(50);
      expect(result.size.height).toBe(50);
    });

    it('should apply snap-to-grid', () => {
      const mousePosition: Position = { x: 347, y: 243 };
      const result = calculateResize(
        'bottom-right',
        currentBounds,
        mousePosition,
        startMousePosition,
        { snapToGrid: true, gridSize: 20 }
      );

      expect(result.size.width % 20).toBe(0);
      expect(result.size.height % 20).toBe(0);
      expect(result.position.x % 20).toBe(0);
      expect(result.position.y % 20).toBe(0);
    });

    it('should preserve aspect ratio when enabled', () => {
      const mousePosition: Position = { x: 400, y: 250 };
      const result = calculateResize(
        'bottom-right',
        currentBounds,
        mousePosition,
        startMousePosition,
        { preserveAspectRatio: true }
      );

      const aspectRatio = currentBounds.width / currentBounds.height;
      const resultAspectRatio = result.size.width / result.size.height;
      expect(Math.abs(resultAspectRatio - aspectRatio)).toBeLessThan(0.1);
    });
  });

  describe('calculateRotation', () => {
    const center: Position = { x: 200, y: 150 };

    it('should calculate 0 degrees for point to the right', () => {
      const mousePosition: Position = { x: 300, y: 150 };
      const result = calculateRotation(center, mousePosition);

      expect(result.angle).toBe(0);
    });

    it('should calculate 90 degrees for point below', () => {
      const mousePosition: Position = { x: 200, y: 250 };
      const result = calculateRotation(center, mousePosition);

      expect(result.angle).toBe(90);
    });

    it('should calculate 180 degrees for point to the left', () => {
      const mousePosition: Position = { x: 100, y: 150 };
      const result = calculateRotation(center, mousePosition);

      expect(result.angle).toBe(180);
    });

    it('should calculate 270 degrees for point above', () => {
      const mousePosition: Position = { x: 200, y: 50 };
      const result = calculateRotation(center, mousePosition);

      expect(result.angle).toBe(270);
    });

    it('should snap to 15-degree increments when specified', () => {
      const mousePosition: Position = { x: 250, y: 120 };
      const result = calculateRotation(center, mousePosition, { snapAngle: 15 });

      expect(result.angle % 15).toBe(0);
    });

    it('should normalize angle to 0-360 range', () => {
      const mousePosition: Position = { x: 250, y: 100 };
      const result = calculateRotation(center, mousePosition);

      expect(result.angle).toBeGreaterThanOrEqual(0);
      expect(result.angle).toBeLessThan(360);
    });
  });

  describe('snapToGrid', () => {
    it('should snap position to grid', () => {
      const position: Position = { x: 147, y: 233 };
      const result = snapToGrid(position, 20);

      expect(result.x).toBe(140);
      expect(result.y).toBe(240);
    });

    it('should handle exact grid positions', () => {
      const position: Position = { x: 200, y: 300 };
      const result = snapToGrid(position, 20);

      expect(result.x).toBe(200);
      expect(result.y).toBe(300);
    });

    it('should round to nearest grid point', () => {
      const position: Position = { x: 155, y: 165 };
      const result = snapToGrid(position, 20);

      expect(result.x).toBe(160);
      expect(result.y).toBe(160);
    });
  });

  describe('snapSizeToGrid', () => {
    it('should snap size to grid', () => {
      const size: Size = { width: 147, height: 233 };
      const result = snapSizeToGrid(size, 20);

      expect(result.width).toBe(140);
      expect(result.height).toBe(240);
    });

    it('should handle exact grid sizes', () => {
      const size: Size = { width: 200, height: 300 };
      const result = snapSizeToGrid(size, 20);

      expect(result.width).toBe(200);
      expect(result.height).toBe(300);
    });
  });

  describe('clampPosition', () => {
    const size: Size = { width: 100, height: 50 };
    const bounds = { minX: 0, minY: 0, maxX: 500, maxY: 400 };

    it('should not clamp position within bounds', () => {
      const position: Position = { x: 200, y: 150 };
      const result = clampPosition(position, size, bounds);

      expect(result.x).toBe(200);
      expect(result.y).toBe(150);
    });

    it('should clamp position at minimum bounds', () => {
      const position: Position = { x: -50, y: -20 };
      const result = clampPosition(position, size, bounds);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should clamp position at maximum bounds', () => {
      const position: Position = { x: 450, y: 380 };
      const result = clampPosition(position, size, bounds);

      expect(result.x).toBe(400);
      expect(result.y).toBe(350);
    });

    it('should account for module size when clamping', () => {
      const position: Position = { x: 480, y: 370 };
      const result = clampPosition(position, size, bounds);

      expect(result.x).toBe(400);
      expect(result.y).toBe(350);
    });
  });

  describe('clampSize', () => {
    const minSize: Size = { width: 20, height: 20 };
    const maxSize: Size = { width: 500, height: 400 };

    it('should not clamp size within bounds', () => {
      const size: Size = { width: 200, height: 150 };
      const result = clampSize(size, minSize, maxSize);

      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
    });

    it('should clamp to minimum size', () => {
      const size: Size = { width: 10, height: 15 };
      const result = clampSize(size, minSize, maxSize);

      expect(result.width).toBe(20);
      expect(result.height).toBe(20);
    });

    it('should clamp to maximum size', () => {
      const size: Size = { width: 600, height: 500 };
      const result = clampSize(size, minSize, maxSize);

      expect(result.width).toBe(500);
      expect(result.height).toBe(400);
    });

    it('should use default minimum size when not provided', () => {
      const size: Size = { width: 10, height: 15 };
      const result = clampSize(size);

      expect(result.width).toBe(20);
      expect(result.height).toBe(20);
    });
  });

  describe('preserveAspectRatio', () => {
    const originalSize: Size = { width: 200, height: 100 };

    it('should preserve aspect ratio based on width', () => {
      const size: Size = { width: 300, height: 200 };
      const result = preserveAspectRatio(size, originalSize, 'width');

      expect(result.width).toBe(300);
      expect(result.height).toBe(150);
    });

    it('should preserve aspect ratio based on height', () => {
      const size: Size = { width: 300, height: 200 };
      const result = preserveAspectRatio(size, originalSize, 'height');

      expect(result.width).toBe(400);
      expect(result.height).toBe(200);
    });

    it('should preserve aspect ratio based on larger change', () => {
      const size: Size = { width: 400, height: 150 };
      const result = preserveAspectRatio(size, originalSize, 'both');

      const aspectRatio = originalSize.width / originalSize.height;
      const resultAspectRatio = result.width / result.height;
      expect(Math.abs(resultAspectRatio - aspectRatio)).toBeLessThan(0.01);
    });
  });

  describe('calculateBoundingBox', () => {
    it('should calculate bounding box for single module', () => {
      const modules = [
        { position: { x: 100, y: 100 }, size: { width: 200, height: 100 }, rotation: 0 },
      ];
      const result = calculateBoundingBox(modules);

      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
      expect(result.width).toBe(200);
      expect(result.height).toBe(100);
    });

    it('should calculate bounding box for multiple modules', () => {
      const modules = [
        { position: { x: 100, y: 100 }, size: { width: 100, height: 100 }, rotation: 0 },
        { position: { x: 250, y: 150 }, size: { width: 150, height: 100 }, rotation: 0 },
      ];
      const result = calculateBoundingBox(modules);

      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
      expect(result.width).toBe(300);
      expect(result.height).toBe(150);
    });

    it('should return zero bounds for empty array', () => {
      const result = calculateBoundingBox([]);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
    });
  });

  describe('getBoundsCenter', () => {
    it('should calculate center of bounds', () => {
      const bounds: Bounds = { x: 100, y: 100, width: 200, height: 100 };
      const result = getBoundsCenter(bounds);

      expect(result.x).toBe(200);
      expect(result.y).toBe(150);
    });

    it('should handle bounds at origin', () => {
      const bounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };
      const result = getBoundsCenter(bounds);

      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
    });
  });

  describe('rotatePoint', () => {
    const center: Position = { x: 100, y: 100 };

    it('should rotate point 90 degrees', () => {
      const point: Position = { x: 150, y: 100 };
      const result = rotatePoint(point, center, 90);

      expect(Math.round(result.x)).toBe(100);
      expect(Math.round(result.y)).toBe(150);
    });

    it('should rotate point 180 degrees', () => {
      const point: Position = { x: 150, y: 100 };
      const result = rotatePoint(point, center, 180);

      expect(Math.round(result.x)).toBe(50);
      expect(Math.round(result.y)).toBe(100);
    });

    it('should rotate point 270 degrees', () => {
      const point: Position = { x: 150, y: 100 };
      const result = rotatePoint(point, center, 270);

      expect(Math.round(result.x)).toBe(100);
      expect(Math.round(result.y)).toBe(50);
    });

    it('should return same point for 0 degrees', () => {
      const point: Position = { x: 150, y: 100 };
      const result = rotatePoint(point, center, 0);

      expect(result.x).toBe(150);
      expect(result.y).toBe(100);
    });

    it('should return same point for 360 degrees', () => {
      const point: Position = { x: 150, y: 100 };
      const result = rotatePoint(point, center, 360);

      expect(Math.round(result.x)).toBe(150);
      expect(Math.round(result.y)).toBe(100);
    });
  });

  describe('distance', () => {
    it('should calculate distance between two points', () => {
      const p1: Position = { x: 0, y: 0 };
      const p2: Position = { x: 3, y: 4 };
      const result = distance(p1, p2);

      expect(result).toBe(5);
    });

    it('should return 0 for same point', () => {
      const p1: Position = { x: 100, y: 100 };
      const p2: Position = { x: 100, y: 100 };
      const result = distance(p1, p2);

      expect(result).toBe(0);
    });

    it('should calculate horizontal distance', () => {
      const p1: Position = { x: 0, y: 0 };
      const p2: Position = { x: 10, y: 0 };
      const result = distance(p1, p2);

      expect(result).toBe(10);
    });

    it('should calculate vertical distance', () => {
      const p1: Position = { x: 0, y: 0 };
      const p2: Position = { x: 0, y: 10 };
      const result = distance(p1, p2);

      expect(result).toBe(10);
    });
  });
});
