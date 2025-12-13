/**
 * Module Factory
 * Creates Fabric.js objects from module data
 */

import * as fabric from 'fabric';
import type { AnyModule, ModuleType, Position, Size } from '@/types';

// Type helper for accessing custom data on Fabric objects
export type FabricObjectWithData = fabric.FabricObject & {
    data?: { moduleId?: string; moduleType?: string; isGrid?: boolean; isLockIcon?: boolean };
};

/**
 * Type guard to check if a Fabric object has a data property
 */
function hasDataProperty(obj: fabric.FabricObject): obj is fabric.FabricObject & { data: Record<string, unknown> } {
    return 'data' in obj && typeof (obj as fabric.FabricObject & { data?: unknown }).data === 'object' && (obj as fabric.FabricObject & { data?: unknown }).data !== null;
}

/**
 * Create a lock icon group for locked modules
 * The scale should be applied by the caller based on module dimensions
 * @returns A Fabric Group containing the lock icon, or null if creation fails
 */
function createLockIcon(): fabric.Group | null {
    const lockIconElements: IconElement[] = [
        { type: 'path', d: 'M6 10V8a6 6 0 0 1 12 0v2' },
        { type: 'path', d: 'M8 10h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z' },
    ];
    const lockIconParts = createIconObjects(lockIconElements, '#6b7280');
    
    if (lockIconParts.length === 0) return null;
    
    const lockIconGroup = new fabric.Group(lockIconParts, {
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        opacity: OPACITY_LOCK_ICON,
    });
    
    if (hasDataProperty(lockIconGroup)) {
        lockIconGroup.data.isLockIcon = true;
    }
    
    lockIconGroup.setCoords();
    return lockIconGroup;
}

/**
 * Get the module ID from a Fabric object, or null if not a module
 */
export function getModuleId(obj: fabric.FabricObject): string | null {
    return (obj as FabricObjectWithData).data?.moduleId ?? null;
}

/**
 * Get the module type from a Fabric object, or null if not a module
 */
export function getModuleType(obj: fabric.FabricObject): string | null {
    return (obj as FabricObjectWithData).data?.moduleType ?? null;
}

/**
 * Check if a Fabric object is a grid line
 */
export function isGridObject(obj: fabric.FabricObject): boolean {
    return (obj as FabricObjectWithData).data?.isGrid === true;
}

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

// Opacity constants for module states
const OPACITY_LOCKED = 0.85;
const OPACITY_HIDDEN = 0.3;
const OPACITY_LOCK_ICON = 0.5;

// Interface for structured SVG icon element definitions
// Lucide icons are composed of multiple SVG elements (path, circle, polyline)
interface IconElement {
    type: 'path' | 'circle' | 'polyline';
    d?: string;           // For path elements
    cx?: number;          // For circle elements
    cy?: number;
    r?: number;
    points?: [number, number][];  // For polyline elements [[x1,y1], [x2,y2], ...]
    fill?: string;        // Optional fill color
    strokeWidth?: number; // Optional per-element stroke width
}

