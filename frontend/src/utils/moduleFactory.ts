/**
 * Module Factory
 * Creates Fabric.js objects from module data
 */

import * as fabric from 'fabric';
import type { AnyModule, ModuleType } from '@/types';

// Module type color mapping
const MODULE_COLORS: Record<ModuleType, string> = {
    campsite: '#4ade80',      // green
    toilet: '#60a5fa',        // blue
    storage: '#a78bfa',       // purple
    building: '#f97316',      // orange
    parking: '#6b7280',       // gray
    road: '#78716c',          // stone
    water_source: '#22d3ee',  // cyan
    electricity: '#facc15',   // yellow
    waste_disposal: '#ef4444', // red
    recreation: '#ec4899',    // pink
    custom: '#8b5cf6',        // violet
};

/**
 * Get the color for a module type
 */
export function getModuleColor(type: ModuleType): string {
    return MODULE_COLORS[type] || MODULE_COLORS.custom;
}

/**
 * Create a Fabric.js group object from module data
 */
export function createModuleObject(module: AnyModule): fabric.Group {
    const color = getModuleColor(module.type);

    // Create the rectangle shape
    const rect = new fabric.Rect({
        width: module.size.width,
        height: module.size.height,
        fill: color,
        stroke: '#374151',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
        originX: 'left',
        originY: 'top',
    });

    // Get display name from metadata
    const displayName = (module.metadata as { name?: string }).name || module.type;

    // Calculate font size based on module size
    const fontSize = Math.min(module.size.width / 8, module.size.height / 4, 14);
    const showLabel = fontSize >= 8;

    const objects: fabric.FabricObject[] = [rect];

    // Create the label if it fits
    if (showLabel) {
        const label = new fabric.FabricText(displayName, {
            fontSize: fontSize,
            fontFamily: 'Inter, system-ui, sans-serif',
            fill: '#1f2937',
            originX: 'center',
            originY: 'center',
            left: module.size.width / 2,
            top: module.size.height / 2,
            selectable: false,
            evented: false,
        });
        objects.push(label);
    }

    // Create the group
    const group = new fabric.Group(objects, {
        left: module.position.x,
        top: module.position.y,
        angle: module.rotation,
        originX: 'left',
        originY: 'top',
        lockScalingFlip: true,
    });

    // Store module ID for reference (set after creation for Fabric v6)
    (group as fabric.Group & { data?: Record<string, unknown> }).data = {
        moduleId: module.id,
        moduleType: module.type
    };

    // Apply locked state
    if (module.locked) {
        group.set({
            selectable: false,
            evented: false,
            opacity: 0.6,
        });
    }

    // Apply visibility
    if (!module.visible) {
        group.set({
            visible: false,
        });
    }

    return group;
}

/**
 * Update an existing Fabric object with new module data
 */
export function updateModuleObject(obj: fabric.Group, module: AnyModule): void {
    obj.set({
        left: module.position.x,
        top: module.position.y,
        angle: module.rotation,
    });

    // Update size by scaling the group
    const currentWidth = obj.width || 1;
    const currentHeight = obj.height || 1;
    obj.set({
        scaleX: module.size.width / currentWidth,
        scaleY: module.size.height / currentHeight,
    });

    obj.setCoords();
}

/**
 * Extract module changes from a Fabric object
 */
export function extractModuleChanges(obj: fabric.Group): {
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;
} {
    const scaleX = obj.scaleX || 1;
    const scaleY = obj.scaleY || 1;
    const width = (obj.width || 100) * scaleX;
    const height = (obj.height || 100) * scaleY;

    return {
        position: {
            x: obj.left || 0,
            y: obj.top || 0,
        },
        size: {
            width: Math.round(width),
            height: Math.round(height),
        },
        rotation: obj.angle || 0,
    };
}
