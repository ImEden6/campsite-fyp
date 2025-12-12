/**
 * Background Handler
 * Utilities for loading and rendering background images on Fabric.js canvas.
 * Handles validation, scaling, and placement.
 */

import * as fabric from 'fabric';
import type { Size } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface BackgroundOptions {
    maxWidth: number;
    maxHeight: number;
    minWidth: number;
    minHeight: number;
}

export interface BackgroundResult {
    image: HTMLImageElement;
    size: Size;
    objectUrl: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_OPTIONS: BackgroundOptions = {
    maxWidth: 4000,
    maxHeight: 4000,
    minWidth: 400,
    minHeight: 300,
};

// ============================================================================
// IMAGE LOADING
// ============================================================================

/**
 * Load and validate a background image from a File
 * @param file - Image file to load
 * @param options - Dimension constraints
 * @returns Loaded image, calculated size, and object URL
 */
export async function loadBackgroundImage(
    file: File,
    options: Partial<BackgroundOptions> = {}
): Promise<BackgroundResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        throw new Error(
            `Invalid image type: ${file.type}. Supported: PNG, JPEG, WebP`
        );
    }

    const objectUrl = URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            // Validate minimum dimensions
            if (img.width < opts.minWidth || img.height < opts.minHeight) {
                URL.revokeObjectURL(objectUrl);
                reject(
                    new Error(
                        `Image too small. Minimum: ${opts.minWidth}x${opts.minHeight}px. ` +
                        `Got: ${img.width}x${img.height}px`
                    )
                );
                return;
            }

            // Calculate scaled dimensions if too large
            let { width, height } = img;
            if (width > opts.maxWidth || height > opts.maxHeight) {
                const scale = Math.min(
                    opts.maxWidth / width,
                    opts.maxHeight / height
                );
                width = Math.round(width * scale);
                height = Math.round(height * scale);
            }

            resolve({
                image: img,
                size: { width, height },
                objectUrl,
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        };

        img.src = objectUrl;
    });
}

// ============================================================================
// CANVAS INTEGRATION
// ============================================================================

/**
 * Check if a Fabric object is a background image
 */
export function isBackgroundObject(obj: fabric.FabricObject): boolean {
    return (
        (obj as fabric.FabricObject & { data?: { isBackground?: boolean } })
            .data?.isBackground === true
    );
}

/**
 * Set the canvas background image
 * Removes any existing background and adds the new one at origin
 * @param canvas - Fabric.js canvas
 * @param imageUrl - URL of the image (can be object URL or data URL)
 * @param size - Desired display size (image will be scaled to fit)
 */
export async function setCanvasBackground(
    canvas: fabric.Canvas,
    imageUrl: string,
    size: Size
): Promise<fabric.FabricImage> {
    // Remove existing background
    const oldBg = canvas.getObjects().find(isBackgroundObject);
    if (oldBg) {
        canvas.remove(oldBg);
    }

    // Load and add new background
    const img = await fabric.FabricImage.fromURL(imageUrl);

    img.set({
        left: 0,
        top: 0,
        scaleX: size.width / (img.width || 1),
        scaleY: size.height / (img.height || 1),
        selectable: false,
        evented: false,
        excludeFromExport: false, // Include in exports
    });

    // Store background metadata
    (img as fabric.FabricImage & { data?: Record<string, unknown> }).data = {
        isBackground: true,
    };

    canvas.add(img);
    canvas.sendObjectToBack(img);
    canvas.requestRenderAll();

    return img;
}

/**
 * Remove the background image from canvas
 */
export function removeCanvasBackground(canvas: fabric.Canvas): boolean {
    const bg = canvas.getObjects().find(isBackgroundObject);
    if (bg) {
        canvas.remove(bg);
        canvas.requestRenderAll();
        return true;
    }
    return false;
}

/**
 * Get the current background image dimensions
 */
export function getBackgroundSize(canvas: fabric.Canvas): Size | null {
    const bg = canvas.getObjects().find(isBackgroundObject);
    if (!bg) return null;

    return {
        width: (bg.width || 0) * (bg.scaleX || 1),
        height: (bg.height || 0) * (bg.scaleY || 1),
    };
}
