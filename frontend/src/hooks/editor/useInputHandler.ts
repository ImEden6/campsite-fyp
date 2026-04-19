/**
 * useInputHandler Hook
 * Handles mouse/pointer input for the map editor.
 * 
 * Manages click-to-add, cursor changes, and integrates with usePanZoom for panning.
 * 
 * @see useFabricCanvas - Required dependency for canvas operations
 * @see usePanZoom - Required for pan functionality
 * @see editorStore - Consumes activeTool, moduleToAdd
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { FabricCanvas, FabricEvent, Point, FabricObject } from '@/types/fabricTypes';
import { getModuleId, isBackgroundObject, isGridObject } from '@/types/fabricTypes';
import type { ModuleType, AnyModule } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseInputHandlerOptions {
    /** Hand tool / canvas pan mode from usePanZoom (before activeTool syncs to 'pan') */
    isPanMode?: boolean;
    /** Callback when a module should be added */
    onAddModule?: (type: ModuleType, position: Point) => void;
    /** Callback to get module data by ID (for cursor changes) */
    getModule?: (id: string) => AnyModule | undefined;
    /** Pan start handler from usePanZoom */
    onPanStart?: (e: MouseEvent) => void;
    /** Pan move handler from usePanZoom */
    onPanMove?: (e: MouseEvent) => void;
    /** Pan end handler from usePanZoom */
    onPanEnd?: () => void;
    /** Secondary click on a module (e.g. open properties); runs before pan/add handling */
    onModuleContextMenu?: (moduleId: string, e: MouseEvent) => void;
}

