/**
 * useMapEditor Hook
 * Composite hook that orchestrates all editor hooks in the correct order.
 * 
 * This is the main entry point for the map editor functionality.
 * It initializes and wires together all editor hooks.
 * 
 * @example
 * ```tsx
 * function MapEditor() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const { isReady, zoom, toggleGrid, undo, redo } = useMapEditor({
 *     canvasId: 'map-canvas',
 *     containerRef,
 *   });
 *   // ...
 * }
 * ```
 */

import { useMemo } from 'react';
import { useFabricCanvas } from './useFabricCanvas';
import { usePanZoom } from './usePanZoom';
import { useSelectionManager } from './useSelectionManager';
import { useGrid } from './useGrid';
import { useInputHandler } from './useInputHandler';
import { useTransformHandler } from './useTransformHandler';
import { useModuleRenderer } from './useModuleRenderer';
import { useEditorShortcuts } from './useEditorShortcuts';
import { useCommandFacade } from './useCommandFacade';
import { useEditorLifecycle } from './useEditorLifecycle';
import { useMapStore } from '@/stores/mapStore';
import { createNewModule } from '@/utils/moduleFactory';
import type { FabricCanvas } from '@/types/fabricTypes';
import type { AnyModule } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseMapEditorOptions {
    /** ID of the canvas HTML element */
    canvasId: string;
    /** Ref to the container element */
    containerRef: React.RefObject<HTMLElement | null>;
    /** Canvas background color */
    backgroundColor?: string;
    /** Whether to show exit confirmation on unsaved changes */
    confirmOnExit?: boolean;
}

export interface UseMapEditorReturn {
    /** Whether the editor is ready (canvas initialized) */
    isReady: boolean;
    /** Error if canvas initialization failed */
    error: Error | null;
    /** Reference to the Fabric canvas */
    canvasRef: React.RefObject<FabricCanvas | null>;

    // Zoom/Pan
    /** Current zoom level */
    zoom: number;
    /** Whether pan mode is active */
    isPanMode: boolean;
    /** Zoom in */
    zoomIn: () => void;
    /** Zoom out */
    zoomOut: () => void;
    /** Fit canvas to screen */
    fitToScreen: () => void;
    /** Toggle pan mode */
    togglePanMode: () => void;

    // Grid
    /** Whether grid is visible */
    showGrid: boolean;
    /** Whether snap to grid is enabled */
    snapToGrid: boolean;
    /** Current grid size */
    gridSize: number;
    /** Toggle grid visibility */
    toggleGrid: () => void;
    /** Toggle snap to grid */
    toggleSnapToGrid: () => void;

    // Selection
    /** Get selected module IDs */
    getSelectedIds: () => string[];
    /** Clear selection */
    clearSelection: () => void;
    /** Restore selection */
    restoreSelection: (ids: string[]) => void;

    // Commands
    /** Undo last action */
    undo: () => void;
    /** Redo last undone action */
    redo: () => void;
    /** Whether undo is available */
    canUndo: boolean;
    /** Whether redo is available */
    canRedo: boolean;
    /** Execute an editor command */
    executeCommand: (command: any) => void;

    // Module operations
    /** Delete selected modules */
    deleteSelected: () => void;
    /** Copy selected modules */
    copySelected: () => void;
    /** Paste clipboard */
    paste: () => void;
    /** Duplicate selected modules */
    duplicateSelected: () => void;

    // State
    /** Whether map has unsaved changes */
    isDirty: boolean;
    /** Mark map as dirty */
    markDirty: () => void;
    /** Clear dirty flag */
    clearDirty: () => void;

    // Module renderer
    /** Force re-render all modules */
    forceRenderModules: () => void;

