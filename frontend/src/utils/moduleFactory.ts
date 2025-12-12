/**
 * Module Factory
 * Creates Fabric.js objects from module data
 */

import * as fabric from 'fabric';
import type { AnyModule, ModuleType, Position, Size } from '@/types';

// Type helper for accessing custom data on Fabric objects
export type FabricObjectWithData = fabric.FabricObject & {
    data?: { moduleId?: string; moduleType?: string; isGrid?: boolean };
};

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

// Simple custom SVG paths for module icons (24x24 viewBox)
const MODULE_ICONS: Record<ModuleType, string> = {
    // Simple tent shape
    campsite: 'M4 20L12 4L20 20H4Z M12 20V12',
    // Simple toilet/WC symbol
    toilet: 'M8 4h8v4H8V4Z M6 10h12v10H6V10Z M12 14v4',
    // Simple box/crate
    storage: 'M4 8L12 4L20 8V16L12 20L4 16V8Z M12 12V20',
    // Simple building with windows
    building: 'M4 20V6h16v14H4Z M8 10h2v2H8V10Z M14 10h2v2h-2V10Z M10 16h4v4h-4v-4Z',
    // P letter for parking
    parking: 'M7 4h6a5 5 0 0 1 0 10H11v6H7V4Z M11 10h2a1 1 0 0 0 0-2h-2v2Z',
    // Simple road lines
    road: 'M6 4v16 M18 4v16 M12 4v3 M12 10v4 M12 17v3',
    // Water drop
    water_source: 'M12 4C12 4 6 12 6 15a6 6 0 0 0 12 0c0-3-6-11-6-11Z',
    // Lightning bolt
    electricity: 'M13 2L4 14h7l-2 8 11-12h-7l2-8Z',
    // Trash bin
    waste_disposal: 'M6 6h12 M8 6V4h8v2 M7 6v12h10V6 M10 9v6 M14 9v6',
    // Simple play/activity symbol
    recreation: 'M8 6l10 6-10 6V6Z',
    // Simple gear/settings
    custom: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M12 2v4 M12 18v4 M4 12h4 M16 12h4',
};

/**
 * Get the color for a module type
 */
export function getModuleColor(type: ModuleType): string {
    return MODULE_COLORS[type] || MODULE_COLORS.custom;
}

/**
 * Get the icon path for a module type
 */
export function getModuleIconPath(type: ModuleType): string {
    return MODULE_ICONS[type] || MODULE_ICONS.custom;
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
        const iconPath = getModuleIconPath(module.type);
        // Scale factor to resize from 24x24 viewBox to desired icon size
        const scaleFactor = iconSize / 24;

        const icon = new fabric.Path(iconPath, {
            fill: 'transparent',
            stroke: '#1f2937',
            strokeWidth: 2 / scaleFactor, // Adjust stroke width for scaling
            strokeLineCap: 'round',
            strokeLineJoin: 'round',
            originX: 'center',
            originY: 'center',
            left: module.size.width / 2,
            top: module.size.height / 2,
            scaleX: scaleFactor,
            scaleY: scaleFactor,
            selectable: false,
            evented: false,
        });
        objects.push(icon);
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

// Counter for z-index uniqueness when rapid creation occurs
let zIndexCounter = 0;
let lastZIndexTimestamp = 0;

function getUniqueZIndex(): number {
    const now = Date.now();
    if (now === lastZIndexTimestamp) {
        zIndexCounter++;
    } else {
        zIndexCounter = 0;
        lastZIndexTimestamp = now;
    }
    // Combine timestamp with counter for guaranteed uniqueness
    return now * 1000 + zIndexCounter;
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
