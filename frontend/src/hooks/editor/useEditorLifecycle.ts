/**
 * useEditorLifecycle Hook
 * Manages editor lifecycle concerns: resize handling, dirty state, exit confirmation.
 * 
 * @see useFabricCanvas - Required for canvas resize
 * @see useMapStore - For dirty state tracking
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useMapStore } from '@/stores/mapStore';
import type { FabricCanvas } from '@/types/fabricTypes';

// ============================================================================
// TYPES
// ============================================================================

export interface UseEditorLifecycleOptions {
    /** Container ref for resize handling */
    containerRef?: React.RefObject<HTMLElement | null>;
    /** Callback to set canvas dimensions */
    setCanvasDimensions?: (dimensions: { width: number; height: number }) => void;
    /** Whether to show exit confirmation when dirty */
    confirmOnExit?: boolean;
    /** Custom exit message */
    exitMessage?: string;
}

export interface UseEditorLifecycleReturn {
    /** Whether the map has unsaved changes */
    isDirty: boolean;
    /** Mark map as dirty */
    markDirty: () => void;
    /** Clear dirty flag (after save) */
    clearDirty: () => void;
    /** Manually trigger resize */
    handleResize: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing editor lifecycle concerns.
 * 
 * @param canvas - Fabric canvas instance (or null if not ready)
 * @param options - Lifecycle options
 * @returns Lifecycle API
 * 
 * @example
 * ```tsx
 * const { isDirty, markDirty, clearDirty } = useEditorLifecycle(
 *   canvasRef.current,
 *   {
 *     containerRef,
 *     setCanvasDimensions: canvas?.setDimensions,
 *     confirmOnExit: true,
 *   }
 * );
 * ```
 */
export function useEditorLifecycle(
    canvas: FabricCanvas | null,
    options: UseEditorLifecycleOptions = {}
): UseEditorLifecycleReturn {
    const {
        containerRef,
        setCanvasDimensions,
        confirmOnExit = true,
        exitMessage = 'You have unsaved changes. Are you sure you want to leave?',
    } = options;

    // Get dirty state from store
    const isDirty = useMapStore((state) => state.isDirty);
    const storMarkDirty = useMapStore((state) => state.markDirty);
    const storeMarkClean = useMapStore((state) => state.markClean);

    // Track resize throttle
    const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ========================================================================
    // RESIZE HANDLING
    // ========================================================================

    const handleResize = useCallback(() => {
        if (!containerRef?.current || !setCanvasDimensions) return;

        setCanvasDimensions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
        });

        canvas?.requestRenderAll();
    }, [containerRef, setCanvasDimensions, canvas]);

    const throttledResize = useCallback(() => {
        if (resizeTimerRef.current) {
            clearTimeout(resizeTimerRef.current);
        }
        resizeTimerRef.current = setTimeout(handleResize, 100);
    }, [handleResize]);

    // Attach resize listener
    useEffect(() => {
        window.addEventListener('resize', throttledResize);
        return () => {
            window.removeEventListener('resize', throttledResize);
            if (resizeTimerRef.current) {
                clearTimeout(resizeTimerRef.current);
            }
        };
    }, [throttledResize]);

    // ========================================================================
    // EXIT CONFIRMATION
    // ========================================================================

    useEffect(() => {
        if (!confirmOnExit) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent): string | undefined => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = exitMessage;
                return exitMessage;
            }
            return undefined;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [confirmOnExit, isDirty, exitMessage]);

    // ========================================================================
    // API
    // ========================================================================

    const markDirty = useCallback(() => {
        storMarkDirty();
    }, [storMarkDirty]);

    const clearDirty = useCallback(() => {
        storeMarkClean();
    }, [storeMarkClean]);

    return useMemo(() => ({
        isDirty,
        markDirty,
        clearDirty,
        handleResize,
    }), [isDirty, markDirty, clearDirty, handleResize]);
}

export default useEditorLifecycle;
