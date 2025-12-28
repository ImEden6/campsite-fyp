/**
 * Fabric.js Type Definitions
 * Centralized type definitions for Fabric.js v6 objects and events.
 * Provides custom interfaces that match Fabric.js classes for type-safe usage.
 *
 * Note: For instantiation, import directly from 'fabric'.
 * These types are for type annotations and parameter typing.
 *
 * @see https://fabricjs.com/api
 */

// ============================================================================
// BASE FABRIC.JS TYPE INTERFACES
// ============================================================================
// These interfaces match the Fabric.js v6 class structures but are defined
// as pure types for use with `import type` statements.

/**
 * Generic Fabric object interface matching fabric.FabricObject
 */
export interface FabricObject {
    // Transform properties
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    scaleX?: number;
    scaleY?: number;
    angle?: number;
    opacity?: number;

    // Lock properties
    lockMovementX?: boolean;
    lockMovementY?: boolean;
    lockRotation?: boolean;
    lockScalingX?: boolean;
    lockScalingY?: boolean;

    // Interaction properties
    selectable?: boolean;
    evented?: boolean;
    hasControls?: boolean;
    hasBorders?: boolean;

    // Fabric type identifier
    type?: string;

    // Custom data storage
    data?: Record<string, unknown>;

    // Controls
    controls?: Record<string, FabricControl>;

    // Methods commonly used
    set?(options: Partial<FabricObject>): void;
    setCoords?(): void;
    dispose?(): void;

    // Index signature for additional Fabric.js properties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

/**
 * Fabric Group interface extending FabricObject
 */
export interface FabricGroup extends FabricObject {
    getObjects(): FabricObject[];
    add(obj: FabricObject): void;
    remove(obj: FabricObject): void;
    // Override optional methods as required for groups
    set(options: Partial<FabricObject>): void;
    setCoords(): void;
}

/**
 * Fabric Image interface extending FabricObject
 */
export interface FabricImage extends FabricObject {
    width?: number;
    height?: number;
    scaleX?: number;
    scaleY?: number;
    // Override optional methods as required for images
    set(options: Partial<FabricObject>): void;
    setCoords(): void;
    dispose?(): void;
}

/**
 * Fabric Line interface extending FabricObject
 */
export interface FabricLine extends FabricObject {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
}

/**
 * Point interface for coordinates
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * Size interface for dimensions
 */
export interface Size {
    width: number;
    height: number;
}

/**
 * Canvas interface for typed Fabric.js canvas operations
 */
export interface FabricCanvas {
    // Dimensions
    width?: number;
    height?: number;

    // Selection
    selection?: boolean;

    // Cursors
    defaultCursor?: string;
    hoverCursor?: string;

    // Viewport
    viewportTransform: number[];

    // Background
    backgroundColor?: string;

    // Selection methods
    getActiveObjects(): FabricObject[];
    discardActiveObject(): void;
    setActiveObject(obj: FabricObject): void;

    // Rendering
    requestRenderAll(): void;
    renderAll(): void;

    // Object management
    add(obj: FabricObject): void;
    remove(obj: FabricObject): void;
    getObjects(): FabricObject[];
    clear(): void;
    sendObjectToBack(obj: FabricObject): void;

    // Zoom/Pan
    getZoom(): number;
    setZoom(zoom: number): void;
    zoomToPoint(point: Point, zoom: number): void;
    setViewportTransform(vpt: number[]): void;

    // Pointer/Events
    getViewportPoint(e: Event): Point;
    getPointer(e: Event): Point;

    // Dimensions
    setDimensions(dim: { width: number; height: number }): void;

    // Lifecycle
    dispose(): void;

    // Event handling
    on(event: string, handler: (e: FabricEvent) => void): void;
    off(event: string, handler: (e: FabricEvent) => void): void;

