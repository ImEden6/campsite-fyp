/**
 * Module Factory
 * Creates Fabric.js objects from module data
 */

import * as fabricImpl from 'fabric';
import { Point } from 'fabric';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fabric: any = fabricImpl;

type FabricUtil = {
    makeBoundingBoxFromPoints: (
        points: Array<{ x: number; y: number }>
    ) => { left: number; top: number; width: number; height: number };
};
const fabricUtil = fabricImpl.util as FabricUtil;
import type { AnyModule, ModuleType, Position, Size } from '@/types';
import { useMapStore } from '@/stores/mapStore';
import type { FabricObject, FabricGroup } from '@/types/fabricTypes';
import {
    hasDataProperty,
    OPACITY_HIDDEN,
} from '@/types/fabricTypes';

// ============================================================================
// TYPE HELPERS (re-exported for backward compatibility)
// ============================================================================

export { hasDataProperty };
export { getModuleId, getModuleType, isGridObject } from '@/types/fabricTypes';

// Local re-export for internal use
export type FabricObjectWithData = FabricObject & {
    data?: { moduleId?: string; moduleType?: string; isGrid?: boolean; isLockIcon?: boolean };
};

// ============================================================================
// MODULE COLORS AND ICONS
// ============================================================================

// Module type color mapping
const MODULE_COLORS: Record<ModuleType, string> = {
    campsite: 'oklch(0.8 0.182 151.7)',      // green
    toilet: 'oklch(0.714 0.143 254.6)',        // blue
    storage: 'oklch(0.709 0.159 293.5)',       // purple
    building: 'oklch(0.705 0.187 47.6)',      // orange
    parking: 'oklch(0.551 0.023 264.4)',       // gray
    water_source: 'oklch(0.797 0.134 211.5)',  // cyan
    electricity: 'oklch(0.861 0.173 91.9)',   // yellow
    waste_disposal: 'oklch(0.637 0.208 25.3)', // red
    recreation: 'oklch(0.656 0.212 354.3)',    // pink
    custom: 'oklch(0.606 0.219 292.7)',        // violet
};

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
    return MODULE_COLORS[type] || 'gray';
}

/**
 * Get the icon elements for a module type
 */
export function getModuleIconElements(type: ModuleType): IconElement[] {
    return MODULE_ICONS[type] || [];
}

/**
 * Create Fabric.js objects from an array of IconElements
 * Returns an array of Fabric objects that can be grouped together
 */
