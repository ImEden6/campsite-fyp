/**
 * Image Processing Utilities
 * Handles validation, compression, cropping, and dimension calculations for background images.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_FILE_SIZE_MB = 10;
const DEFAULT_MAX_DIMENSION = 2000;
const DEFAULT_COMPRESSION_QUALITY = 0.8;

// ============================================================================
// TYPES
// ============================================================================

export interface ImageDimensions {
    width: number;
    height: number;
}

export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ProcessedImage {
    dataUrl: string;
    dimensions: ImageDimensions;
    originalFormat: string;
    compressedSize: number;
}

export interface ImageValidationResult {
    valid: boolean;
    error?: string;
    dimensions?: ImageDimensions;
    fileSize: number;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate image file size
 * @param file - Image file to validate
 * @param maxMB - Maximum file size in MB (default: 10)
 */
export function validateImageSize(file: File, maxMB: number = DEFAULT_MAX_FILE_SIZE_MB): ImageValidationResult {
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > maxMB) {
        return {
            valid: false,
            error: `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum allowed (${maxMB}MB)`,
            fileSize: file.size,
        };
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed: JPEG, PNG, WebP`,
            fileSize: file.size,
        };
    }

    return {
        valid: true,
        fileSize: file.size,
    };
}

// ============================================================================
// DIMENSION UTILITIES
// ============================================================================

/**
 * Get image dimensions from a File
 * @param file - Image file
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight,
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        };

        img.src = objectUrl;
    });
}

/**
 * Estimate compressed size based on dimensions
 * Rough estimate: JPEG at 0.8 quality ≈ 0.5-1 byte per pixel for typical photos
 * @param dimensions - Image dimensions
 * @returns Estimated size in KB
 */
export function estimateCompressedSize(dimensions: ImageDimensions): number {
    const pixels = dimensions.width * dimensions.height;
    // Conservative estimate: 0.7 bytes per pixel for JPEG at 0.8 quality
    const estimatedBytes = pixels * 0.7;
    return Math.round(estimatedBytes / 1024);
}

/**
 * Calculate scaled dimensions to fit within max dimension
 * @param dimensions - Original dimensions
 * @param maxDimension - Maximum width or height
 */
export function calculateScaledDimensions(
    dimensions: ImageDimensions,
    maxDimension: number = DEFAULT_MAX_DIMENSION
): ImageDimensions {
    const { width, height } = dimensions;

    if (width <= maxDimension && height <= maxDimension) {
        return { width, height };
    }

    const scale = Math.min(maxDimension / width, maxDimension / height);
    return {
        width: Math.round(width * scale),
        height: Math.round(height * scale),
    };
}

// ============================================================================
// IMAGE PROCESSING
// ============================================================================

/**
 * Load image from file and return as HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(img);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        };

        img.src = objectUrl;
    });
}

/**
 * Load image from data URL
 */
function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image from data URL'));

        img.src = dataUrl;
    });
}

/**
 * Progressive downscale to avoid canvas artifacts with large images
 * Downscales in steps of 2x maximum
 * @param img - Source image
 * @param targetWidth - Target width
 * @param targetHeight - Target height
 */
function progressiveDownscale(
    img: HTMLImageElement | HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number
): HTMLCanvasElement {
    let currentWidth = 'naturalWidth' in img ? img.naturalWidth : img.width;
    let currentHeight = 'naturalHeight' in img ? img.naturalHeight : img.height;
    let source: HTMLImageElement | HTMLCanvasElement = img;

    // Downscale in steps if reduction is more than 2x
    while (currentWidth / 2 > targetWidth || currentHeight / 2 > targetHeight) {
        const stepWidth = Math.max(targetWidth, Math.round(currentWidth / 2));
        const stepHeight = Math.max(targetHeight, Math.round(currentHeight / 2));

        const stepCanvas = document.createElement('canvas');
        stepCanvas.width = stepWidth;
        stepCanvas.height = stepHeight;

        const ctx = stepCanvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, stepWidth, stepHeight);

        source = stepCanvas;
        currentWidth = stepWidth;
        currentHeight = stepHeight;
    }

    // Final step to exact dimensions
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;

    const ctx = finalCanvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

    return finalCanvas;
}

/**
 * Compress image to JPEG with progressive downscaling
 * @param file - Source image file
 * @param maxDimension - Maximum width or height (default: 2000)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 */
export async function compressImage(
    file: File,
    maxDimension: number = DEFAULT_MAX_DIMENSION,
    quality: number = DEFAULT_COMPRESSION_QUALITY
): Promise<ProcessedImage> {
    const img = await loadImage(file);

    const originalFormat = file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN';
    const originalDimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight,
    };

    // Calculate target dimensions
    const targetDimensions = calculateScaledDimensions(originalDimensions, maxDimension);

    // Progressive downscale for quality
    const canvas = progressiveDownscale(img, targetDimensions.width, targetDimensions.height);

    // Convert to JPEG
    const dataUrl = canvas.toDataURL('image/jpeg', quality);

    // Calculate compressed size (base64 is ~33% larger than binary)
    const base64Data = dataUrl.split(',')[1] || '';
    const compressedSize = Math.round((base64Data.length * 3) / 4);

    return {
        dataUrl,
        dimensions: targetDimensions,
        originalFormat,
        compressedSize,
    };
}

/**
 * Crop image using canvas
 * @param imageData - Source image data URL
 * @param cropArea - Crop area coordinates (in pixels)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 */
export async function cropImage(
    imageData: string,
    cropArea: CropArea,
    quality: number = DEFAULT_COMPRESSION_QUALITY
): Promise<ProcessedImage> {
    const img = await loadImageFromDataUrl(imageData);

    const canvas = document.createElement('canvas');
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
    );

    const dataUrl = canvas.toDataURL('image/jpeg', quality);

    const base64Data = dataUrl.split(',')[1] || '';
    const compressedSize = Math.round((base64Data.length * 3) / 4);

    return {
        dataUrl,
        dimensions: {
            width: cropArea.width,
            height: cropArea.height,
        },
        originalFormat: 'CROPPED',
        compressedSize,
    };
}

/**
 * Process image with both compression and optional cropping
 * @param file - Source image file
 * @param cropArea - Optional crop area (applied before compression)
 * @param maxDimension - Maximum dimension after processing
 * @param quality - JPEG quality
 */
export async function processImage(
    file: File,
    cropArea?: CropArea,
    maxDimension: number = DEFAULT_MAX_DIMENSION,
    quality: number = DEFAULT_COMPRESSION_QUALITY
): Promise<ProcessedImage> {
    const img = await loadImage(file);
    const originalFormat = file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN';

    let sourceWidth = img.naturalWidth;
    let sourceHeight = img.naturalHeight;
    let sourceX = 0;
    let sourceY = 0;

    // Apply crop if specified
    if (cropArea) {
        sourceX = cropArea.x;
        sourceY = cropArea.y;
        sourceWidth = cropArea.width;
        sourceHeight = cropArea.height;
    }

    // Calculate target dimensions for the cropped/source area
    const targetDimensions = calculateScaledDimensions(
        { width: sourceWidth, height: sourceHeight },
        maxDimension
    );

    // Create canvas and draw cropped + scaled image
    const canvas = document.createElement('canvas');
    canvas.width = targetDimensions.width;
    canvas.height = targetDimensions.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        targetDimensions.width,
        targetDimensions.height
    );

    const dataUrl = canvas.toDataURL('image/jpeg', quality);

    const base64Data = dataUrl.split(',')[1] || '';
    const compressedSize = Math.round((base64Data.length * 3) / 4);

    return {
        dataUrl,
        dimensions: targetDimensions,
        originalFormat,
        compressedSize,
    };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
