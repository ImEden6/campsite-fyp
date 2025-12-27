/**
 * useFabricCanvas Hook
 * Manages Fabric.js canvas lifecycle and provides core canvas API.
 * 
 * This is the foundation hook for the map editor - all other editor hooks
 * depend on this hook being initialized first.
 * 
 * see useMapEditor for proper hook composition order
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import * as fabricImpl from 'fabric';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fabric: any = fabricImpl;

import type {
    FabricCanvas,
    FabricObject,
    FabricEvent,
    CanvasOptions,
    Point,
} from '@/types/fabricTypes';

// ============================================================================
// TYPES
// ============================================================================

export interface UseFabricCanvasOptions extends Partial<CanvasOptions> {
    /** Callback when canvas is successfully initialized */
    onInit?: (canvas: FabricCanvas) => void;
    /** Callback when canvas is disposed */
    onDispose?: () => void;
}

export interface UseFabricCanvasReturn {
    /** Ref to the Fabric canvas instance */
    canvasRef: React.RefObject<FabricCanvas | null>;
    /** Whether the canvas is initialized */
    isInitialized: boolean;
    /** Error if initialization failed */
    error: Error | null;
    /** Get the canvas instance (throws if not initialized) */
    getCanvas: () => FabricCanvas;
    /** Safely get the canvas instance (returns null if not initialized) */
    getCanvasSafe: () => FabricCanvas | null;
    /** Add an object to the canvas */
    addObject: (obj: FabricObject) => void;
    /** Remove an object from the canvas */
    removeObject: (obj: FabricObject) => void;
    /** Add an event listener */
    addListener: (event: string, handler: (e: FabricEvent) => void) => void;
    /** Remove an event listener */
    removeListener: (event: string, handler: (e: FabricEvent) => void) => void;
    /** Set canvas zoom level */
    setZoom: (zoom: number) => void;
    /** Zoom to a specific point */
    zoomToPoint: (point: Point, zoom: number) => void;
    /** Get current zoom level */
    getZoom: () => number;
    /** Set canvas dimensions */
    setDimensions: (dimensions: { width: number; height: number }) => void;
    /** Get pointer position from event */
    getPointer: (e: Event) => Point;
    /** Get viewport point from event */
    getViewportPoint: (e: Event) => Point;
    /** Request a render */
    requestRenderAll: () => void;
    /** Clear all objects from canvas */
    clear: () => void;
    /** Discard active object selection */
    discardActiveObject: () => void;
    /** Set the active object */
    setActiveObject: (obj: FabricObject) => void;
    /** Get all active (selected) objects */
    getActiveObjects: () => FabricObject[];
    /** Get all objects on canvas */
    getObjects: () => FabricObject[];
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing Fabric.js canvas lifecycle and providing core canvas API.
 * 
 * @param elementId - The ID of the canvas HTML element
 * @param containerRef - Ref to the container element for sizing
 * @param options - Canvas initialization options
 * @returns Canvas API and state
 * 
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { canvasRef, isInitialized, addObject, setZoom } = useFabricCanvas(
 *   'map-canvas',
 *   containerRef,
 *   { backgroundColor: '#f0f0f0' }
 * );
 * ```
 */
export function useFabricCanvas(
    elementId: string,
    containerRef: React.RefObject<HTMLElement | null>,
    options: UseFabricCanvasOptions = {}
): UseFabricCanvasReturn {
    const canvasRef = useRef<FabricCanvas | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Store handlers in refs to ensure proper cleanup
    const listenersRef = useRef<Map<string, Set<(e: FabricEvent) => void>>>(new Map());

    // Initialize canvas
    useEffect(() => {
        const container = containerRef.current;
        if (!container || canvasRef.current) return;

        try {
            const canvas = new fabric.Canvas(elementId, {
                width: options.width ?? container.offsetWidth,
                height: options.height ?? container.offsetHeight,
                selection: options.selection ?? true,
                preserveObjectStacking: options.preserveObjectStacking ?? true,
                backgroundColor: options.backgroundColor ?? 'oklch(0.928 0.006 264.5)',
            });

            // Configure default control appearance
            fabric.FabricObject.prototype.set({
                cornerStyle: 'circle',
                cornerColor: 'oklch(0 0 0)',
                cornerStrokeColor: 'oklch(0 0 0)',
                cornerSize: 10,
                transparentCorners: false,
                borderColor: 'oklch(0 0 0)',
                borderScaleFactor: 2,
            });

            // Customize rotation control with purple handle
            try {
                const defaultControls = fabric.FabricObject.prototype.controls;
                if (defaultControls?.mtr) {
                    const originalMtr = defaultControls.mtr;
                    const customRotationRender = (
                        ctx: CanvasRenderingContext2D,
                        left: number,
                        top: number
                    ) => {
                        const size = 12;
                        ctx.save();
                        ctx.translate(left, top);
                        ctx.fillStyle = 'oklch(0.558 0.252 302.3)';
                        ctx.strokeStyle = 'oklch(0.496 0.237 301.9)';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(0, 0, size / 2, 0, Math.PI * 2, false);
                        ctx.fill();
                        ctx.stroke();
                        ctx.restore();
                    };
                    originalMtr.render = customRotationRender;
                }
            } catch (err) {
                console.warn('[useFabricCanvas] Could not customize rotation control:', err);
            }

            canvasRef.current = canvas;
            setIsInitialized(true);
            setError(null);
            options.onInit?.(canvas);

        } catch (err) {
            const initError = err instanceof Error ? err : new Error(String(err));
            console.error('[useFabricCanvas] Failed to initialize canvas:', initError);
            setError(initError);
            setIsInitialized(false);
        }

        // Capture ref value for cleanup
        const listeners = listenersRef.current;

        // Cleanup function
        return () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            try {
                // 1. Remove all registered listeners
                listeners.forEach((handlers, event) => {
                    handlers.forEach((handler) => {
                        canvas.off(event, handler);
                    });
                });
                listeners.clear();

                // 2. Clear canvas objects
                canvas.clear();

                // 3. Dispose Fabric canvas
                canvas.dispose();

                // 4. Null out ref
                canvasRef.current = null;
                setIsInitialized(false);

                options.onDispose?.();
            } catch (err) {
                console.error('[useFabricCanvas] Error during cleanup:', err);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elementId]); // Only re-run if elementId changes

    // Handle container resize
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const handleResize = () => {
            if (canvasRef.current && containerRef.current) {
                canvasRef.current.setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [containerRef]);

    // ========================================================================
    // API METHODS
    // ========================================================================

    const getCanvas = useCallback((): FabricCanvas => {
        if (!canvasRef.current) {
            throw new Error('[useFabricCanvas] Canvas not initialized');
        }
        return canvasRef.current;
    }, []);

    const getCanvasSafe = useCallback((): FabricCanvas | null => {
        return canvasRef.current;
    }, []);

    const addObject = useCallback((obj: FabricObject) => {
        canvasRef.current?.add(obj);
    }, []);

    const removeObject = useCallback((obj: FabricObject) => {
        canvasRef.current?.remove(obj);
    }, []);

    const addListener = useCallback((event: string, handler: (e: FabricEvent) => void) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.on(event, handler);

        // Track for cleanup
        if (!listenersRef.current.has(event)) {
            listenersRef.current.set(event, new Set());
        }
        listenersRef.current.get(event)!.add(handler);
    }, []);

    const removeListener = useCallback((event: string, handler: (e: FabricEvent) => void) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.off(event, handler);

        // Remove from tracking
        listenersRef.current.get(event)?.delete(handler);
    }, []);

    const setZoom = useCallback((zoom: number) => {
        canvasRef.current?.setZoom(zoom);
    }, []);

    const zoomToPoint = useCallback((point: Point, zoom: number) => {
        canvasRef.current?.zoomToPoint(point, zoom);
    }, []);

    const getZoom = useCallback((): number => {
        return canvasRef.current?.getZoom() ?? 1;
    }, []);

    const setDimensions = useCallback((dimensions: { width: number; height: number }) => {
        canvasRef.current?.setDimensions(dimensions);
    }, []);

    const getPointer = useCallback((e: Event): Point => {
        return canvasRef.current?.getPointer(e) ?? { x: 0, y: 0 };
    }, []);

    const getViewportPoint = useCallback((e: Event): Point => {
        return canvasRef.current?.getViewportPoint(e) ?? { x: 0, y: 0 };
    }, []);

    const requestRenderAll = useCallback(() => {
        canvasRef.current?.requestRenderAll();
    }, []);

    const clear = useCallback(() => {
        canvasRef.current?.clear();
    }, []);

    const discardActiveObject = useCallback(() => {
        canvasRef.current?.discardActiveObject();
    }, []);

    const setActiveObject = useCallback((obj: FabricObject) => {
        canvasRef.current?.setActiveObject(obj);
    }, []);

    const getActiveObjects = useCallback((): FabricObject[] => {
        return canvasRef.current?.getActiveObjects() ?? [];
    }, []);

    const getObjects = useCallback((): FabricObject[] => {
        return canvasRef.current?.getObjects() ?? [];
    }, []);

    return {
        canvasRef,
        isInitialized,
        error,
        getCanvas,
        getCanvasSafe,
        addObject,
        removeObject,
        addListener,
        removeListener,
        setZoom,
        zoomToPoint,
        getZoom,
        setDimensions,
        getPointer,
        getViewportPoint,
        requestRenderAll,
        clear,
        discardActiveObject,
        setActiveObject,
        getActiveObjects,
        getObjects,
    };
}

export default useFabricCanvas;
