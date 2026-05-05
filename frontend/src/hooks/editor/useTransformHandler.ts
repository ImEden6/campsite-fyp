/**
 * useTransformHandler Hook
 * Tracks object transforms and executes commands on completion.
 * 
 * Implements a state machine to handle edge cases:
 * - IDLE → TRACKING → COMMIT → IDLE (normal flow)
 * - TRACKING → INTERRUPT → TRACKING (concurrent transform, discard previous)
 * 
 * Only commits on clean `object:modified` event to prevent duplicate commands.
 * 
 * @see useFabricCanvas - Required dependency for canvas operations
 * @see useCommandFacade - For command execution
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import type { FabricCanvas, FabricEvent, FabricObject } from '@/types/fabricTypes';
import { getModuleId, isGridObject } from '@/types/fabricTypes';
import type { Command } from '@/commands/Command';
import { MoveCommand, TransformCommand } from '@/commands';
import { extractModuleChanges } from '@/utils/moduleFactory';
import { snapWorldPointToGrid } from '@/utils/gridSnap';
import { useEditorStore } from '@/stores/editorStore';

// ============================================================================
// TYPES
// ============================================================================

/** Transform state machine states */
type TransformState = 'IDLE' | 'TRACKING' | 'COMMIT';

/** Captured start state of an object */
interface ObjectStartState {
    moduleId: string;
    left: number;
    top: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    width: number;
    height: number;
}

export interface UseTransformHandlerOptions {
    /** Execute a command (from useCommandHistory) */
    executeCommand?: (command: Command) => void;
    /** Callback when transform starts */
    onTransformStart?: (moduleIds: string[]) => void;
    /** Callback when transform ends */
    onTransformEnd?: (moduleIds: string[]) => void;
}

