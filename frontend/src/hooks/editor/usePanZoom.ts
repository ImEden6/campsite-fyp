/**
 * usePanZoom Hook
 * Manages canvas pan and zoom functionality.
 * 
 * This hook is stateful and provides zoom controls and panning state.
 * It consumes editorStore for pan mode state.
 * 
 * @see useFabricCanvas - Required dependency for canvas operations
 */

import { useCallback, useState, useRef, useMemo } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { FabricCanvas, FabricEvent, Point } from '@/types/fabricTypes';
import {
    MIN_ZOOM,
    MAX_ZOOM,
    ZOOM_STEP,
    ZOOM_IN_FACTOR,
    ZOOM_OUT_FACTOR,
    FIT_TO_SCREEN_PADDING,
} from '@/types/fabricTypes';

// ============================================================================
// TYPES
// ============================================================================

export interface UsePanZoomOptions {
    /** Initial zoom level (default: 1) */
    initialZoom?: number;
    /** Callback when zoom changes */
    onZoomChange?: (zoom: number) => void;
    /** Container ref for fit-to-screen calculation */
    containerRef?: React.RefObject<HTMLElement | null>;
    /** Map size for fit-to-screen calculation */
    mapSize?: { width: number; height: number };
}

export interface UsePanZoomReturn {
    /** Current zoom level */
    zoom: number;
    /** Whether pan mode is active */
    isPanMode: boolean;
    /** Whether currently panning */
    isPanning: boolean;
    /** Toggle pan mode on/off */
    togglePanMode: () => void;
    /** Set pan mode */
    setPanMode: (enabled: boolean) => void;
    /** Zoom in by step */
    zoomIn: () => void;
    /** Zoom out by step */
    zoomOut: () => void;
    /** Set zoom to specific level */
    setZoom: (zoom: number) => void;
    /** Zoom to point (for wheel zoom) */
    zoomToPoint: (point: Point, zoom: number) => void;
    /** Fit canvas to screen */
    fitToScreen: () => void;
    /** Handle wheel event for zooming */
    handleWheel: (e: FabricEvent) => void;
    /** Start panning */
    startPan: (e: MouseEvent) => void;
    /** Update pan position */
    updatePan: (e: MouseEvent) => void;
    /** End panning */
    endPan: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing canvas pan and zoom.
 * 
 * @param canvas - Fabric canvas instance (or null if not ready)
 * @param options - Pan/zoom options
 * @returns Pan/zoom API and state
 * 
 * @example
 * ```tsx
 * const { zoom, zoomIn, zoomOut, fitToScreen, isPanMode, togglePanMode } = usePanZoom(
 *   canvasRef.current,
 *   { containerRef, mapSize: { width: 800, height: 600 } }
 * );
 * ```
 */
export function usePanZoom(
    canvas: FabricCanvas | null,
    options: UsePanZoomOptions = {}
): UsePanZoomReturn {
    const { initialZoom = 1, onZoomChange, containerRef, mapSize } = options;

    const [zoom, setZoomState] = useState(initialZoom);
    const [isPanning, setIsPanning] = useState(false);
    const [isPanMode, setIsPanModeState] = useState(false);

    // Pan tracking
    const lastPosRef = useRef({ x: 0, y: 0 });
    /** Last zoom from "fit to screen" — used as a floor so users cannot zoom out far past the fitted view */
    const lastFitZoomRef = useRef<number | null>(null);

    // Sync with editorStore pan mode if needed
    const activeTool = useEditorStore((state) => state.activeTool);

    const clampToZoomLimits = useCallback((z: number) => {
        const fit = lastFitZoomRef.current;
        const floor =
            fit != null && fit > 0
                ? Math.max(MIN_ZOOM, fit * 0.92)
                : MIN_ZOOM;
        return Math.max(floor, Math.min(MAX_ZOOM, z));
    }, []);

    // ========================================================================
    // ZOOM METHODS
    // ========================================================================

    const setZoom = useCallback((newZoom: number) => {
        if (!canvas) return;
        const clampedZoom = clampToZoomLimits(newZoom);
        canvas.setZoom(clampedZoom);
        setZoomState(clampedZoom);
        onZoomChange?.(clampedZoom);
    }, [canvas, onZoomChange, clampToZoomLimits]);

    const zoomToPoint = useCallback((point: Point, newZoom: number) => {
        if (!canvas) return;
        const clampedZoom = clampToZoomLimits(newZoom);
        canvas.zoomToPoint(point, clampedZoom);
        setZoomState(clampedZoom);
        onZoomChange?.(clampedZoom);
    }, [canvas, onZoomChange, clampToZoomLimits]);

    const zoomIn = useCallback(() => {
        setZoomState(prev => {
            const newZoom = clampToZoomLimits(prev + ZOOM_STEP);
            if (canvas) {
                canvas.setZoom(newZoom);
                onZoomChange?.(newZoom);
            }
            return newZoom;
        });
    }, [canvas, onZoomChange, clampToZoomLimits]);

    const zoomOut = useCallback(() => {
        setZoomState(prev => {
            const newZoom = clampToZoomLimits(prev - ZOOM_STEP);
            if (canvas) {
                canvas.setZoom(newZoom);
                onZoomChange?.(newZoom);
            }
            return newZoom;
        });
    }, [canvas, onZoomChange, clampToZoomLimits]);

    const fitToScreen = useCallback(() => {
        if (!canvas || !containerRef?.current || !mapSize) return;

        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;

        const scaleX = containerWidth / mapSize.width;
        const scaleY = containerHeight / mapSize.height;
        const newZoom = Math.min(scaleX, scaleY) * FIT_TO_SCREEN_PADDING;

        lastFitZoomRef.current = newZoom;
        canvas.setZoom(newZoom);
        canvas.setViewportTransform([newZoom, 0, 0, newZoom, 0, 0]);
        setZoomState(newZoom);
        onZoomChange?.(newZoom);

        canvas.requestRenderAll();
    }, [canvas, containerRef, mapSize, onZoomChange]);

    const handleWheel = useCallback((opt: FabricEvent) => {
        if (!canvas) return;

        const event = opt.e as WheelEvent;
        event.preventDefault();

        const delta = event.deltaY;
        const currentZoom = canvas.getZoom();
        let newZoom = currentZoom * (delta > 0 ? ZOOM_OUT_FACTOR : ZOOM_IN_FACTOR);
        newZoom = clampToZoomLimits(newZoom);

        const pointer = canvas.getViewportPoint(event);
        canvas.zoomToPoint(pointer, newZoom);
        setZoomState(newZoom);
        onZoomChange?.(newZoom);
    }, [canvas, onZoomChange, clampToZoomLimits]);

    // ========================================================================
    // PAN METHODS
    // ========================================================================

    const togglePanMode = useCallback(() => {
        setIsPanModeState(prev => !prev);
    }, []);

    const setPanMode = useCallback((enabled: boolean) => {
        setIsPanModeState(enabled);
    }, []);

    const startPan = useCallback((e: MouseEvent) => {
        setIsPanning(true);
        lastPosRef.current = { x: e.clientX, y: e.clientY };

        // Disable selection while panning
        if (canvas) {
            canvas.selection = false;
        }
    }, [canvas]);

    const updatePan = useCallback((e: MouseEvent) => {
        if (!isPanning || !canvas) return;

        const vpt = canvas.viewportTransform;
        if (vpt) {
            vpt[4]! += e.clientX - lastPosRef.current.x;
            vpt[5]! += e.clientY - lastPosRef.current.y;
            canvas.requestRenderAll();
        }
        lastPosRef.current = { x: e.clientX, y: e.clientY };
    }, [isPanning, canvas]);

    const endPan = useCallback(() => {
        setIsPanning(false);

        // Re-enable selection if not in pan mode
        if (canvas && !isPanMode && activeTool === 'select') {
            canvas.selection = true;
        }
    }, [canvas, isPanMode, activeTool]);

    return useMemo(() => ({
        zoom,
        isPanMode,
        isPanning,
        togglePanMode,
        setPanMode,
        zoomIn,
        zoomOut,
        setZoom,
        zoomToPoint,
        fitToScreen,
        handleWheel,
        startPan,
        updatePan,
        endPan,
    }), [
        zoom,
        isPanMode,
        isPanning,
        togglePanMode,
        setPanMode,
        zoomIn,
        zoomOut,
        setZoom,
        zoomToPoint,
        fitToScreen,
        handleWheel,
        startPan,
        updatePan,
        endPan,
    ]);
}

export default usePanZoom;