function createIconObjects(elements: IconElement[], strokeColor: string): FabricObject[] {
    const iconObjects: FabricObject[] = [];

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

/** Max icon pixel size so Lucide strokes stay inside the module rect (avoids wide Fabric bbox). */
function moduleTypeIconSize(module: AnyModule): number {
    const minDimension = Math.min(module.size.width, module.size.height);
    return Math.min(minDimension * 0.55, module.size.width * 0.42, module.size.height * 0.42, 48);
}

/** Remove legacy map lock overlay children (map editor no longer uses module lock UI). */
function stripLegacyMapLockOverlays(obj: FabricGroup): void {
    const snap = [...(obj.getObjects?.() ?? [])];
    for (const child of snap) {
        if (hasDataProperty(child) && (child as FabricObjectWithData).data?.isLockIcon) {
            obj.remove(child);
        }
    }
}

type FabricObjectWithCenter = FabricObject & {
    getRelativeCenterPoint?: () => { x: number; y: number };
};

/** True geometric center of the module rect in the parent group's local plane (Fabric handles origin, stroke, angle). */
function getRectCenterInParent(rect: FabricObject): { x: number; y: number } | null {
    const g = rect as FabricObjectWithCenter;
    if (typeof g.getRelativeCenterPoint !== 'function') return null;
    const p = g.getRelativeCenterPoint();
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
    return { x: p.x, y: p.y };
}

/** Center the type icon on the rect — use actual rect position after LayoutManager (not assumed 0,0). */
function positionModuleTypeIcon(obj: FabricGroup, module: AnyModule): void {
    const children = obj.getObjects?.() ?? [];
    const rectObj = children.find((o: FabricObject) => o.type === 'rect') as FabricObject | undefined;
    let typeIcon = children.find(
        (o) => hasDataProperty(o) && (o as FabricObjectWithData).data?.isModuleTypeIcon === true
    ) as FabricGroup | undefined;
    if (!typeIcon) {
        typeIcon = children.filter((o) => o.type === 'group')[0] as FabricGroup | undefined;
    }
    if (!typeIcon?.set || !rectObj) return;

    const iconSize = moduleTypeIconSize(module);
    if (iconSize < 16) {
        typeIcon.set({ visible: false, opacity: 0 });
        typeIcon.setCoords?.();
        return;
    }

    const fromFabric = getRectCenterInParent(rectObj);
    const sw = Math.max(0, (rectObj.width ?? 0) * (rectObj.scaleX ?? 1));
    const sh = Math.max(0, (rectObj.height ?? 0) * (rectObj.scaleY ?? 1));
    const naiveCx = (rectObj.left ?? 0) + sw / 2;
    const naiveCy = (rectObj.top ?? 0) + sh / 2;
    const cx = fromFabric?.x ?? naiveCx;
    const cy = fromFabric?.y ?? naiveCy;
    const scaleFactor = iconSize / 24;

    typeIcon.set({
        visible: true,
        opacity: 1,
        left: cx,
        top: cy,
        scaleX: scaleFactor,
        scaleY: scaleFactor,
    });
    typeIcon.setCoords?.();
}

/**
 * Fabric v6 does not always re-run fit-content layout on child `set`, so the group's
 * `width`/`height` (used for selection controls) can stay stale. Recompute from all
 * children in group space (rect + type icon), then clamp to a floor from `module.size`
 * + stroke padding so the box never shrinks below the module footprint. Parent
 * `objectCaching: false` avoids cache-layer clipping when this box is tight.
 */
function syncModuleGroupBoxFromChildren(obj: FabricGroup, module: AnyModule): void {
    try {
    const children = obj.getObjects?.() ?? [];
    const rectChild = children.find((o: FabricObject) => o.type === 'rect') as FabricObject | undefined;
    const strokeW = typeof rectChild?.strokeWidth === 'number' ? rectChild.strokeWidth : 1;
    // Keep floor aligned with painted stroke bounds; previous +3 floor inflated selection box.
    const pad = Math.max(1, Math.ceil(strokeW));
    const floorW = Math.max(1, module.size.width + pad);
    const floorH = Math.max(1, module.size.height + pad);

    const points: Array<{ x: number; y: number }> = [];
    for (const c of children) {
        const co = c as FabricObject & {
            getRelativeCenterPoint?: () => { x: number; y: number };
            getScaledWidth?: () => number;
            getScaledHeight?: () => number;
            angle?: number;
        };
        const cp = co.getRelativeCenterPoint?.();
        if (!cp) continue;
        const sw =
            typeof co.getScaledWidth === 'function'
                ? co.getScaledWidth()
                : Math.max(0, (co.width ?? 0) * (co.scaleX ?? 1));
        const sh =
            typeof co.getScaledHeight === 'function'
                ? co.getScaledHeight()
                : Math.max(0, (co.height ?? 0) * (co.scaleY ?? 1));
        const rad = ((co.angle ?? 0) * Math.PI) / 180;
        const hw = sw / 2;
        const hh = sh / 2;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        for (const p of [
            { x: -hw, y: -hh },
            { x: hw, y: -hh },
            { x: hw, y: hh },
            { x: -hw, y: hh },
        ]) {
            points.push({
                x: cp.x + p.x * cos - p.y * sin,
                y: cp.y + p.x * sin + p.y * cos,
            });
        }
    }
    const canvasCxEarly = obj.left ?? 0;
    const canvasCyEarly = obj.top ?? 0;
    if (points.length === 0 || typeof fabricUtil?.makeBoundingBoxFromPoints !== 'function') {
        obj.set({ width: floorW, height: floorH, dirty: true });
        const oEarly = obj as FabricObject & {
            setPositionByOrigin?: (pos: InstanceType<typeof Point>, ox: string, oy: string) => void;
        };
        oEarly.setPositionByOrigin?.(new Point(canvasCxEarly, canvasCyEarly), 'center', 'center');
        return;
    }

    const box = fabricUtil.makeBoundingBoxFromPoints(points);
    const canvasCx = obj.left ?? 0;
    const canvasCy = obj.top ?? 0;
    const w = Math.max(1, box.width, floorW);
    const h = Math.max(1, box.height, floorH);

    obj.set({
        width: w,
        height: h,
        dirty: true,
    });

    const o = obj as FabricObject & {
        setPositionByOrigin?: (pos: InstanceType<typeof Point>, ox: string, oy: string) => void;
    };
    o.setPositionByOrigin?.(new Point(canvasCx, canvasCy), 'center', 'center');
    } catch (err) {
        console.warn('[syncModuleGroupBoxFromChildren] failed:', err);
    }
}

/** When the active object is an ActiveSelection that contains this module, refresh its oCoords after the child group resizes. */
function refreshCanvasSelectionIfNeeded(obj: FabricGroup): void {
    const canvas = (
        obj as FabricObject & { canvas?: { getActiveObject?: () => FabricObject | undefined } }
    ).canvas;
    const ao = canvas?.getActiveObject?.();
    if (!ao || ao === obj) return;
    const asGroup = ao as FabricGroup;
    const list = asGroup.getObjects?.() ?? [];
    if (!list.some((o) => o === obj)) return;
    (ao as FabricObject).setCoords?.();
}

/**
 * Create a Fabric.js group object from module data
 */
export function createModuleObject(module: AnyModule): FabricGroup {
    const color = getModuleColor(module.type);

    // Create the rectangle shape
    const rect = new fabric.Rect({
        width: module.size.width,
        height: module.size.height,
        fill: color,
        stroke: 'oklch(0.373 0.031 259.7)',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
        originX: 'left',
        originY: 'top',
        left: -module.size.width / 2,
        top: -module.size.height / 2,
    });

    // Icon must stay inside the rect footprint so Fabric group bbox matches the module (selection box).
    const iconSize = moduleTypeIconSize(module);
    const showIcon = iconSize >= 16;

    const objects: FabricObject[] = [rect];

    // Create the icon if it fits
    if (showIcon) {
        const iconElements = getModuleIconElements(module.type);
        // Scale factor to resize from 24x24 viewBox to desired icon size
        const scaleFactor = iconSize / 24;

        // Create individual Fabric objects for each SVG element
        const iconParts = createIconObjects(iconElements, 'oklch(0.278 0.03 256.8)');

        if (iconParts.length > 0) {
            // Group all icon parts together for proper positioning
            const iconGroup = new fabric.Group(iconParts, {
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                objectCaching: false,
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
            const iconTagged = iconGroup as FabricObjectWithData;
            iconTagged.data = {
                ...(typeof iconTagged.data === 'object' && iconTagged.data ? iconTagged.data : {}),
                isModuleTypeIcon: true,
            };
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
        objectCaching: false,
    });

    // Store module ID for reference (set after creation for Fabric v6)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (group as any & { data?: Record<string, unknown> }).data = {
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
            // Large negative offset inflates the selection outline above the module
            offsetY: defaultMtr.offsetY ?? -26,
            actionHandler: defaultMtr.actionHandler,
            cursorStyleHandler: () => rotateCursor,
            actionName: 'rotate',
            withConnection: true,
            render: (ctx: CanvasRenderingContext2D, left: number, top: number) => {
                const size = 12;
                ctx.save();
                ctx.translate(left, top);

                // Draw purple rotation handle
                ctx.fillStyle = 'oklch(0.558 0.252 302.3)';
                ctx.strokeStyle = 'oklch(0.496 0.237 301.9)';
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
        ctx.fillStyle = 'oklch(0 0 0)';
        ctx.strokeStyle = 'oklch(1 0 89.9)';
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

    // Hidden modules: ghost opacity (map editor no longer applies lock visuals on canvas)
    if (!module.visible) {
        group.set({
            opacity: OPACITY_HIDDEN,
            selectable: true,
            evented: true,
        });
    }

    group.set({
        hasControls: true,
        hasBorders: true,
        borderScaleFactor: 1,
    });

    // Re-center type icon and refresh group width/height for correct first-paint selection bounds.
    positionModuleTypeIcon(group, module);
    syncModuleGroupBoxFromChildren(group, module);
    group.getObjects?.().forEach((ch: FabricObject) => {
        ch.setCoords?.();
    });
    group.setCoords();

    return group;
}

/**
 * Update an existing Fabric object with new module data
 * 
 * @param obj - Fabric Group object to update
 * @param module - Module data with top-left position coordinates
 * @throws Error if module data is invalid
 */
export function updateModuleObject(obj: FabricGroup, module: AnyModule): void {
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

    stripLegacyMapLockOverlays(obj);

    // Convert top-left position to center position (since origin is center)
    const centerX = module.position.x + module.size.width / 2;
    const centerY = module.position.y + module.size.height / 2;

    obj.set({
        left: centerX,
        top: centerY,
        angle: module.rotation ?? 0,
    });

    // Rect is the module footprint; scale the group from rect size (not obj.width — includes icon bbox).
    const rectObj = obj.getObjects().find((o: FabricObject) => o.type === 'rect');
    if (rectObj?.set) {
        rectObj.set({
            width: module.size.width,
            height: module.size.height,
            left: -module.size.width / 2,
            top: -module.size.height / 2,
            scaleX: 1,
            scaleY: 1,
            strokeDashArray: undefined,
            strokeWidth: 1,
        });
        rectObj.setCoords?.();
    }

    // Module footprint lives on the inner rect; group scale must stay 1 or selection/icon math drifts.
    obj.set({ scaleX: 1, scaleY: 1 });

    // Clamp group box to module footprint first (avoids clip while icon coords may still be stale), then re-center icon, then sync again for tight controls.
    syncModuleGroupBoxFromChildren(obj, module);
    positionModuleTypeIcon(obj, module);
    syncModuleGroupBoxFromChildren(obj, module);

    obj.set({
        selectable: true,
        evented: true,
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false,
        opacity: module.visible ? 1 : OPACITY_HIDDEN,
        hasControls: true,
        hasBorders: true,
        borderScaleFactor: 1,
        objectCaching: false,
    });

    obj.getObjects?.().forEach((ch: FabricObject) => {
        ch.setCoords?.();
    });
    obj.setCoords();
    refreshCanvasSelectionIfNeeded(obj);

    const canvas = (obj as FabricObject & { canvas?: { requestRenderAll?: () => void } }).canvas;
    canvas?.requestRenderAll?.();
}

/**
 * Extract module changes from a Fabric object
 * Converts from center-based coordinates (Fabric) to top-left coordinates (module storage)
 * 
 * @param obj - Fabric Group object with center origin
 * @returns Module changes with top-left position coordinates
 * @throws Error if object dimensions are invalid
 */
export function extractModuleChanges(obj: FabricObject): {
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

    const children = (obj as FabricGroup).getObjects?.() ?? [];
    const rectObj = children.find((o: FabricObject) => o.type === 'rect');

    let width: number;
    let height: number;
    if (rectObj && typeof rectObj.width === 'number' && typeof rectObj.height === 'number') {
        const rw = (rectObj.width || 1) * (rectObj.scaleX || 1);
        const rh = (rectObj.height || 1) * (rectObj.scaleY || 1);
        width = Math.max(1, rw * scaleX);
        height = Math.max(1, rh * scaleY);
    } else {
        const baseWidth = obj.width || 100;
        const baseHeight = obj.height || 100;
        width = Math.max(1, baseWidth * scaleX);
        height = Math.max(1, baseHeight * scaleY);
    }

    // Validate dimensions
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
        const errorDetails = { width, height, scaleX, scaleY };
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
    water_source: { width: 40, height: 40 },
    electricity: { width: 40, height: 40 },
    waste_disposal: { width: 60, height: 60 },
    recreation: { width: 120, height: 120 },
    storage: { width: 80, height: 60 },
    custom: { width: 80, height: 80 },
};

/** PostgreSQL INT / Prisma Int max for zIndex on MapFacility */
const MAX_Z_INDEX = 2_147_483_647;

/**
 * Next stacking order above current modules. Must fit INT4 — do not use timestamps×1000.
 */
function getUniqueZIndex(): number {
    try {
        const modules = useMapStore.getState().getModules();
        let maxZ = 0;
        for (const m of modules) {
            const raw = m.zIndex;
            const z =
                typeof raw === 'number' && Number.isFinite(raw)
                    ? Math.min(Math.max(0, Math.floor(raw)), MAX_Z_INDEX)
                    : 0;
            if (z > maxZ) maxZ = z;
        }
        const next = maxZ + 1;
        return next > MAX_Z_INDEX ? 1 : next;
    } catch {
        return 1;
    }
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
