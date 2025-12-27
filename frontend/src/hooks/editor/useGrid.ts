/**
 * useGrid Hook
 * Manages grid rendering and snap-to-grid functionality.
 * 
 * This hook is **stateless** - it consumes grid settings from editorStore
 * rather than managing its own state. This ensures grid settings persist
 * across sessions and map changes.
 * 
 * @see editorStore for showGrid, snapToGrid, gridSize state
 * @see useFabricCanvas - Required dependency for canvas operations
 */

import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { FabricCanvas, FabricObject, Point } from '@/types/fabricTypes';
import { isGridObject } from '@/types/fabricTypes';

// ============================================================================
// TYPES
// ============================================================================

export interface UseGridOptions {
    /** Map size for grid bounds */
    mapSize?: { width: number; height: number };
    /** Grid line color */
    gridColor?: string;
    /** Grid line opacity */
    gridOpacity?: number;
}

export interface UseGridReturn {
    /** Whether grid is currently visible */
    showGrid: boolean;
    /** Whether snap to grid is enabled */
    snapToGrid: boolean;
    /** Current grid size */
    gridSize: number;
    /** Toggle grid visibility */
    toggleGrid: () => void;
    /** Toggle snap to grid */
    toggleSnapToGrid: () => void;
    /** Set grid size */
    setGridSize: (size: number) => void;
    /** Snap a point to the grid */
    snapPointToGrid: (point: Point) => Point;
    /** Render grid on canvas */
    renderGrid: () => void;
    /** Clear grid from canvas */
    clearGrid: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_GRID_COLOR = 'oklch(0.708 0.012 264.4)';
const DEFAULT_GRID_OPACITY = 0.5;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for grid rendering and snap-to-grid functionality.
 * Stateless - consumes grid settings from editorStore.
 * 
 * @param canvas - Fabric canvas instance (or null if not ready)
 * @param options - Grid options
 * @returns Grid API
 * 
 * @example
 * ```tsx
 * const { showGrid, toggleGrid, snapPointToGrid } = useGrid(
 *   canvasRef.current,
 *   { mapSize: { width: 800, height: 600 } }
 * );
 * ```
 */
export function useGrid(
    canvas: FabricCanvas | null,
    options: UseGridOptions = {}
): UseGridReturn {
    const {
        mapSize = { width: 1000, height: 800 },
        gridColor = DEFAULT_GRID_COLOR,
        gridOpacity = DEFAULT_GRID_OPACITY,
    } = options;

    // Consume from editorStore (stateless pattern)
    const showGrid = useEditorStore((state) => state.showGrid);
    const snapToGrid = useEditorStore((state) => state.snapToGrid);
    const gridSize = useEditorStore((state) => state.gridSize);
    const toggleGridStore = useEditorStore((state) => state.toggleGrid);
    const toggleSnapToGridStore = useEditorStore((state) => state.toggleSnapToGrid);
    const setGridSizeStore = useEditorStore((state) => state.setGridSize);

    // Track grid objects for cleanup
    const gridObjectsRef = useRef<FabricObject[]>([]);

    // ========================================================================
    // GRID RENDERING
    // ========================================================================

    /**
     * Clear existing grid lines from canvas
     */
    const clearGrid = useCallback(() => {
        if (!canvas) return;

        // Remove tracked grid objects
        for (const obj of gridObjectsRef.current) {
            canvas.remove(obj);
        }
        gridObjectsRef.current = [];

        // Also remove any orphaned grid objects (safety)
        const allObjects = canvas.getObjects();
        for (const obj of allObjects) {
            if (isGridObject(obj)) {
                canvas.remove(obj);
            }
        }

        canvas.requestRenderAll();
    }, [canvas]);

    /**
     * Render grid lines on canvas
     */
    const renderGrid = useCallback(() => {
        if (!canvas) return;

        // Clear existing grid first
        clearGrid();

        if (!showGrid) return;

        // Use dynamic import to avoid circular dependencies
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fabric = (window as any).fabric;
        if (!fabric?.Line) {
            console.warn('[useGrid] Fabric.Line not available');
            return;
        }

        const newGridObjects: FabricObject[] = [];

        // Create vertical lines
        for (let x = 0; x <= mapSize.width; x += gridSize) {
            const line = new fabric.Line([x, 0, x, mapSize.height], {
                stroke: gridColor,
                strokeWidth: 1,
                selectable: false,
                evented: false,
                opacity: gridOpacity,
                data: { isGrid: true },
            });
            newGridObjects.push(line);
        }

        // Create horizontal lines
        for (let y = 0; y <= mapSize.height; y += gridSize) {
            const line = new fabric.Line([0, y, mapSize.width, y], {
                stroke: gridColor,
                strokeWidth: 1,
                selectable: false,
                evented: false,
                opacity: gridOpacity,
                data: { isGrid: true },
            });
            newGridObjects.push(line);
        }

        // Add all grid objects to canvas and send to back
        for (const obj of newGridObjects) {
            canvas.add(obj);
            canvas.sendObjectToBack(obj);
        }

        gridObjectsRef.current = newGridObjects;
        canvas.requestRenderAll();
    }, [canvas, showGrid, gridSize, mapSize.width, mapSize.height, gridColor, gridOpacity, clearGrid]);

    // ========================================================================
    // SNAP TO GRID
    // ========================================================================

    /**
     * Snap a point to the nearest grid intersection
     */
    const snapPointToGrid = useCallback((point: Point): Point => {
        if (!snapToGrid) return point;

        return {
            x: Math.round(point.x / gridSize) * gridSize,
            y: Math.round(point.y / gridSize) * gridSize,
        };
    }, [snapToGrid, gridSize]);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    /**
     * Re-render grid when settings change
     */
    useEffect(() => {
        if (!canvas) return;

        renderGrid();

        // Cleanup on unmount
        return () => {
            clearGrid();
        };
    }, [canvas, showGrid, gridSize, renderGrid, clearGrid]);

    // ========================================================================
    // API
    // ========================================================================

    const toggleGrid = useCallback(() => {
        toggleGridStore();
    }, [toggleGridStore]);

    const toggleSnapToGrid = useCallback(() => {
        toggleSnapToGridStore();
    }, [toggleSnapToGridStore]);

    const setGridSize = useCallback((size: number) => {
        setGridSizeStore(size);
    }, [setGridSizeStore]);

    return {
        showGrid,
        snapToGrid,
        gridSize,
        toggleGrid,
        toggleSnapToGrid,
        setGridSize,
        snapPointToGrid,
        renderGrid,
        clearGrid,
    };
}

export default useGrid;