export interface UseInputHandlerReturn {
    /** Attach input handlers to canvas */
    attach: () => void;
    /** Detach input handlers from canvas */
    detach: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CURSOR_DEFAULT = 'default';
const CURSOR_CROSSHAIR = 'crosshair';
const CURSOR_GRAB = 'grab';
const CURSOR_GRABBING = 'grabbing';
const CURSOR_NOT_ALLOWED = 'not-allowed';

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for handling mouse/pointer input in the map editor.
 * 
 * @param canvas - Fabric canvas instance (or null if not ready)
 * @param options - Input handler options
 * @returns Input handler API
 * 
 * @example
 * ```tsx
 * const { attach, detach } = useInputHandler(canvasRef.current, {
 *   onAddModule: (type, pos) => addModule(type, pos),
 *   getModule: (id) => mapStore.getModule(id),
 *   onPanStart: panZoom.startPan,
 *   onPanMove: panZoom.updatePan,
 *   onPanEnd: panZoom.endPan,
 * });
 * ```
 */
export function useInputHandler(
    canvas: FabricCanvas | null,
    options: UseInputHandlerOptions = {}
): UseInputHandlerReturn {
    const {
        isPanMode = false,
        onAddModule,
        getModule,
        onPanStart,
        onPanMove,
        onPanEnd,
        onModuleContextMenu,
    } = options;

    // Get store state
    const activeTool = useEditorStore((state) => state.activeTool);
    const moduleToAdd = useEditorStore((state) => state.moduleToAdd);
    const setModuleToAdd = useEditorStore((state) => state.setModuleToAdd);
    const isModuleLocked = useEditorStore((state) => state.isModuleLocked);

    // Refs for tracking state
    const isPanningRef = useRef(false);
    const handlersRef = useRef<{
        mouseDown: ((e: FabricEvent) => void) | null;
        mouseMove: ((e: FabricEvent) => void) | null;
        mouseUp: ((e: FabricEvent) => void) | null;
        mouseOver: ((e: FabricEvent) => void) | null;
        mouseOut: ((e: FabricEvent) => void) | null;
    }>({
        mouseDown: null,
        mouseMove: null,
        mouseUp: null,
        mouseOver: null,
        mouseOut: null,
    });

    // ========================================================================
    // CURSOR MANAGEMENT
    // ========================================================================

    const updateCursor = useCallback(() => {
        if (!canvas) return;

        if (activeTool === 'pan' || isPanMode) {
            canvas.defaultCursor = isPanningRef.current ? CURSOR_GRABBING : CURSOR_GRAB;
            canvas.hoverCursor = isPanningRef.current ? CURSOR_GRABBING : CURSOR_GRAB;
        } else if (activeTool === 'add' && moduleToAdd) {
            canvas.defaultCursor = CURSOR_CROSSHAIR;
            canvas.hoverCursor = CURSOR_CROSSHAIR;
        } else {
            canvas.defaultCursor = CURSOR_DEFAULT;
            canvas.hoverCursor = CURSOR_DEFAULT;
        }
    }, [canvas, activeTool, moduleToAdd, isPanMode]);

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    const handleMouseDown = useCallback((opt: FabricEvent) => {
        if (!canvas) return;

        const e = opt.e as MouseEvent;

        // Right-click: module context (properties, etc.) — never start pan / add
        if (e.button === 2) {
            const target = opt.target as FabricObject | undefined;
            if (target && !isGridObject(target) && !isBackgroundObject(target)) {
                const moduleId = getModuleId(target);
                if (moduleId) {
                    e.preventDefault();
                    onModuleContextMenu?.(moduleId, e);
                }
            }
            return;
        }

        // Handle pan mode or Alt+drag
        if (activeTool === 'pan' || isPanMode || e.altKey || e.button === 1) {
            isPanningRef.current = true;
            canvas.selection = false;
            updateCursor();
            onPanStart?.(e);
            return;
        }

        // Handle click-to-add mode
        if (activeTool === 'add' && moduleToAdd && !opt.target) {
            const pointer = canvas.getPointer(e);
            onAddModule?.(moduleToAdd, pointer);

            // Clear moduleToAdd after placement (one-shot)
            setModuleToAdd(null);
            return;
        }
    }, [
        canvas,
        activeTool,
        isPanMode,
        moduleToAdd,
        onAddModule,
        setModuleToAdd,
        onPanStart,
        updateCursor,
        onModuleContextMenu,
    ]);

    const handleMouseMove = useCallback((opt: FabricEvent) => {
        if (!canvas) return;

        const e = opt.e as MouseEvent;

        // Handle panning
        if (isPanningRef.current) {
            onPanMove?.(e);
            return;
        }
    }, [canvas, onPanMove]);

    const handleMouseUp = useCallback(() => {
        if (isPanningRef.current) {
            isPanningRef.current = false;

            // Re-enable selection if not in pan mode
            if (canvas && activeTool !== 'pan' && !isPanMode) {
                canvas.selection = true;
            }

            updateCursor();
            onPanEnd?.();
        }
    }, [canvas, activeTool, isPanMode, onPanEnd, updateCursor]);

    const handleMouseOver = useCallback((opt: FabricEvent) => {
        if (!canvas) return;

        const target = opt.target as FabricObject;
        if (!target) return;

        // Show not-allowed cursor for locked modules
        const moduleId = getModuleId(target);
        if (moduleId && isModuleLocked(moduleId)) {
            canvas.hoverCursor = CURSOR_NOT_ALLOWED;
        }

        // Show locked cursor if module data indicates locked
        const module = moduleId ? getModule?.(moduleId) : null;
        if (module?.locked) {
            canvas.hoverCursor = CURSOR_NOT_ALLOWED;
        }
    }, [canvas, isModuleLocked, getModule]);

    const handleMouseOut = useCallback(() => {
        // Reset cursor based on current tool
        updateCursor();
    }, [updateCursor]);

    // ========================================================================
    // ATTACH / DETACH
    // ========================================================================

    const attach = useCallback(() => {
        if (!canvas) return;

        // Store handlers in refs for cleanup
        handlersRef.current = {
            mouseDown: handleMouseDown,
            mouseMove: handleMouseMove,
            mouseUp: handleMouseUp,
            mouseOver: handleMouseOver,
            mouseOut: handleMouseOut,
        };

        canvas.on('mouse:down', handlersRef.current.mouseDown!);
        canvas.on('mouse:move', handlersRef.current.mouseMove!);
        canvas.on('mouse:up', handlersRef.current.mouseUp!);
        canvas.on('mouse:over', handlersRef.current.mouseOver!);
        canvas.on('mouse:out', handlersRef.current.mouseOut!);

        // Set initial cursor
        updateCursor();
    }, [canvas, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseOver, handleMouseOut, updateCursor]);

    const detach = useCallback(() => {
        if (!canvas) return;

        const handlers = handlersRef.current;
        if (handlers.mouseDown) canvas.off('mouse:down', handlers.mouseDown);
        if (handlers.mouseMove) canvas.off('mouse:move', handlers.mouseMove);
        if (handlers.mouseUp) canvas.off('mouse:up', handlers.mouseUp);
        if (handlers.mouseOver) canvas.off('mouse:over', handlers.mouseOver);
        if (handlers.mouseOut) canvas.off('mouse:out', handlers.mouseOut);

        handlersRef.current = {
            mouseDown: null,
            mouseMove: null,
            mouseUp: null,
            mouseOver: null,
            mouseOut: null,
        };
    }, [canvas]);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    // Auto-attach on mount, detach on unmount
    useEffect(() => {
        attach();
        return () => detach();
    }, [attach, detach]);

    // Update cursor when tool changes
    useEffect(() => {
        updateCursor();
    }, [updateCursor]);

    return useMemo(() => ({
        attach,
        detach,
    }), [attach, detach]);
}

export default useInputHandler;
