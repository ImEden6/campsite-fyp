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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
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
import type { FabricCanvas, Point } from '@/types/fabricTypes';
import type { AnyModule, ModuleType } from '@/types';

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
    /** Callback when the save shortcut is triggered */
    onSave?: () => void;
    /** After a module is secondary-clicked: selection is restored first, then this runs */
    onModuleContextMenu?: (moduleId: string) => void;
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
    /** Fabric viewport translation X (screen px); keeps rulers aligned while panning/zooming */
    panX: number;
    /** Fabric viewport translation Y (screen px) */
    panY: number;

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
        onSave,
        onModuleContextMenu: onModuleContextMenuFromParent,
    } = options;

    // ========================================================================
    // 0. SHARED STATE (Interaction Guard)
    // ========================================================================
    const sharedInteractingIdRef = useRef<string | null>(null);
    const setInteractingId = useCallback((id: string | null) => {
        sharedInteractingIdRef.current = id;
    }, []);

    // Get map info for sizing
    const currentMap = useMapStore((state) => state.currentMap);
    /** World size matches the background image footprint, not a larger gridBounds (avoids empty canvas margins). */
    const mapSize = useMemo(() => {
        const m = currentMap;
        if (!m) {
            return { width: 1000, height: 800 };
        }
        const bg = m.backgroundLayer;
        if (bg?.size?.width && bg?.size?.height) {
            const px = bg.position?.x ?? 0;
            const py = bg.position?.y ?? 0;
            return {
                width: Math.max(1, Math.ceil(px + bg.size.width)),
                height: Math.max(1, Math.ceil(py + bg.size.height)),
            };
        }
        const img = m.imageSize;
        if (img?.width && img?.height) {
            return { width: img.width, height: img.height };
        }
        const gb = m.gridBounds;
        return {
            width: gb?.width ?? 1000,
            height: gb?.height ?? 800,
        };
    }, [
        currentMap?.backgroundLayer?.size?.width,
        currentMap?.backgroundLayer?.size?.height,
        currentMap?.backgroundLayer?.position?.x,
        currentMap?.backgroundLayer?.position?.y,
        currentMap?.imageSize?.width,
        currentMap?.imageSize?.height,
        currentMap?.gridBounds?.width,
        currentMap?.gridBounds?.height,
    ]);

    const useWorldCanvas =
        mapSize.width > 0 && mapSize.height > 0;

    // Stable options for hooks
    const canvasOptions = useMemo(
        () => ({
            backgroundColor,
            preserveObjectStacking: true,
            ...(useWorldCanvas
                ? { worldSize: { width: mapSize.width, height: mapSize.height } }
                : {}),
        }),
        [backgroundColor, useWorldCanvas, mapSize.width, mapSize.height]
    );

    // ========================================================================
    // 1. CORE CANVAS
    // ========================================================================
    const {
        canvasRef,
        isInitialized,
        error,
        setDimensions,
        requestRenderAll,
    } = useFabricCanvas(canvasId, containerRef, canvasOptions);

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
    const panZoomOptions = useMemo(() => ({
        containerRef,
        mapSize,
    }), [containerRef, mapSize]);

    const {
        zoom,
        isPanMode,
        zoomIn,
        zoomOut,
        fitToScreen,
        togglePanMode,
        setPanMode,
        handleWheel,
        endPan,
        startPan,
        updatePan,
    } = usePanZoom(canvasRef.current, panZoomOptions);

    const activeTool = useEditorStore((state) => state.activeTool);

    useEffect(() => {
        if (isPanMode) {
            const t = useEditorStore.getState().activeTool;
            if (t !== 'pan' && t !== 'add') {
                useEditorStore.getState().setActiveTool('pan');
            }
        } else {
            const t = useEditorStore.getState().activeTool;
            if (t === 'pan') {
                useEditorStore.getState().setActiveTool('select');
            }
        }
    }, [isPanMode]);

    useEffect(() => {
        if (activeTool === 'add' && isPanMode) {
            setPanMode(false);
        }
    }, [activeTool, isPanMode, setPanMode]);

    const selectionOptions = useMemo(() => ({
        // Locked pads still need to be selectable so users can open properties / unlock (transforms stay Fabric-locked).
        preventLockedSelection: false,
        setInteractingId,
    }), [setInteractingId]);

    const {
        getSelectedIds,
        clearSelection,
        restoreSelection,
    } = useSelectionManager(canvasRef.current, selectionOptions);

    const rendererOptions = useMemo(() => ({
        restoreSelection,
        externalInteractingIdRef: sharedInteractingIdRef,
        blockModuleInteraction: isPanMode,
    }), [restoreSelection, isPanMode]);

    const {
        forceRender: forceRenderModules,
    } = useModuleRenderer(canvasRef.current, rendererOptions);

    const gridOptions = useMemo(
        () => ({ mapSize, editorReady: isInitialized }),
        [mapSize, isInitialized]
    );

    const {
        showGrid,
        snapToGrid,
        gridSize,
        toggleGrid,
        toggleSnapToGrid,
    } = useGrid(canvasRef, gridOptions);

    const handleModuleContextMenu = useCallback(
        (moduleId: string, _e: MouseEvent) => {
            restoreSelection([moduleId]);
            onModuleContextMenuFromParent?.(moduleId);
        },
        [restoreSelection, onModuleContextMenuFromParent]
    );

    // ========================================================================
    // 6. INPUT HANDLER
    // ========================================================================
    const inputHandlerOptions = useMemo(() => ({
        isPanMode,
        getModule: (id: string) => useMapStore.getState().getModule(id),
        onAddModule: (type: ModuleType, position: Point) => {
            const newModule = createNewModule(type, position);
            if (newModule) {
                addModule(newModule);
                // Use store directly to avoid hoisting issues with markDirty from useEditorLifecycle
                useMapStore.getState().markDirty();
            }
        },
        onPanStart: startPan,
        onPanMove: updatePan,
        onPanEnd: endPan,
        onModuleContextMenu: handleModuleContextMenu,
    }), [addModule, endPan, isPanMode, startPan, updatePan, handleModuleContextMenu]);

    useInputHandler(canvasRef.current, inputHandlerOptions);

    // ========================================================================
    // 7. TRANSFORM HANDLER
    // ========================================================================
    const transformOptions = useMemo(() => ({
        executeCommand,
    }), [executeCommand]);

    useTransformHandler(canvasRef.current, transformOptions);

    // Renderer is now initialized earlier to provide setInteractingId to selection manager

    // ========================================================================
    // 9. LIFECYCLE
    // ========================================================================
    const lifecycleOptions = useMemo(
        () => ({
            containerRef,
            confirmOnExit,
            ...(useWorldCanvas ? {} : { setCanvasDimensions: setDimensions }),
        }),
        [containerRef, setDimensions, confirmOnExit, useWorldCanvas]
    );

    const {
        isDirty,
        markDirty,
        clearDirty,
    } = useEditorLifecycle(canvasRef.current, lifecycleOptions);

    // ========================================================================
    // 10. MODULE OPERATIONS
    // ========================================================================
    const deleteSelected = useCallback(() => {
        const ids = getSelectedIds();
        if (ids.length > 0) {
            deleteModules(ids);
            clearSelection();
            markDirty();
        }
    }, [getSelectedIds, deleteModules, clearSelection, markDirty]);

    // Local clipboard for copy/paste
    const clipboardRef: { current: AnyModule[] } = { current: [] };

    const copySelected = useCallback(() => {
        const ids = getSelectedIds();
        if (ids.length > 0) {
            const modulesToCopy = ids
                .map((id) => useMapStore.getState().getModule(id))
                .filter((m): m is NonNullable<typeof m> => m !== undefined);
            clipboardRef.current = modulesToCopy;
        }
    }, [getSelectedIds]);

    const paste = useCallback(() => {
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
    }, [addModule, markDirty]);

    const duplicateSelected = useCallback(() => {
        copySelected();
        paste();
    }, [copySelected, paste]);

    // ========================================================================
    // 11. SHORTCUTS
    // ========================================================================
    const shortcutOptions = useMemo(() => ({
        executeCommand,
        undo,
        redo,
        deleteSelected,
        copySelected,
        paste,
        duplicateSelected,
        selectAll: () => {
            const currentModules = useMapStore.getState().getModules();
            const allIds = currentModules.map((m) => m.id);
            restoreSelection(allIds);
        },
        clearSelection,
        zoomIn,
        zoomOut,
        fitToScreen,
        togglePanMode,
        save: onSave,
    }), [
        executeCommand, undo, redo, deleteSelected, copySelected, paste,
        duplicateSelected, restoreSelection, clearSelection,
        zoomIn, zoomOut, fitToScreen, togglePanMode, onSave
    ]);

    useEditorShortcuts(shortcutOptions);

    // Attach wheel handler for zoom
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.on('mouse:wheel', handleWheel);
        return () => {
            canvas.off('mouse:wheel', handleWheel);
        };
    }, [canvasRef, handleWheel]);

    const [viewportPan, setViewportPan] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!isInitialized) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        let rafId = 0;
        const syncFromCanvas = () => {
            const vpt = canvas.viewportTransform;
            if (!vpt) return;
            const x = vpt[4] ?? 0;
            const y = vpt[5] ?? 0;
            setViewportPan((prev) => (prev.x === x && prev.y === y ? prev : { x, y }));
        };

        const scheduleSync = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                rafId = 0;
                syncFromCanvas();
            });
        };

        canvas.on('after:render', scheduleSync);
        syncFromCanvas();

        return () => {
            canvas.off('after:render', scheduleSync);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [isInitialized]);

    // Memoized return object to prevent downstream loop
    return useMemo(() => ({
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
        panX: viewportPan.x,
        panY: viewportPan.y,

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
    }), [
        isInitialized, error, canvasRef,
        zoom, isPanMode, zoomIn, zoomOut, fitToScreen, togglePanMode,
        viewportPan.x, viewportPan.y,
        showGrid, snapToGrid, gridSize, toggleGrid, toggleSnapToGrid,
        getSelectedIds, clearSelection, restoreSelection,
        undo, redo, canUndo, canRedo, executeCommand,
        deleteSelected, copySelected, paste, duplicateSelected,
        isDirty, markDirty, clearDirty,
        forceRenderModules,
        requestRenderAll,
    ]);
}

export default useMapEditor;