export interface UseTransformHandlerReturn {
    /** Check if currently tracking a transform */
    isTracking: () => boolean;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Capture the current state of a Fabric object
 */
function captureObjectState(obj: FabricObject): ObjectStartState | null {
    const moduleId = getModuleId(obj);
    if (!moduleId) return null;

    // Module groups: Fabric group width/height include the type icon bbox — do not use for center↔top-left math.
    if (obj.type === 'group') {
        try {
            const { size } = extractModuleChanges(obj);
            const sx = obj.scaleX ?? 1;
            const sy = obj.scaleY ?? 1;
            return {
                moduleId,
                left: obj.left ?? 0,
                top: obj.top ?? 0,
                scaleX: sx,
                scaleY: sy,
                angle: obj.angle ?? 0,
                width: Math.max(1, size.width / sx),
                height: Math.max(1, size.height / sy),
            };
        } catch {
            /* fall through */
        }
    }

    return {
        moduleId,
        left: obj.left ?? 0,
        top: obj.top ?? 0,
        scaleX: obj.scaleX ?? 1,
        scaleY: obj.scaleY ?? 1,
        angle: obj.angle ?? 0,
        width: obj.width ?? 100,
        height: obj.height ?? 100,
    };
}

/**
 * Calculate position from center coordinates
 */
function centerToTopLeft(
    centerX: number,
    centerY: number,
    width: number,
    height: number
): { x: number; y: number } {
    return {
        x: Math.round(Math.max(0, centerX - width / 2)),
        y: Math.round(Math.max(0, centerY - height / 2)),
    };
}

/**
 * Check if transform is only a move (no scale/rotate)
 */
function isMoveOnly(start: ObjectStartState, end: ObjectStartState): boolean {
    return (
        start.scaleX === end.scaleX &&
        start.scaleY === end.scaleY &&
        start.angle === end.angle
    );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for tracking object transforms and executing commands.
 * 
 * @param canvas - Fabric canvas instance (or null if not ready)
 * @param options - Transform handler options
 * @returns Transform handler API
 * 
 * @example
 * ```tsx
 * const { isTracking } = useTransformHandler(canvasRef.current, {
 *   executeCommand: (cmd) => commandHistory.execute(cmd),
 *   onTransformEnd: (ids) => console.log('Transformed:', ids),
 * });
 * ```
 */
export function useTransformHandler(
    canvas: FabricCanvas | null,
    options: UseTransformHandlerOptions = {}
): UseTransformHandlerReturn {
    const { executeCommand, onTransformStart, onTransformEnd } = options;

    // State machine
    const stateRef = useRef<TransformState>('IDLE');
    const startStatesRef = useRef<Map<string, ObjectStartState>>(new Map());

    // ========================================================================
    // STATE MACHINE TRANSITIONS
    // ========================================================================

    /**
     * Start tracking a transform
     */
    const startTracking = useCallback((objects: FabricObject[]) => {
        // If already tracking, this is an interrupt - discard previous
        if (stateRef.current === 'TRACKING') {
            console.debug('[useTransformHandler] Interrupt - discarding previous transform');
            startStatesRef.current.clear();
        }

        stateRef.current = 'TRACKING';
        startStatesRef.current.clear();

        const moduleIds: string[] = [];

        for (const obj of objects) {
            const state = captureObjectState(obj);
            if (state) {
                startStatesRef.current.set(state.moduleId, state);
                moduleIds.push(state.moduleId);
            }
        }

        if (moduleIds.length > 0) {
            onTransformStart?.(moduleIds);
        }
    }, [onTransformStart]);

    /**
     * Commit the transform by creating appropriate command
     */
    const commitTransform = useCallback((objects: FabricObject[]) => {
        if (stateRef.current !== 'TRACKING') {
            return; // Not tracking, nothing to commit
        }

        stateRef.current = 'COMMIT';

        const moduleIds: string[] = [];
        const moveChanges: Array<{
            id: string;
            oldPosition: { x: number; y: number };
            newPosition: { x: number; y: number };
        }> = [];

        for (const obj of objects) {
            const moduleId = getModuleId(obj);
            if (!moduleId) continue;

            const startState = startStatesRef.current.get(moduleId);
            if (!startState) continue;

            moduleIds.push(moduleId);

            // Capture end state
            const endState = captureObjectState(obj);
            if (!endState) continue;

            // Calculate dimensions
            const startWidth = startState.width * startState.scaleX;
            const startHeight = startState.height * startState.scaleY;
            const endWidth = endState.width * endState.scaleX;
            const endHeight = endState.height * endState.scaleY;

            // Convert center to top-left
            const startPos = centerToTopLeft(startState.left, startState.top, startWidth, startHeight);
            const endPos = centerToTopLeft(endState.left, endState.top, endWidth, endHeight);

            // Check if this is move-only or full transform
            if (isMoveOnly(startState, endState)) {
                // Position changed only - use MoveCommand
                if (startPos.x !== endPos.x || startPos.y !== endPos.y) {
                    moveChanges.push({
                        id: moduleId,
                        oldPosition: startPos,
                        newPosition: endPos,
                    });
                }
            } else {
                // Scale or rotation changed - use TransformCommand (one per object)
                if (executeCommand) {
                    executeCommand(new TransformCommand({
                        id: moduleId,
                        oldPosition: startPos,
                        newPosition: endPos,
                        oldSize: { width: Math.round(startWidth), height: Math.round(startHeight) },
                        newSize: { width: Math.round(endWidth), height: Math.round(endHeight) },
                        oldRotation: startState.angle,
                        newRotation: endState.angle,
                    }));
                }
            }
        }

        // Execute MoveCommand for move-only changes
        if (executeCommand && moveChanges.length > 0) {
            executeCommand(new MoveCommand(moveChanges));
        }

        // Cleanup
        startStatesRef.current.clear();
        stateRef.current = 'IDLE';

        if (moduleIds.length > 0) {
            onTransformEnd?.(moduleIds);
        }
    }, [executeCommand, onTransformEnd]);

    // ========================================================================
    // FABRIC EVENT HANDLERS
    // ========================================================================

    /**
     * While snap is on, snap module top-left to grid each move tick (Fabric center origin → TL → snap → center).
     */
    const snapWhileMoving = useCallback((e: FabricEvent) => {
        const target = e.target;
        if (!target || isGridObject(target)) return;

        const { snapToGrid: snapOn, gridSize } = useEditorStore.getState();
        if (!snapOn || gridSize <= 0) return;

        const applyToModule = (obj: FabricObject) => {
            if (!getModuleId(obj)) return;

            const endState = captureObjectState(obj);
            if (!endState) return;

            const ew = endState.width * endState.scaleX;
            const eh = endState.height * endState.scaleY;
            const tl = centerToTopLeft(endState.left, endState.top, ew, eh);
            const snappedTL = snapWorldPointToGrid({ x: tl.x, y: tl.y }, gridSize, true);
            if (tl.x === snappedTL.x && tl.y === snappedTL.y) return;

            const cx = snappedTL.x + ew / 2;
            const cy = snappedTL.y + eh / 2;
            obj.set({ left: cx, top: cy });
            obj.setCoords?.();
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t = target as any;
        if (t.type === 'activeSelection') {
            const objs: FabricObject[] = t.getObjects?.() ?? [];
            if (objs.length === 0) return;
            if (objs.length === 1) {
                applyToModule(objs[0]!);
                return;
            }
            const bbox =
                typeof t.getBoundingRect === 'function' ? t.getBoundingRect(true) : null;
            if (!bbox) return;
            const tl = { x: bbox.left, y: bbox.top };
            const snappedTL = snapWorldPointToGrid(tl, gridSize, true);
            const dx = snappedTL.x - tl.x;
            const dy = snappedTL.y - tl.y;
            if (dx === 0 && dy === 0) return;
            t.set({ left: (t.left ?? 0) + dx, top: (t.top ?? 0) + dy });
            t.setCoords?.();

            return;
        }

        applyToModule(target as FabricObject);
    }, []);

    const handleObjectMoving = useCallback((e: FabricEvent) => {
        if (stateRef.current === 'IDLE') {
            const target = e.target;
            if (target) {
                // Get all objects being moved (could be multi-select)
                const objects = e.transform?.target
                    ? [e.transform.target]
                    : target.type === 'activeSelection'
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ? (target as any).getObjects?.() || [target]
                        : [target];
                startTracking(objects);
            }
        }
    }, [startTracking]);

    const handleObjectScaling = useCallback((e: FabricEvent) => {
        if (stateRef.current === 'IDLE') {
            const target = e.target;
            if (target) {
                startTracking([target]);
            }
        }
    }, [startTracking]);

    const handleObjectRotating = useCallback((e: FabricEvent) => {
        if (stateRef.current === 'IDLE') {
            const target = e.target;
            if (target) {
                startTracking([target]);
            }
        }
    }, [startTracking]);

    const handleObjectModified = useCallback((e: FabricEvent) => {
        const target = e.target;
        if (target) {
            // Get all objects that were modified
            const objects = target.type === 'activeSelection'
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? (target as any).getObjects?.() || [target]
                : [target];
            commitTransform(objects);
        }
    }, [commitTransform]);

    // ========================================================================
    // ATTACH / DETACH
    // ========================================================================

    useEffect(() => {
        if (!canvas) return;

        canvas.on('object:moving', handleObjectMoving);
        canvas.on('object:moving', snapWhileMoving);
        canvas.on('object:scaling', handleObjectScaling);
        canvas.on('object:rotating', handleObjectRotating);
        canvas.on('object:modified', handleObjectModified);

        return () => {
            canvas.off('object:moving', handleObjectMoving);
            canvas.off('object:moving', snapWhileMoving);
            canvas.off('object:scaling', handleObjectScaling);
            canvas.off('object:rotating', handleObjectRotating);
            canvas.off('object:modified', handleObjectModified);
        };
    }, [canvas, handleObjectMoving, snapWhileMoving, handleObjectScaling, handleObjectRotating, handleObjectModified]);

    // ========================================================================
    // API
    // ========================================================================

    const isTracking = useCallback(() => {
        return stateRef.current === 'TRACKING';
    }, []);

    return useMemo(() => ({
        isTracking,
    }), [isTracking]);
}

export default useTransformHandler;
