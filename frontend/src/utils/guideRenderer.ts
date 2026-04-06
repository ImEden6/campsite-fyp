/**
 * Guide Renderer
 * Utility functions for rendering guides on Fabric.js canvas.
 * Guides are draggable alignment lines created from rulers.
 */

import * as fabricImpl from 'fabric';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fabric: any = fabricImpl;
import type { Position, Size } from '@/types';
import type { FabricObject, FabricCanvas, FabricLine } from '@/types/fabricTypes';
import { isGuideObject, getGuideId } from '@/types/fabricTypes';

// Re-export for backward compatibility
export { isGuideObject, getGuideId };

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

const GUIDE_COLOR = 'oklch(0.729 0.126 210.8)'; // Cyan
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
): FabricLine {
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
    (line as FabricObject).data = {
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
 * Sync guides from state to canvas
 * Removes existing guides and adds current ones
 */
export function syncGuidesToCanvas(
    canvas: FabricCanvas,
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
            const snapResult = snapToGuide(edges.left, edges.centerX, edges.right, guide.position, size.width, threshold);
            if (snapResult) {
                snappedX = snapResult.snapped;
                snapLines.push({ orientation: 'v', position: guide.position });
                didSnapX = true;
            }
        }

        if (guide.orientation === 'horizontal' && !didSnapY) {
            const snapResult = snapToGuide(edges.top, edges.centerY, edges.bottom, guide.position, size.height, threshold);
            if (snapResult) {
                snappedY = snapResult.snapped;
                snapLines.push({ orientation: 'h', position: guide.position });
                didSnapY = true;
            }
        }
    }

    if (snapLines.length === 0) return null;

    return { snapped: { x: snappedX, y: snappedY }, snapLines };
}

function snapToGuide(
    edge1: number,
    edgeCenter: number,
    edge2: number,
    guidePos: number,
    dimension: number,
    threshold: number
): { snapped: number } | null {
    if (Math.abs(edge1 - guidePos) <= threshold) {
        return { snapped: guidePos };
    }
    if (Math.abs(edgeCenter - guidePos) <= threshold) {
        return { snapped: guidePos - dimension / 2 };
    }
    if (Math.abs(edge2 - guidePos) <= threshold) {
        return { snapped: guidePos - dimension };
    }
    return null;
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
