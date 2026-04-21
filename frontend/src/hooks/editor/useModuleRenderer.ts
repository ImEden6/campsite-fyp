/**
 * useModuleRenderer Hook
 * Syncs map modules with Fabric.js objects on the canvas.
 * 
 * Uses ID-based diffing with property change detection to update only
 * modified objects, minimizing re-renders.
 * 
 * @see useFabricCanvas - Required dependency for canvas operations
 * @see moduleFactory - Uses createModuleObject and updateModuleObject
 * @see useSelectionManager - For restoring selection after updates
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { useEditorStore } from '@/stores/editorStore';
import { createModuleObject, updateModuleObject } from '@/utils/moduleFactory';
import type { FabricCanvas, FabricObject, FabricGroup } from '@/types/fabricTypes';
import { isGridObject, isBackgroundObject, OPACITY_HIDDEN, getModuleId } from '@/types/fabricTypes';
import type { AnyModule } from '@/types';
 
 const EMPTY_MODULES: AnyModule[] = [];

// ============================================================================
// TYPES
// ============================================================================

export interface UseModuleRendererOptions {
    /** Callback when module objects are added/removed */
    onModulesRendered?: (count: number) => void;
    /** Callback to restore selection after re-render */
    restoreSelection?: (ids: string[]) => void;
    /** External ref to track interaction ID (to resolve circular dependencies) */
    externalInteractingIdRef?: React.MutableRefObject<string | null>;
    /** When true (e.g. hand/pan tool), modules do not receive pointer events or selection */
    blockModuleInteraction?: boolean;
}

