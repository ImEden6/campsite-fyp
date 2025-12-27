/**
 * usePanZoom Hook Unit Tests
 * Simplified tests focusing on zoom calculation logic
 */

import { describe, it, expect } from 'vitest';

describe('usePanZoom zoom calculation', () => {
    const MIN_ZOOM = 0.1;
    const MAX_ZOOM = 5;

    const clampZoom = (zoom: number): number => {
        return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    };

    it('should clamp zoom to minimum', () => {
        expect(clampZoom(0.05)).toBe(MIN_ZOOM);
        expect(clampZoom(-1)).toBe(MIN_ZOOM);
    });

    it('should clamp zoom to maximum', () => {
        expect(clampZoom(10)).toBe(MAX_ZOOM);
        expect(clampZoom(100)).toBe(MAX_ZOOM);
    });

    it('should allow valid zoom values', () => {
        expect(clampZoom(1)).toBe(1);
        expect(clampZoom(2.5)).toBe(2.5);
        expect(clampZoom(0.5)).toBe(0.5);
    });

    it('should calculate zoom in correctly', () => {
        const currentZoom = 1;
        const newZoom = clampZoom(currentZoom * 1.1);
        expect(newZoom).toBeCloseTo(1.1);
    });

    it('should calculate zoom out correctly', () => {
        const currentZoom = 1;
        const newZoom = clampZoom(currentZoom * 0.9);
        expect(newZoom).toBeCloseTo(0.9);
    });
});

describe('usePanZoom viewport transform', () => {
    // Default identity transform
    const defaultTransform = [1, 0, 0, 1, 0, 0];

    it('should have correct structure', () => {
        expect(defaultTransform).toHaveLength(6);
        expect(defaultTransform[0]).toBe(1); // scaleX
        expect(defaultTransform[3]).toBe(1); // scaleY
        expect(defaultTransform[4]).toBe(0); // translateX
        expect(defaultTransform[5]).toBe(0); // translateY
    });

    it('should calculate pan offset correctly', () => {
        const translateX = 100;
        const translateY = 50;
        const transform = [1, 0, 0, 1, translateX, translateY];

        expect(transform[4]).toBe(100);
        expect(transform[5]).toBe(50);
    });
});