    // Index signature for additional properties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

// ============================================================================
// CUSTOM TYPE EXTENSIONS
// ============================================================================

/**
 * Custom data that can be attached to Fabric objects for module identification
 */
export interface ModuleData {
    moduleId?: string;
    moduleType?: string;
    isGrid?: boolean;
    isLockIcon?: boolean;
    isBackground?: boolean;
    isGuide?: boolean;
    guideId?: string;
    // Index signature for compatibility with Record<string, unknown>
    [key: string]: unknown;
}

/**
 * Extended FabricObject with custom module data
 */
export interface FabricObjectWithData extends FabricObject {
    data?: ModuleData;
}

/**
 * Fabric event object passed to event handlers
 */
export interface FabricEvent {
    /** The DOM event */
    e: Event;
    /** Target object (if applicable) */
    target?: FabricObject;
    /** Mouse button (0=left, 1=middle, 2=right) */
    button?: number;
    /** Transform data during object manipulation */
    transform?: FabricTransform;
    /** Selected objects for selection events */
    selected?: FabricObject[];
    /** Deselected objects for selection events */
    deselected?: FabricObject[];
    /** Pointer info for mouse events */
    pointer?: Point;
    absolutePointer?: Point;
    scenePoint?: Point;
    viewportPoint?: Point;
    // Index signature for additional properties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

/**
 * Transform data during object manipulation
 */
export interface FabricTransform {
    target: FabricObject;
    action: string;
    corner?: string;
    originX?: string;
    originY?: string;
    original?: {
        left: number;
        top: number;
        scaleX: number;
        scaleY: number;
        angle: number;
    };
}

/**
 * Fabric control interface for object manipulation handles
 */
export interface FabricControl {
    x: number;
    y: number;
    offsetX?: number;
    offsetY?: number;
    actionHandler?: (eventData: FabricEvent, transform: FabricTransform, x: number, y: number) => boolean;
    cursorStyleHandler?: (eventData: FabricEvent, control: FabricControl, fabricObject: FabricObject) => string;
    actionName?: string;
    withConnection?: boolean;
    render?: (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: unknown, fabricObject: FabricObject) => void;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a Fabric object has a data property with module data
 */
export function hasDataProperty(obj: unknown): obj is FabricObjectWithData {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'data' in obj &&
        typeof (obj as FabricObjectWithData).data === 'object'
    );
}

/**
 * Get the module ID from a Fabric object, or null if not a module
 */
export function getModuleId(obj: unknown): string | null {
    if (hasDataProperty(obj)) {
        return obj.data?.moduleId ?? null;
    }
    return null;
}

/**
 * Get the module type from a Fabric object, or null if not a module
 */
export function getModuleType(obj: unknown): string | null {
    if (hasDataProperty(obj)) {
        return obj.data?.moduleType ?? null;
    }
    return null;
}

/**
 * Check if a Fabric object is a grid line
 */
export function isGridObject(obj: unknown): boolean {
    if (hasDataProperty(obj)) {
        return obj.data?.isGrid === true;
    }
    return false;
}

/**
 * Check if a Fabric object is a background layer
 */
export function isBackgroundObject(obj: unknown): boolean {
    if (hasDataProperty(obj)) {
        return obj.data?.isBackground === true;
    }
    return false;
}

/**
 * Check if a Fabric object is a guide line
 */
export function isGuideObject(obj: unknown): boolean {
    if (hasDataProperty(obj)) {
        return obj.data?.isGuide === true;
    }
    return false;
}

/**
 * Get the guide ID from a Fabric object
 */
export function getGuideId(obj: unknown): string | null {
    if (hasDataProperty(obj)) {
        return obj.data?.guideId ?? null;
    }
    return null;
}

// ============================================================================
// CANVAS OPTIONS
// ============================================================================

/**
 * Options for canvas initialization
 */
export interface CanvasOptions {
    width: number;
    height: number;
    selection?: boolean;
    preserveObjectStacking?: boolean;
    backgroundColor?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum zoom level */
export const MIN_ZOOM = 0.1;

/** Maximum zoom level */
export const MAX_ZOOM = 5;

/** Zoom step for incremental zoom */
export const ZOOM_STEP = 0.1;

/** Zoom factor for wheel zoom in */
export const ZOOM_IN_FACTOR = 1.1;

/** Zoom factor for wheel zoom out */
export const ZOOM_OUT_FACTOR = 0.9;

/** Default grid size in pixels */
export const DEFAULT_GRID_SIZE = 20;

/** Fit-to-screen padding factor */
export const FIT_TO_SCREEN_PADDING = 0.9;

/** Opacity for locked modules */
export const OPACITY_LOCKED = 0.85;

/** Opacity for hidden modules (ghost mode) */
export const OPACITY_HIDDEN = 0.3;

/** Opacity for lock icon overlay */
export const OPACITY_LOCK_ICON = 0.5;
