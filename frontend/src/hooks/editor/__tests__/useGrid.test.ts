/**
 * useGrid Hook Unit Tests
 * Simplified tests focusing on store integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useEditorStore } from '@/stores/editorStore';

// Test the store state that useGrid consumes
describe('useGrid store integration', () => {
    beforeEach(() => {
        useEditorStore.setState({
            showGrid: true,
            snapToGrid: true,
            gridSize: 20,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should have initial grid state', () => {
        const state = useEditorStore.getState();
        expect(state.showGrid).toBe(true);
        expect(state.snapToGrid).toBe(true);
        expect(state.gridSize).toBe(20);
    });

    it('should toggle grid via store', () => {
        useEditorStore.getState().toggleGrid();
        expect(useEditorStore.getState().showGrid).toBe(false);

        useEditorStore.getState().toggleGrid();
        expect(useEditorStore.getState().showGrid).toBe(true);
    });

    it('should toggle snap to grid via store', () => {
        useEditorStore.getState().toggleSnapToGrid();
        expect(useEditorStore.getState().snapToGrid).toBe(false);

        useEditorStore.getState().toggleSnapToGrid();
        expect(useEditorStore.getState().snapToGrid).toBe(true);
    });

    it('should set grid size via store', () => {
        useEditorStore.getState().setGridSize(50);
        expect(useEditorStore.getState().gridSize).toBe(50);
    });
});

// Test snap position logic in isolation
describe('Grid snap calculation', () => {
    const snapToGrid = (value: number, gridSize: number): number => {
        return Math.round(value / gridSize) * gridSize;
    };

    it('should snap to nearest grid point', () => {
        expect(snapToGrid(27, 20)).toBe(20);
        expect(snapToGrid(33, 20)).toBe(40);
        expect(snapToGrid(10, 20)).toBe(20);
        expect(snapToGrid(9, 20)).toBe(0);
    });

    it('should work with different grid sizes', () => {
        expect(snapToGrid(27, 10)).toBe(30);
        expect(snapToGrid(27, 50)).toBe(50);
        expect(snapToGrid(74, 50)).toBe(50);
        expect(snapToGrid(76, 50)).toBe(100);
    });
});
