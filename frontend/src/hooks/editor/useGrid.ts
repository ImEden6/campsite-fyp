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

import type React from 'react';
import { useCallback, useRef, useMemo, useEffect } from 'react';
import * as fabricImpl from 'fabric';
import { useEditorStore } from '@/stores/editorStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fabric: any = fabricImpl;
import type { FabricCanvas, FabricObject, Point } from '@/types/fabricTypes';
import { isGridObject } from '@/types/fabricTypes';
import { snapWorldPointToGrid } from '@/utils/gridSnap';

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
    /** When false, skip drawing (Fabric canvas not mounted yet) */
    editorReady?: boolean;
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
 * @param canvasRef - Ref to the Fabric canvas (always read `.current` when drawing)
 * @param options - Grid options
 * @returns Grid API
 * 
 * @example
 * ```tsx
 * const { showGrid, toggleGrid, snapPointToGrid } = useGrid(
 *   canvasRef,
 *   { mapSize: { width: 800, height: 600 }, editorReady: isInitialized }
 * );
 * ```
 */
export function useGrid(
    canvasRef: React.RefObject<FabricCanvas | null>,
    options: UseGridOptions = {}
): UseGridReturn {
    const {
        mapSize = { width: 1000, height: 800 },
        gridColor = DEFAULT_GRID_COLOR,
        gridOpacity = DEFAULT_GRID_OPACITY,
        editorReady = true,
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
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Always scan the canvas — Fabric may drop refs after remove, so gridObjectsRef can be stale
        const removable = canvas.getObjects().filter((o) => isGridObject(o));
        for (const obj of removable) {
            canvas.remove(obj);
            // Do not dispose() — disposing lines after remove can break subsequent adds on the same canvas
        }
        gridObjectsRef.current = [];

        canvas.requestRenderAll();
    }, [canvasRef]);

    /**
     * Render grid lines on canvas
     */
    const renderGrid = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Clear existing grid first
        clearGrid();

        if (!showGrid) return;

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
            }) as FabricObject;
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
            }) as FabricObject;
            newGridObjects.push(line);
        }

        // Add all grid objects to canvas and send to back
        for (const obj of newGridObjects) {
            canvas.add(obj);
            canvas.sendObjectToBack(obj);
        }

        gridObjectsRef.current = newGridObjects;
        canvas.requestRenderAll();
    }, [canvasRef, showGrid, gridSize, mapSize.width, mapSize.height, gridColor, gridOpacity, clearGrid]);

    // ========================================================================
    // SNAP TO GRID
    // ========================================================================

    /**
     * Snap a point to the nearest grid intersection
     */
    const snapPointToGrid = useCallback(
        (point: Point): Point => snapWorldPointToGrid(point, gridSize, snapToGrid),
        [snapToGrid, gridSize]
    );

    // ========================================================================
    // EFFECTS
    // ========================================================================

    /**
     * Re-render grid when settings change.
     * Depends on `editorReady` so we run after Fabric mounts (ref.current is set without a ref identity change).
     */
    useEffect(() => {
        if (!editorReady) return;
        if (!canvasRef.current) return;
        renderGrid();
    }, [editorReady, canvasRef, showGrid, gridSize, mapSize.width, mapSize.height, renderGrid]);

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

    return useMemo(() => ({
        showGrid,
        snapToGrid,
        gridSize,
        toggleGrid,
        toggleSnapToGrid,
        setGridSize,
        snapPointToGrid,
        renderGrid,
        clearGrid,
    }), [
        showGrid,
        snapToGrid,
        gridSize,
        toggleGrid,
        toggleSnapToGrid,
        setGridSize,
        snapPointToGrid,
        renderGrid,
        clearGrid,
    ]);
}

export default useGrid;