// Lucide React icon SVG definitions (24x24 viewBox) - matching ModuleToolbox icons
// These paths match the icons used in the module selector for consistency
// Paths extracted directly from Lucide icon library source
const MODULE_ICONS: Record<ModuleType, IconElement[]> = {
    // Tent icon (Lucide Tent) - 4 path elements
    campsite: [
        { type: 'path', d: 'M3.5 21 14 3' },
        { type: 'path', d: 'M20.5 21 10 3' },
        { type: 'path', d: 'M15.5 21 12 15l-3.5 6' },
        { type: 'path', d: 'M2 21h20' },
    ],
    // Bath icon (Lucide Bath) - toilet/restroom - 5 path elements
    toilet: [
        { type: 'path', d: 'M10 4 8 6' },
        { type: 'path', d: 'M17 19v2' },
        { type: 'path', d: 'M2 12h20' },
        { type: 'path', d: 'M7 19v2' },
        { type: 'path', d: 'M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5' },
    ],
    // Package icon (Lucide Package) - storage - 3 paths + 1 polyline
    storage: [
        { type: 'path', d: 'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z' },
        { type: 'path', d: 'M12 22V12' },
        { type: 'polyline', points: [[3.29, 7], [12, 12], [20.71, 7]] },
        { type: 'path', d: 'm7.5 4.27 9 5.15' },
    ],
    // Building2 icon (Lucide Building2) - 5 path elements
    building: [
        { type: 'path', d: 'M10 12h4' },
        { type: 'path', d: 'M10 8h4' },
        { type: 'path', d: 'M14 21v-3a2 2 0 0 0-4 0v3' },
        { type: 'path', d: 'M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2' },
        { type: 'path', d: 'M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16' },
    ],
    // Car icon (Lucide Car) - parking - 2 paths + 2 circles
    parking: [
        { type: 'path', d: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2' },
        { type: 'circle', cx: 7, cy: 17, r: 2 },
        { type: 'path', d: 'M9 17h6' },
        { type: 'circle', cx: 17, cy: 17, r: 2 },
    ],
    // Route icon (Lucide Route) - road - 1 path + 2 circles
    road: [
        { type: 'circle', cx: 6, cy: 19, r: 3 },
        { type: 'path', d: 'M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15' },
        { type: 'circle', cx: 18, cy: 5, r: 3 },
    ],
    // Droplet icon (Lucide Droplet) - water source - 1 path
    water_source: [
        { type: 'path', d: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z' },
    ],
    // Zap icon (Lucide Zap) - electricity - 1 path
    electricity: [
        { type: 'path', d: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z' },
    ],
    // Trash2 icon (Lucide Trash2) - waste disposal - 5 path elements
    waste_disposal: [
        { type: 'path', d: 'M10 11v6' },
        { type: 'path', d: 'M14 11v6' },
        { type: 'path', d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' },
        { type: 'path', d: 'M3 6h18' },
        { type: 'path', d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' },
    ],
    // TreePine icon (Lucide TreePine) - recreation - 2 path elements
    recreation: [
        { type: 'path', d: 'm17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z' },
        { type: 'path', d: 'M12 22v-3' },
    ],
    // Plus icon (Lucide Plus) - custom - 2 path elements
    custom: [
        { type: 'path', d: 'M5 12h14' },
        { type: 'path', d: 'M12 5v14' },
    ],
};

/**
 * Get the color for a module type
 */
export function getModuleColor(type: ModuleType): string {
    return MODULE_COLORS[type] || MODULE_COLORS.custom;
}

/**
 * Get the icon elements for a module type
 */
export function getModuleIconElements(type: ModuleType): IconElement[] {
    return MODULE_ICONS[type] || MODULE_ICONS.custom;
}

/**
 * Create Fabric.js objects from an array of IconElements
 * Returns an array of Fabric objects that can be grouped together
 */
function createIconObjects(elements: IconElement[], strokeColor: string): fabric.FabricObject[] {
    const iconObjects: fabric.FabricObject[] = [];

    for (const element of elements) {
        const baseOptions = {
            fill: element.fill || 'transparent',
            stroke: strokeColor,
            strokeWidth: element.strokeWidth ?? 2,
            strokeUniform: true,
            strokeLineCap: 'round' as const,
            strokeLineJoin: 'round' as const,
            selectable: false,
            evented: false,
        };

        switch (element.type) {
            case 'path':
                if (element.d) {
                    iconObjects.push(new fabric.Path(element.d, baseOptions));
                }
                break;
            case 'circle':
                if (element.cx !== undefined && element.cy !== undefined && element.r !== undefined) {
                    iconObjects.push(new fabric.Circle({
                        ...baseOptions,
                        left: element.cx - element.r,
                        top: element.cy - element.r,
                        radius: element.r,
                    }));
                }
                break;
            case 'polyline':
                if (element.points && element.points.length > 0) {
                    iconObjects.push(new fabric.Polyline(
                        element.points.map((point) => ({ x: point[0], y: point[1] })),
                        {
                            ...baseOptions,
                            fill: 'transparent', // Polylines should not be filled
                        }
                    ));
                }
                break;
        }
    }

    return iconObjects;
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

    // Calculate icon size based on module size (icon should fit nicely)
    const minDimension = Math.min(module.size.width, module.size.height);
    const iconSize = Math.min(minDimension * 0.6, 48); // Max 48px, 60% of smallest dimension
    const showIcon = iconSize >= 16; // Only show icon if it's at least 16px

    const objects: fabric.FabricObject[] = [rect];

    // Create the icon if it fits
    if (showIcon) {
        const iconElements = getModuleIconElements(module.type);
        // Scale factor to resize from 24x24 viewBox to desired icon size
        const scaleFactor = iconSize / 24;

        // Create individual Fabric objects for each SVG element
        const iconParts = createIconObjects(iconElements, '#1f2937');

        if (iconParts.length > 0) {
            // Group all icon parts together for proper positioning
            const iconGroup = new fabric.Group(iconParts, {
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
            });

            // Calculate the icon group's bounding box to center it properly
            iconGroup.setCoords();

            // Position the icon group at the center of the module and scale it
            iconGroup.set({
                left: module.size.width / 2,
                top: module.size.height / 2,
                scaleX: scaleFactor,
                scaleY: scaleFactor,
            });

            // Recalculate coordinates after all changes
            iconGroup.setCoords();
            objects.push(iconGroup);
        }
    }

    // Create the group with center origin for rotation around center
    // Position is stored as top-left, but we need to set left/top as center point
    const centerX = module.position.x + module.size.width / 2;
    const centerY = module.position.y + module.size.height / 2;
    
    const group = new fabric.Group(objects, {
        left: centerX,
        top: centerY,
        angle: module.rotation,
        originX: 'center',
        originY: 'center',
        lockScalingFlip: true,
    });

    // Store module ID for reference (set after creation for Fabric v6)
    (group as fabric.Group & { data?: Record<string, unknown> }).data = {
        moduleId: module.id,
        moduleType: module.type
    };

    // Apply custom rotation control with distinct purple color
    // This overrides the mtr control for this specific object
    const defaultMtr = group.controls.mtr;
    if (defaultMtr) {
        // Custom rotate cursor SVG (classic rotation arrows)
        const rotateCursorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`;
        const rotateCursor = `url('data:image/svg+xml;base64,${btoa(rotateCursorSvg)}') 12 12, crosshair`;

        group.controls.mtr = new fabric.Control({
            x: defaultMtr.x,
            y: defaultMtr.y,
            offsetX: defaultMtr.offsetX,
            offsetY: defaultMtr.offsetY ?? -40,
            actionHandler: defaultMtr.actionHandler,
            cursorStyleHandler: () => rotateCursor,
            actionName: 'rotate',
            withConnection: true,
            render: (ctx: CanvasRenderingContext2D, left: number, top: number) => {
                const size = 12;
                ctx.save();
                ctx.translate(left, top);

                // Draw purple rotation handle
                ctx.fillStyle = '#9333ea';
                ctx.strokeStyle = '#7e22ce';
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.arc(0, 0, size / 2, 0, Math.PI * 2, false);
                ctx.fill();
                ctx.stroke();

                ctx.restore();
            },
        });
    }

    // Custom render function for scaling controls (black with white border for visibility)
    const scalingControlRender = (ctx: CanvasRenderingContext2D, left: number, top: number) => {
        const size = 10;
        ctx.save();
        ctx.translate(left, top);

        // Draw black scaling handle with white border for contrast
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    };

    // Apply custom render to all corner scaling controls
    const scalingControlNames = ['tl', 'tr', 'bl', 'br', 'ml', 'mr', 'mt', 'mb'] as const;
    for (const controlName of scalingControlNames) {
        const control = group.controls[controlName];
        if (control) {
            group.controls[controlName] = new fabric.Control({
                x: control.x,
                y: control.y,
                offsetX: control.offsetX,
                offsetY: control.offsetY,
                actionHandler: control.actionHandler,
                cursorStyleHandler: control.cursorStyleHandler,
                actionName: control.actionName,
                render: scalingControlRender,
            });
        }
    }

    // Apply locked state - prevent transformation but allow selection
    if (module.locked) {
        // Add dashed border for locked modules
        rect.set({
            strokeDashArray: [5, 5],
            strokeWidth: 2,
        });

        // Add semi-transparent lock icon overlay in center
        const lockIconGroup = createLockIcon();
        
        if (lockIconGroup) {
            const lockIconSize = Math.min(minDimension * 0.4, 32); // Smaller than module icon
            const lockScaleFactor = lockIconSize / 24;
            
            lockIconGroup.set({
                left: module.size.width / 2,
                top: module.size.height / 2,
                scaleX: lockScaleFactor,
                scaleY: lockScaleFactor,
            });
            lockIconGroup.setCoords();
            objects.push(lockIconGroup);
        }

        group.set({
            selectable: true, // Keep selectable for properties panel
            evented: true,
            // Prevent all transformations
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            // Visual indicator - 80-90% opacity
            opacity: OPACITY_LOCKED,
        });
    }

    // Apply visibility - semi-transparent ghost mode
    if (!module.visible) {
        group.set({
            // Use semi-transparent ghost mode instead of fully hidden
            opacity: OPACITY_HIDDEN,
            // Keep it selectable and visible for interaction
            selectable: true,
            evented: true,
        });
    }

    return group;
}

/**
 * Update an existing Fabric object with new module data
 * 
 * @param obj - Fabric Group object to update
 * @param module - Module data with top-left position coordinates
 * @throws Error if module data is invalid
 */
export function updateModuleObject(obj: fabric.Group, module: AnyModule): void {
    // Validate module data
    if (!module.size.width || !module.size.height || 
        module.size.width <= 0 || module.size.height <= 0 ||
        !Number.isFinite(module.size.width) || !Number.isFinite(module.size.height)) {
        const errorDetails = {
            width: module.size.width,
            height: module.size.height,
            moduleId: module.id,
            moduleType: module.type
        };
        console.warn('[updateModuleObject] Invalid module size:', errorDetails);
        throw new Error(
            `[updateModuleObject] Invalid module size: width=${module.size.width}, height=${module.size.height}. ` +
            `Module ID: ${module.id}, Type: ${module.type}`
        );
    }
    
    if (!Number.isFinite(module.position.x) || !Number.isFinite(module.position.y)) {
        const errorDetails = {
            x: module.position.x,
            y: module.position.y,
            moduleId: module.id
        };
        console.warn('[updateModuleObject] Invalid module position:', errorDetails);
        throw new Error(
            `[updateModuleObject] Invalid module position: x=${module.position.x}, y=${module.position.y}. ` +
            `Module ID: ${module.id}`
        );
    }
    
    // Convert top-left position to center position (since origin is center)
    const centerX = module.position.x + module.size.width / 2;
    const centerY = module.position.y + module.size.height / 2;
    
    obj.set({
        left: centerX,
        top: centerY,
        angle: module.rotation ?? 0,
    });

    // Update size by scaling the group
    const currentWidth = obj.width || 1;
    const currentHeight = obj.height || 1;
    
    // Validate current dimensions
    if (currentWidth <= 0 || currentHeight <= 0 || 
        !Number.isFinite(currentWidth) || !Number.isFinite(currentHeight)) {
        console.warn('[updateModuleObject] Invalid current object dimensions:', {
            width: currentWidth,
            height: currentHeight,
            moduleId: module.id
        });
        // Use module size directly as fallback
        obj.set({
            scaleX: 1,
            scaleY: 1,
        });
    } else {
        obj.set({
            scaleX: module.size.width / currentWidth,
            scaleY: module.size.height / currentHeight,
        });
    }

    // Apply locked state - prevent transformation but allow selection
    if (module.locked) {
        // Update border to dashed for locked modules
        const rectObj = obj.getObjects().find(o => o.type === 'rect') as fabric.Rect | undefined;
        if (rectObj) {
            rectObj.set({
                strokeDashArray: [5, 5],
                strokeWidth: 2,
            });
        }

        // Add or update lock icon overlay if not already present
        const existingLockIcon = obj.getObjects().find(o => {
            if (hasDataProperty(o)) {
                return o.data.isLockIcon === true;
            }
            // Fallback: check if it's a group at center position with lock-like structure
            if (o.type === 'group' && o.left === 0 && o.top === 0) {
                const group = o as fabric.Group;
                const paths = group.getObjects().filter(obj => obj.type === 'path');
                if (paths.length === 2) {
                    // Likely a lock icon - mark it
                    if (hasDataProperty(group)) {
                        group.data.isLockIcon = true;
                    }
                    return true;
                }
            }
            return false;
        });
        
        if (!existingLockIcon) {
            const moduleWidth = obj.width || module.size.width;
            const moduleHeight = obj.height || module.size.height;
            const minDimension = Math.min(moduleWidth, moduleHeight);
            const lockIconGroup = createLockIcon();
            
            if (lockIconGroup) {
                const lockIconSize = Math.min(minDimension * 0.4, 32);
                const lockScaleFactor = lockIconSize / 24;
                
                lockIconGroup.set({
                    left: 0, // Center of group (which is at center origin)
                    top: 0,
                    scaleX: lockScaleFactor,
                    scaleY: lockScaleFactor,
                });
                lockIconGroup.setCoords();
                obj.add(lockIconGroup);
                obj.setCoords();
            }
        }

        obj.set({
            selectable: true, // Keep selectable for properties panel
            evented: true,
            // Prevent all transformations
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            // Visual indicator - 80-90% opacity
            opacity: module.visible ? OPACITY_LOCKED : OPACITY_HIDDEN, // Combine with visibility
        });
    } else {
        // Unlock if not locked
        const rectObj = obj.getObjects().find(o => o.type === 'rect') as fabric.Rect | undefined;
        if (rectObj) {
            rectObj.set({
                strokeDashArray: undefined, // Remove dashed border
                strokeWidth: 1,
            });
        }

        // Remove lock icon overlay
        const lockIconObj = obj.getObjects().find(o => {
            if (hasDataProperty(o)) {
                return o.data.isLockIcon === true;
            }
            return false;
        });
        if (lockIconObj) {
            obj.remove(lockIconObj);
            obj.setCoords();
        }

        obj.set({
            selectable: true,
            evented: true,
            lockMovementX: false,
            lockMovementY: false,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false,
            // Reset opacity if not locked (unless hidden)
            opacity: module.visible ? 1 : OPACITY_HIDDEN,
        });
    }

    // Update visibility (semi-transparent ghost mode)
    // Only apply if not already handled by locked state
    if (!module.visible && !module.locked) {
        obj.set({
            opacity: OPACITY_HIDDEN, // Ghost mode
        });
    } else if (!module.visible && module.locked) {
        // Locked modules already have opacity set, but hidden locked should be more transparent
        obj.set({
            opacity: Math.min(obj.opacity || 1, OPACITY_HIDDEN), // Ensure hidden locked is very transparent
        });
    }

    obj.setCoords();
}

/**
 * Extract module changes from a Fabric object
 * Converts from center-based coordinates (Fabric) to top-left coordinates (module storage)
 * 
 * @param obj - Fabric Group object with center origin
 * @returns Module changes with top-left position coordinates
 * @throws Error if object dimensions are invalid
 */
export function extractModuleChanges(obj: fabric.Group): {
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;
} {
    const scaleX = obj.scaleX || 1;
    const scaleY = obj.scaleY || 1;
    
    // Validate scale values
    if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
        const errorDetails = { scaleX, scaleY };
        console.warn('[extractModuleChanges] Invalid scale values:', errorDetails);
        throw new Error(`[extractModuleChanges] Invalid scale values: scaleX=${scaleX}, scaleY=${scaleY}`);
    }
    
    const baseWidth = obj.width || 100;
    const baseHeight = obj.height || 100;
    const width = Math.max(1, baseWidth * scaleX);
    const height = Math.max(1, baseHeight * scaleY);
    
    // Validate dimensions
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
        const errorDetails = { width, height, baseWidth, baseHeight, scaleX, scaleY };
        console.warn('[extractModuleChanges] Invalid dimensions:', errorDetails);
        throw new Error(`[extractModuleChanges] Invalid dimensions: width=${width}, height=${height}`);
    }
    
    // Convert from center coordinates to top-left coordinates
    // obj.left and obj.top represent the center when origin is 'center'
    const centerX = obj.left ?? 0;
    const centerY = obj.top ?? 0;
    
    // Validate center coordinates
    if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) {
        const errorDetails = { centerX, centerY };
        console.warn('[extractModuleChanges] Invalid center coordinates:', errorDetails);
        throw new Error(`[extractModuleChanges] Invalid center coordinates: centerX=${centerX}, centerY=${centerY}`);
    }
    
    const topLeftX = centerX - width / 2;
    const topLeftY = centerY - height / 2;

    return {
        position: {
            x: Math.round(Math.max(0, topLeftX)), // Prevent negative positions
            y: Math.round(Math.max(0, topLeftY)), // Prevent negative positions
        },
        size: {
            width: Math.round(width),
            height: Math.round(height),
        },
        rotation: obj.angle || 0,
    };
}

// ============================================================================
// MODULE CREATION FACTORY
// ============================================================================



// Default sizes per module type
const DEFAULT_MODULE_SIZES: Record<ModuleType, Size> = {
    campsite: { width: 120, height: 80 },
    toilet: { width: 60, height: 60 },
    parking: { width: 160, height: 100 },
    building: { width: 100, height: 80 },
    road: { width: 200, height: 40 },
    water_source: { width: 40, height: 40 },
    electricity: { width: 40, height: 40 },
    waste_disposal: { width: 60, height: 60 },
    recreation: { width: 120, height: 120 },
    storage: { width: 80, height: 60 },
    custom: { width: 80, height: 80 },
};

/**
 * Generate a unique z-index value
 * Uses timestamp with random component to ensure uniqueness across instances
 * This avoids global state issues in SSR or multiple instances
 */
function getUniqueZIndex(): number {
    const now = Date.now();
    // Use timestamp with random component for guaranteed uniqueness
    // Random component (0-999) handles rapid creation within same millisecond
    const randomComponent = Math.floor(Math.random() * 1000);
    return now * 1000 + randomComponent;
}

/**
 * Get the default size for a module type
 */
export function getDefaultSize(type: ModuleType): Size {
    return { ...DEFAULT_MODULE_SIZES[type] };
}

/**
 * Get default metadata for a module type
 */
export function getDefaultMetadata(type: ModuleType): Record<string, unknown> {
    const baseMetadata = { name: `New ${type.replace('_', ' ')}` };

    switch (type) {
        case 'campsite':
            return {
                ...baseMetadata,
                capacity: 4,
                amenities: [],
                pricing: { basePrice: 25, seasonalMultiplier: 1 },
                accessibility: false,
                electricHookup: false,
                waterHookup: false,
                sewerHookup: false,
            };
        case 'toilet':
            return {
                ...baseMetadata,
                capacity: 10,
                facilities: ['male', 'female'],
                maintenanceSchedule: 'daily',
                accessible: false,
            };
        case 'parking':
            return {
                ...baseMetadata,
                capacity: 20,
                vehicleTypes: ['car'],
                accessible: true,
            };
        case 'building':
            return {
                ...baseMetadata,
                buildingType: 'other',
                capacity: 50,
                operatingHours: { open: '08:00', close: '18:00' },
                services: [],
            };
        case 'road':
            return {
                ...baseMetadata,
                roadType: 'secondary',
                surfaceType: 'gravel',
                width: 4,
                speedLimit: 15,
                accessLevel: 'public',
            };
        case 'water_source':
            return {
                ...baseMetadata,
                sourceType: 'tap',
                potable: true,
                pressure: 40,
                capacity: 100,
            };
        case 'electricity':
            return {
                ...baseMetadata,
                voltage: 120,
                amperage: 30,
                outlets: 2,
                circuitType: '30amp',
                weatherproof: true,
            };
        case 'waste_disposal':
            return {
                ...baseMetadata,
                disposalType: 'garbage',
                capacity: 50,
                collectionSchedule: 'weekly',
                accessible: true,
            };
        case 'recreation':
            return {
                ...baseMetadata,
                activityType: 'other',
                capacity: 20,
                equipment: [],
                ageRestrictions: '',
                safetyRequirements: [],
            };
        case 'storage':
            return {
                ...baseMetadata,
                storageType: 'general',
                capacity: 100,
                contents: [],
                accessLevel: 'staff',
            };
        case 'custom':
        default:
            return {
                ...baseMetadata,
                description: '',
                customType: 'custom',
                properties: {},
            };
    }
}

/**
 * Create a new module with default values
 * @param type - Module type to create
 * @param position - Position on canvas
 * @param overrides - Optional property overrides
 */
export function createNewModule(
    type: ModuleType,
    position: Position,
    overrides?: Partial<
        Omit<AnyModule, 'id' | 'type' | 'createdAt' | 'updatedAt'>
    >
): AnyModule {
    const now = new Date();

    const baseModule = {
        id: crypto.randomUUID(),
        type,
        position: { ...position },
        size: getDefaultSize(type),
        rotation: 0,
        zIndex: getUniqueZIndex(),
        locked: false,
        visible: true,
        metadata: getDefaultMetadata(type),
        createdAt: now,
        updatedAt: now,
    };

    // Apply overrides
    if (overrides) {
        return {
            ...baseModule,
            ...overrides,
            metadata: {
                ...baseModule.metadata,
                ...(overrides.metadata || {}),
            },
        } as AnyModule;
    }

    return baseModule as AnyModule;
}

/**
 * Clone a module with a new ID and optional position offset
 * @param module - Module to clone
 * @param offset - Position offset for the clone
 */
export function cloneModule(
    module: AnyModule,
    offset: Position = { x: 20, y: 20 }
): AnyModule {
    const now = new Date();

    return {
        ...module,
        id: crypto.randomUUID(),
        position: {
            x: module.position.x + offset.x,
            y: module.position.y + offset.y,
        },
        zIndex: getUniqueZIndex(),
        metadata: {
            ...module.metadata,
            name: `${(module.metadata as { name?: string }).name || 'Module'} (copy)`,
        },
        createdAt: now,
        updatedAt: now,
    } as AnyModule;
}

/**
 * Clone multiple modules, preserving their relative positions
 * @param modules - Modules to clone
 * @param offset - Position offset for all clones
 */
export function cloneModules(
    modules: AnyModule[],
    offset: Position = { x: 20, y: 20 }
): AnyModule[] {
    return modules.map((m) => cloneModule(m, offset));
}
