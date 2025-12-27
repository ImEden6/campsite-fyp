/**
 * Background Layer Utilities
 * Handles Fabric.js rendering and management of the background layer.
 */

import * as fabricImpl from 'fabric';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fabric: any = fabricImpl;
import type { BackgroundLayer, Position, Size } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

// Using any for canvas type to ensure compatibility with various Fabric.js versions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FabricCanvas = any;

interface FabricObject {
    data?: Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

interface FabricImage extends FabricObject {
    width?: number;
    height?: number;
    set(options: Record<string, unknown>): void;
    setCoords(): void;
    dispose?(): void;
}

// Store reference to the background image for updates
const BACKGROUND_DATA_KEY = 'isBackgroundLayer';

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Check if a Fabric object is the background layer
 */
export function isBackgroundLayer(obj: FabricObject): boolean {
    return obj.data?.[BACKGROUND_DATA_KEY] === true;
}

/**
 * Get the current background layer from canvas
 */
export function getBackgroundLayer(canvas: FabricCanvas): FabricImage | null {
    const objects = canvas.getObjects();
    return (objects.find(isBackgroundLayer) as FabricImage) || null;
}

/**
 * Remove the background layer from canvas
 */
export function removeBackgroundLayer(canvas: FabricCanvas): boolean {
    const bgLayer = getBackgroundLayer(canvas);
    if (bgLayer) {
        canvas.remove(bgLayer);
        // Dispose to free memory
        if (bgLayer.dispose) {
            bgLayer.dispose();
        }
        canvas.requestRenderAll();
        return true;
    }
    return false;
}

/**
 * Render background layer on canvas
 * @param canvas - Fabric.js canvas
 * @param layer - BackgroundLayer data
 * @param onComplete - Callback when rendering completes
 */
export async function renderBackgroundLayer(
    canvas: FabricCanvas,
    layer: BackgroundLayer,
    onComplete?: () => void
): Promise<FabricImage> {
    // Remove existing background first
    removeBackgroundLayer(canvas);

    return new Promise((resolve, reject) => {
        fabric.FabricImage.fromURL(layer.imageData)
            .then((img: FabricImage) => {
                const imgWidth = img.width || 1;
                const imgHeight = img.height || 1;

                img.set({
                    left: layer.position.x,
                    top: layer.position.y,
                    scaleX: layer.size.width / imgWidth,
                    scaleY: layer.size.height / imgHeight,
                    opacity: layer.opacity,
                    selectable: !layer.locked,
                    evented: !layer.locked,
                    hasControls: !layer.locked,
                    hasBorders: !layer.locked,
                    lockMovementX: layer.locked,
                    lockMovementY: layer.locked,
                    lockRotation: true, // Backgrounds should not rotate
                    lockScalingFlip: true,
                    // Store identifier
                    data: {
                        [BACKGROUND_DATA_KEY]: true,
                    },
                });

                img.setCoords();

                canvas.add(img);
                canvas.sendObjectToBack(img);
                canvas.requestRenderAll();

                onComplete?.();
                resolve(img);
            })
            .catch((error: Error) => {
                console.error('[backgroundLayer] Failed to load background image:', error);
                reject(error);
            });
    });
}

/**
 * Update background layer opacity
 */
export function updateBackgroundOpacity(canvas: FabricCanvas, opacity: number): boolean {
    const bgLayer = getBackgroundLayer(canvas);
    if (bgLayer) {
        bgLayer.set({ opacity: Math.max(0, Math.min(1, opacity)) });
        canvas.requestRenderAll();
        return true;
    }
    return false;
}

/**
 * Update background layer locked state
 * When unlocked, adds a visible border so users can see boundaries
 */
export function updateBackgroundLocked(canvas: FabricCanvas, locked: boolean): boolean {
    const bgLayer = getBackgroundLayer(canvas);
    if (bgLayer) {
        bgLayer.set({
            selectable: !locked,
            evented: !locked,
            hasControls: !locked,
            hasBorders: !locked,
            lockMovementX: locked,
            lockMovementY: locked,
            // Visual feedback: border when unlocked
            stroke: locked ? undefined : 'rgba(59, 130, 246, 0.8)', // Blue border
            strokeWidth: locked ? 0 : 2,
            strokeDashArray: locked ? undefined : [8, 4], // Dashed line
            shadow: locked ? undefined : new fabric.Shadow({
                color: 'rgba(0, 0, 0, 0.3)',
                blur: 10,
                offsetX: 0,
                offsetY: 4,
            }),
        });
        canvas.requestRenderAll();
        return true;
    }
    return false;
}

/**
 * Update background layer position and size
 */
export function updateBackgroundTransform(
    canvas: FabricCanvas,
    position: Position,
    size: Size
): boolean {
    const bgLayer = getBackgroundLayer(canvas);
    if (bgLayer) {
        const imgWidth = bgLayer.width || 1;
        const imgHeight = bgLayer.height || 1;

        bgLayer.set({
            left: position.x,
            top: position.y,
            scaleX: size.width / imgWidth,
            scaleY: size.height / imgHeight,
        });
        bgLayer.setCoords();
        canvas.requestRenderAll();
        return true;
    }
    return false;
}

/**
 * Extract current background layer state from canvas
 * Useful for syncing canvas state back to store
 */
export function extractBackgroundState(canvas: FabricCanvas): Partial<BackgroundLayer> | null {
    const bgLayer = getBackgroundLayer(canvas);
    if (!bgLayer) return null;

    const scaleX = bgLayer.scaleX || 1;
    const scaleY = bgLayer.scaleY || 1;
    const imgWidth = bgLayer.width || 1;
    const imgHeight = bgLayer.height || 1;

    return {
        position: {
            x: bgLayer.left ?? 0,
            y: bgLayer.top ?? 0,
        },
        size: {
            width: imgWidth * scaleX,
            height: imgHeight * scaleY,
        },
        opacity: bgLayer.opacity ?? 1,
        locked: bgLayer.lockMovementX ?? true,
    };
}

/**
 * Ensure background stays at the back after any canvas changes
 * Call this after adding new modules to maintain z-order
 */
export function enforceBackgroundZIndex(canvas: FabricCanvas): void {
    const bgLayer = getBackgroundLayer(canvas);
    if (bgLayer) {
        canvas.sendObjectToBack(bgLayer);
    }
}
