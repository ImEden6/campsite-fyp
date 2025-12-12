/**
 * Guide Renderer
 * Utility functions for rendering guides on Fabric.js canvas.
 * Guides are draggable alignment lines created from rulers.
 */

import * as fabric from 'fabric';
import type { Position, Size } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface Guide {
    id: string;
    orientation: 'horizontal' | 'vertical';
    position: number; // pixels from origin
}

export interface SnapResult {
    snapped: Position;
    snapLines: { orientation: 'h' | 'v'; position: number }[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GUIDE_COLOR = '#00bcd4'; // Cyan
const GUIDE_STROKE_WIDTH = 1;
const GUIDE_DASH_ARRAY = [5, 5];

// ============================================================================
// GUIDE CREATION
// ============================================================================

/**
 * Create a Fabric.js line object to represent a guide
 */
export function createGuideLine(
    orientation: 'horizontal' | 'vertical',
    position: number,
    canvasSize: { width: number; height: number },
    id?: string
): fabric.Line {
    const coords: [number, number, number, number] =
        orientation === 'horizontal'
            ? [0, position, canvasSize.width, position]
            : [position, 0, position, canvasSize.height];

    const line = new fabric.Line(coords, {
        stroke: GUIDE_COLOR,
        strokeWidth: GUIDE_STROKE_WIDTH,
        strokeDashArray: GUIDE_DASH_ARRAY,
        selectable: false,
        evented: false,
        excludeFromExport: true,
    });

    // Store guide metadata
    (line as fabric.Line & { data?: Record<string, unknown> }).data = {
        isGuide: true,
        guideId: id ?? crypto.randomUUID(),
        orientation,
    };

    return line;
}

// ============================================================================
// GUIDE SYNCHRONIZATION
// ============================================================================

/**
 * Check if a Fabric object is a guide line
 */
export function isGuideObject(obj: fabric.FabricObject): boolean {
    return (obj as fabric.FabricObject & { data?: { isGuide?: boolean } }).data
        ?.isGuide === true;
}

/**
 * Get the guide ID from a Fabric object
 */
export function getGuideId(obj: fabric.FabricObject): string | null {
    return (
        (obj as fabric.FabricObject & { data?: { guideId?: string } }).data
            ?.guideId ?? null
    );
}

/**
 * Sync guides from state to canvas
 * Removes existing guides and adds current ones
 */
export function syncGuidesToCanvas(
    canvas: fabric.Canvas,
    guides: Guide[],
    canvasSize: { width: number; height: number }
): void {
    // Remove existing guides
    const existingGuides = canvas.getObjects().filter(isGuideObject);
    existingGuides.forEach((g) => canvas.remove(g));

    // Add current guides
    guides.forEach((guide) => {
        const line = createGuideLine(
            guide.orientation,
            guide.position,
            canvasSize,
            guide.id
        );
        canvas.add(line);
    });

    canvas.requestRenderAll();
}

// ============================================================================
// SNAPPING
// ============================================================================

/**
 * Calculate snapped position for an object relative to guides
 * @param position - Current object position (top-left)
 * @param size - Object dimensions
 * @param guides - Array of guides to snap to
 * @param threshold - Snap threshold in pixels (default 5)
 * @returns Snapped position and which guides were snapped to, or null if no snap
 */
export function getSnapPosition(
    position: Position,
    size: Size,
    guides: Guide[],
    threshold: number = 5
): SnapResult | null {
    const snapLines: { orientation: 'h' | 'v'; position: number }[] = [];
    let snappedX = position.x;
    let snappedY = position.y;
    let didSnapX = false;
    let didSnapY = false;

    // Calculate object edges and center
    const edges = {
        left: position.x,
        right: position.x + size.width,
        centerX: position.x + size.width / 2,
        top: position.y,
        bottom: position.y + size.height,
        centerY: position.y + size.height / 2,
    };

    for (const guide of guides) {
        if (guide.orientation === 'vertical' && !didSnapX) {
            // Check left, center, right edges against vertical guide
            if (Math.abs(edges.left - guide.position) <= threshold) {
                snappedX = guide.position;
                snapLines.push({ orientation: 'v', position: guide.position });
                didSnapX = true;
            } else if (Math.abs(edges.centerX - guide.position) <= threshold) {
                snappedX = guide.position - size.width / 2;
                snapLines.push({ orientation: 'v', position: guide.position });
                didSnapX = true;
            } else if (Math.abs(edges.right - guide.position) <= threshold) {
                snappedX = guide.position - size.width;
                snapLines.push({ orientation: 'v', position: guide.position });
                didSnapX = true;
            }
        }

        if (guide.orientation === 'horizontal' && !didSnapY) {
            // Check top, center, bottom edges against horizontal guide
            if (Math.abs(edges.top - guide.position) <= threshold) {
                snappedY = guide.position;
                snapLines.push({ orientation: 'h', position: guide.position });
                didSnapY = true;
            } else if (Math.abs(edges.centerY - guide.position) <= threshold) {
                snappedY = guide.position - size.height / 2;
                snapLines.push({ orientation: 'h', position: guide.position });
                didSnapY = true;
            } else if (Math.abs(edges.bottom - guide.position) <= threshold) {
                snappedY = guide.position - size.height;
                snapLines.push({ orientation: 'h', position: guide.position });
                didSnapY = true;
            }
        }
    }

    if (snapLines.length === 0) {
        return null;
    }

    return {
        snapped: { x: snappedX, y: snappedY },
        snapLines,
    };
}

/**
 * Get the closest guide to a position
 * Used when dragging from ruler to determine initial guide position
 */
export function getClosestGuide(
    position: number,
    guides: Guide[],
    orientation: 'horizontal' | 'vertical',
    threshold: number = 10
): Guide | null {
    const matching = guides.filter((g) => g.orientation === orientation);
    if (matching.length === 0) return null;

    let closest: Guide | null = null;
    let minDistance = Infinity;

    for (const guide of matching) {
        const distance = Math.abs(guide.position - position);
        if (distance < threshold && distance < minDistance) {
            closest = guide;
            minDistance = distance;
        }
    }

    return closest;
}