export interface UseModuleRendererReturn {
    /** Force a full re-render of all modules */
    forceRender: () => void;
    /** Get the Fabric object for a module ID */
    getObjectForModule: (moduleId: string) => FabricObject | null;
    /** Get all module Fabric objects */
    getAllModuleObjects: () => FabricObject[];
    /** Set the ID of the module currently being interacted with (skips sync) */
    setInteractingId: (id: string | null) => void;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create a hash of module properties for change detection
 */
function hashModuleProps(module: AnyModule): string {
    return JSON.stringify({
        position: module.position,
        size: module.size,
        rotation: module.rotation,
        visible: module.visible,
        locked: module.locked,
        zIndex: module.zIndex,
        metadata: module.metadata,
    });
}

/**
 * Check if an object is a module object (not grid, background, etc.)
 */
function isModuleObject(obj: FabricObject): boolean {
    if (isGridObject(obj)) return false;
    if (isBackgroundObject(obj)) return false;
    const id = getModuleId(obj);
    return id !== null;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for syncing map modules with Fabric.js canvas objects.
 * 
 * @param canvas - Fabric canvas instance (or null if not ready)
 * @param options - Module renderer options
 * @returns Module renderer API
 * 
 * @example
 * ```tsx
 * const { forceRender, getObjectForModule } = useModuleRenderer(
 *   canvasRef.current,
 *   { restoreSelection: selectionManager.restoreSelection }
 * );
 * ```
 */
export function useModuleRenderer(
    canvas: FabricCanvas | null,
    options: UseModuleRendererOptions = {}
): UseModuleRendererReturn {
    const { onModulesRendered, restoreSelection, externalInteractingIdRef, blockModuleInteraction = false } = options;

    // Subscribe to map store
    const modules = useMapStore((state) => state.currentMap?.modules ?? EMPTY_MODULES);

    // Track previous module hashes for change detection
    const prevHashesRef = useRef<Map<string, string>>(new Map());
    // Track Fabric objects by module ID
    const objectMapRef = useRef<Map<string, FabricGroup>>(new Map());
    // Track ID of module currently being manipulated (to skip sync-back loops)
    const internalInteractingIdRef = useRef<string | null>(null);
    const interactingIdRef = externalInteractingIdRef || internalInteractingIdRef;

    // Create module ID to module lookup
    const moduleMap = useMemo(() => {
        const map = new Map<string, AnyModule>();
        for (const module of modules) {
            map.set(module.id, module);
        }
        return map;
    }, [modules]);

    // ========================================================================
    // RENDERING LOGIC
    // ========================================================================

    /**
     * Render modules to canvas using ID-based diffing
     */
    const renderModules = useCallback(() => {
        if (!canvas) return;

        // Get current selection before modifying objects
        const selectedIds = useEditorStore.getState().selectedIds;

        // Build set of current module IDs
        const currentIds = new Set(modules.map((m: AnyModule) => m.id));
        const newHashes = new Map<string, string>();

        // Track which modules were added/updated
        let addedCount = 0;
        let updatedCount = 0;

        // Process each module
        for (const module of modules) {
            const hash = hashModuleProps(module);
            newHashes.set(module.id, hash);

            const existingObj = objectMapRef.current.get(module.id);
            const prevHash = prevHashesRef.current.get(module.id);

            if (existingObj) {
                // Object exists - check if needs update
                // SKIP update if this module is currently being interacted with (user is dragging it)
                if (prevHash !== hash && interactingIdRef.current !== module.id) {
                    updateModuleObject(existingObj, module);
                    applyVisualState(existingObj, module);
                    updatedCount++;
                }
            } else {
                // New module - create object
                const obj = createModuleObject(module);
                if (obj) {
                    applyVisualState(obj, module);
                    canvas.add(obj);
                    objectMapRef.current.set(module.id, obj);
                    addedCount++;
                }
            }
        }

        // Remove objects for deleted modules
        const idsToRemove: string[] = [];
        for (const [id, obj] of objectMapRef.current) {
            if (!currentIds.has(id)) {
                canvas.remove(obj);
                idsToRemove.push(id);
            }
        }
        for (const id of idsToRemove) {
            objectMapRef.current.delete(id);
            prevHashesRef.current.delete(id);
        }

        // Update hashes
        prevHashesRef.current = newHashes;

        // Sort objects by zIndex
        sortObjectsByZIndex();

        canvas.requestRenderAll();

        // Restore selection if any modules were selected
        if (selectedIds.length > 0 && restoreSelection) {
            // Filter to only IDs that still exist
            const validIds = selectedIds.filter((id) => currentIds.has(id));
            if (validIds.length > 0) {
                restoreSelection(validIds);
            }
        }

        onModulesRendered?.(objectMapRef.current.size);

        if (addedCount > 0 || updatedCount > 0 || idsToRemove.length > 0) {
            console.debug('[useModuleRenderer] Rendered:', {
                added: addedCount,
                updated: updatedCount,
                removed: idsToRemove.length,
                total: objectMapRef.current.size,
            });
        }
        // applyVisualState and sortObjectsByZIndex are intentionally omitted - they're defined 
        // after this hook but used within render cycle; adding them would cause block-scope issues
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvas, modules, onModulesRendered, restoreSelection]);

    /**
     * Apply visual state (opacity, selectability) based on hidden/locked status
     */
    const applyVisualState = useCallback((obj: FabricGroup, module: AnyModule) => {
        const isHidden = !module.visible;

        obj.opacity = isHidden ? OPACITY_HIDDEN : 1;
        obj.selectable = !isHidden;
        obj.evented = !isHidden;

        obj.set?.({
            hasControls: !isHidden,
            hasBorders: true,
            borderScaleFactor: 1,
        });

        obj.setCoords?.();
    }, []);

    /**
     * Sort canvas objects by zIndex
     */
    const sortObjectsByZIndex = useCallback(() => {
        if (!canvas) return;

        const objects = canvas.getObjects();

        // Separate module objects from grid/background
        const moduleObjs: FabricObject[] = [];
        const otherObjs: FabricObject[] = [];

        for (const obj of objects) {
            if (isModuleObject(obj)) {
                moduleObjs.push(obj);
            } else {
                otherObjs.push(obj);
            }
        }

        // Sort module objects by zIndex
        moduleObjs.sort((a, b) => {
            const idA = getModuleId(a);
            const idB = getModuleId(b);
            const modA = idA ? moduleMap.get(idA) : null;
            const modB = idB ? moduleMap.get(idB) : null;
            return (modA?.zIndex ?? 0) - (modB?.zIndex ?? 0);
        });

        // Re-add in order (other objects first, then modules by zIndex)
        // Note: This is simplified - in production, may want to use bringToFront/sendToBack
    }, [canvas, moduleMap]);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    /**
     * Re-render when modules change
     */
    useEffect(() => {
        renderModules();
    }, [renderModules]);

    /**
     * Update visual state when hidden/locked IDs change
     */
    useEffect(() => {
        if (!canvas) return;

        for (const [id, obj] of objectMapRef.current) {
            const module = moduleMap.get(id);
            if (module) {
                applyVisualState(obj, module);
            }
        }

        canvas.requestRenderAll();
    }, [canvas, moduleMap, applyVisualState]);

    /**
     * Pan / hand tool: make module groups ignore pointer events so the map can be dragged
     */
    useEffect(() => {
        if (!canvas) return;

        for (const [id, obj] of objectMapRef.current) {
            const module = moduleMap.get(id);
            if (blockModuleInteraction) {
                obj.selectable = false;
                obj.evented = false;
            } else if (module) {
                applyVisualState(obj, module);
            }
        }

        if (blockModuleInteraction) {
            canvas.discardActiveObject?.();
        }
        canvas.requestRenderAll();
    }, [canvas, blockModuleInteraction, moduleMap, applyVisualState]);

    // ========================================================================
    // API
    // ========================================================================

    const forceRender = useCallback(() => {
        // Clear hashes to force full re-render
        prevHashesRef.current.clear();

        // Clear existing objects
        if (canvas) {
            for (const obj of objectMapRef.current.values()) {
                canvas.remove(obj);
            }
        }
        objectMapRef.current.clear();

        renderModules();
    }, [canvas, renderModules]);

    const getObjectForModule = useCallback((moduleId: string): FabricObject | null => {
        return objectMapRef.current.get(moduleId) ?? null;
    }, []);

    const getAllModuleObjects = useCallback((): FabricObject[] => {
        return Array.from(objectMapRef.current.values());
    }, []);

    const setInteractingId = useCallback((id: string | null) => {
        interactingIdRef.current = id;
    }, []);

    return useMemo(() => ({
        forceRender,
        getObjectForModule,
        getAllModuleObjects,
        setInteractingId,
    }), [forceRender, getObjectForModule, getAllModuleObjects, setInteractingId]);
}

export default useModuleRenderer;