    // Canvas operations
    /** Request canvas render */
    requestRenderAll: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Composite hook for the map editor.
 * Orchestrates all editor hooks in the correct initialization order.
 */
export function useMapEditor(options: UseMapEditorOptions): UseMapEditorReturn {
    const {
        canvasId,
        containerRef,
        backgroundColor = 'oklch(0.928 0.006 264.5)',
        confirmOnExit = true,
    } = options;

    // Get map info for sizing
    const currentMap = useMapStore((state) => state.currentMap);
    const mapSize = useMemo(() => ({
        width: currentMap?.gridBounds?.width ?? 1000,
        height: currentMap?.gridBounds?.height ?? 800,
    }), [currentMap?.gridBounds]);

    // ========================================================================
    // 1. CORE CANVAS
    // ========================================================================
    const {
        canvasRef,
        isInitialized,
        error,
        setDimensions,
        requestRenderAll,
    } = useFabricCanvas(canvasId, containerRef, {
        backgroundColor,
        preserveObjectStacking: true,
    });

    // ========================================================================
    // 2. COMMAND FACADE (for undo/redo)
    // ========================================================================
    const {
        executeCommand,
        undo,
        redo,
        canUndo,
        canRedo,
        deleteModules,
        addModule,
    } = useCommandFacade();

    // ========================================================================
    // 3. PAN/ZOOM
    // ========================================================================
    const {
        zoom,
        isPanMode,
        zoomIn,
        zoomOut,
        fitToScreen,
        togglePanMode,
        handleWheel,
        startPan,
        updatePan,
        endPan,
    } = usePanZoom(canvasRef.current, {
        containerRef,
        mapSize,
    });

    // ========================================================================
    // 4. SELECTION MANAGER
    // ========================================================================
    const {
        getSelectedIds,
        clearSelection,
        restoreSelection,
    } = useSelectionManager(canvasRef.current, {
        preventLockedSelection: true,
    });

    // ========================================================================
    // 5. GRID
    // ========================================================================
    const {
        showGrid,
        snapToGrid,
        gridSize,
        toggleGrid,
        toggleSnapToGrid,
    } = useGrid(canvasRef.current, { mapSize });

    // ========================================================================
    // 6. INPUT HANDLER
    // ========================================================================
    useInputHandler(canvasRef.current, {
        getModule: (id) => useMapStore.getState().getModule(id),
        onAddModule: (type, position) => {
            const newModule = createNewModule(type, position);
            if (newModule) {
                addModule(newModule);
                markDirty();
            }
        },
        onPanStart: startPan,
        onPanMove: updatePan,
        onPanEnd: endPan,
    });

    // ========================================================================
    // 7. TRANSFORM HANDLER
    // ========================================================================
    useTransformHandler(canvasRef.current, {
        executeCommand,
    });

    // ========================================================================
    // 8. MODULE RENDERER
    // ========================================================================
    const {
        forceRender: forceRenderModules,
    } = useModuleRenderer(canvasRef.current, {
        restoreSelection,
    });

    // ========================================================================
    // 9. LIFECYCLE
    // ========================================================================
    const {
        isDirty,
        markDirty,
        clearDirty,
    } = useEditorLifecycle(canvasRef.current, {
        containerRef,
        setCanvasDimensions: setDimensions,
        confirmOnExit,
    });

    // ========================================================================
    // 10. MODULE OPERATIONS
    // ========================================================================
    const deleteSelected = () => {
        const ids = getSelectedIds();
        if (ids.length > 0) {
            deleteModules(ids);
            clearSelection();
            markDirty();
        }
    };

    // Local clipboard for copy/paste
    const clipboardRef: { current: AnyModule[] } = { current: [] };

    const copySelected = () => {
        const ids = getSelectedIds();
        if (ids.length > 0) {
            const modulesToCopy = ids
                .map((id) => useMapStore.getState().getModule(id))
                .filter((m): m is NonNullable<typeof m> => m !== undefined);
            clipboardRef.current = modulesToCopy;
        }
    };

    const paste = () => {
        const clipboard = clipboardRef.current;
        if (clipboard.length > 0) {
            for (const mod of clipboard) {
                const newMod = {
                    ...mod,
                    id: crypto.randomUUID(),
                    position: {
                        x: mod.position.x + 20,
                        y: mod.position.y + 20,
                    },
                };
                addModule(newMod);
            }
            markDirty();
        }
    };

    const duplicateSelected = () => {
        copySelected();
        paste();
    };

    // ========================================================================
    // 11. SHORTCUTS
    // ========================================================================
    useEditorShortcuts({
        undo,
        redo,
        deleteSelected,
        copySelected,
        paste,
        duplicateSelected,
        selectAll: () => {
            const allIds = (currentMap?.modules ?? []).map((m) => m.id);
            restoreSelection(allIds);
        },
        clearSelection,
        zoomIn,
        zoomOut,
        fitToScreen,
        togglePanMode,
    });

    // ========================================================================
    // 12. WHEEL EVENT
    // ========================================================================
    // Attach wheel handler for zoom
    if (canvasRef.current) {
        canvasRef.current.on('mouse:wheel', handleWheel);
    }

    return {
        isReady: isInitialized,
        error,
        canvasRef,

        // Zoom/Pan
        zoom,
        isPanMode,
        zoomIn,
        zoomOut,
        fitToScreen,
        togglePanMode,

        // Grid
        showGrid,
        snapToGrid,
        gridSize,
        toggleGrid,
        toggleSnapToGrid,

        // Selection
        getSelectedIds,
        clearSelection,
        restoreSelection,

        // Commands
        undo,
        redo,
        canUndo,
        canRedo,
        executeCommand,

        // Module operations
        deleteSelected,
        copySelected,
        paste,
        duplicateSelected,

        // State
        isDirty,
        markDirty,
        clearDirty,

        // Module renderer
        forceRenderModules,

        // Canvas operations
        requestRenderAll,
    };
}

export default useMapEditor;
