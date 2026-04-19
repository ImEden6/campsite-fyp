/**
 * useSelectionManager Hook
 * Syncs Fabric.js selection with editorStore and handles locked module prevention.
 * 
 * This hook listens to Fabric selection events and keeps the editorStore
 * selectedIds in sync. It also prevents selection of locked modules.
 * 
 * @see useFabricCanvas - Required dependency for canvas operations
 * @see editorStore - Consumes/updates selectedIds, isModuleLocked
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { FabricCanvas, FabricObject, FabricEvent } from '@/types/fabricTypes';
import { getModuleId } from '@/types/fabricTypes';

// ============================================================================
// TYPES
// ============================================================================

export interface UseSelectionManagerOptions {
    /** Callback when selection changes */
    onSelectionChange?: (ids: string[]) => void;
    /** Whether to prevent selecting locked modules */
    preventLockedSelection?: boolean;
    /** Callback to set the interacting module ID (to avoid sync loops) */
    setInteractingId?: (id: string | null) => void;
}

export interface UseSelectionManagerReturn {
    /** Get currently selected module IDs */
    getSelectedIds: () => string[];
    /** Set selection programmatically */
    setSelection: (ids: string[]) => void;
    /** Clear current selection */
    clearSelection: () => void;
    /** Restore selection after an operation (e.g., undo) */
    restoreSelection: (ids: string[]) => void;
    /** Sync selection from Fabric to store */
    syncFromFabric: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing selection sync between Fabric.js and editorStore.
 * 
 * @param canvas - Fabric canvas instance (or null if not ready)
 * @param options - Selection manager options
 * @returns Selection management API
 * 
 * @example
 * ```tsx
 * const { getSelectedIds, setSelection, clearSelection } = useSelectionManager(
 *   canvasRef.current,
 *   { preventLockedSelection: true }
 * );
 * ```
 */
export function useSelectionManager(
    canvas: FabricCanvas | null,
    options: UseSelectionManagerOptions = {}
): UseSelectionManagerReturn {
    const { onSelectionChange, preventLockedSelection = true, setInteractingId } = options;

    // Get store actions
    const setStoreSelection = useEditorStore((state) => state.setSelection);
    const clearStoreSelection = useEditorStore((state) => state.clearSelection);
    const isModuleLocked = useEditorStore((state) => state.isModuleLocked);

    // Track if we're programmatically updating selection to avoid loops
    const isProgrammaticRef = useRef(false);

    // ========================================================================
    // SELECTION EXTRACTION
    // ========================================================================

    /**
     * Extract module IDs from Fabric selection
     */
    const extractSelectedIds = useCallback((objects: FabricObject[]): string[] => {
        const ids: string[] = [];
        for (const obj of objects) {
            const moduleId = getModuleId(obj);
            if (moduleId) {
                ids.push(moduleId);
            }
        }
        return ids;
    }, []);

    /**
     * Filter out locked modules from selection
     */
    const filterLockedModules = useCallback((objects: FabricObject[]): FabricObject[] => {
        if (!preventLockedSelection) return objects;

        return objects.filter((obj) => {
            const moduleId = getModuleId(obj);
            if (!moduleId) return true; // Keep non-module objects
            return !isModuleLocked(moduleId);
        });
    }, [preventLockedSelection, isModuleLocked]);

    // ========================================================================
    // FABRIC EVENT HANDLERS
    // ========================================================================

    /**
     * Handle selection:created event
     */
    const handleSelectionCreated = useCallback((e: FabricEvent) => {
        if (isProgrammaticRef.current || !canvas) return;

        const selected = e.selected || [];

        // Filter out locked modules if needed
        if (preventLockedSelection) {
            const unlocked = filterLockedModules(selected);

            // If all selected modules are locked, discard selection
            if (unlocked.length === 0 && selected.length > 0) {
                canvas.discardActiveObject();
                canvas.requestRenderAll();
                return;
            }

            // If some modules are locked, update selection to only unlocked
            if (unlocked.length < selected.length) {
                isProgrammaticRef.current = true;
                canvas.discardActiveObject();

                if (unlocked.length === 1) {
                    canvas.setActiveObject(unlocked[0]!);
                } else if (unlocked.length > 1) {
                    // Create ActiveSelection for multiple objects
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const fabric = (window as any).fabric;
                    if (fabric?.ActiveSelection) {
                        const selection = new fabric.ActiveSelection(unlocked, { canvas });
                        canvas.setActiveObject(selection);
                    }
                }

                canvas.requestRenderAll();
                isProgrammaticRef.current = false;
            }
        }

        const ids = extractSelectedIds(canvas.getActiveObjects());
        setStoreSelection(ids);
        onSelectionChange?.(ids);
    }, [canvas, preventLockedSelection, filterLockedModules, extractSelectedIds, setStoreSelection, onSelectionChange]);

    /**
     * Handle selection:updated event
     */
    const handleSelectionUpdated = useCallback((e: FabricEvent) => {
        if (isProgrammaticRef.current || !canvas) return;

        const selected = e.selected || [];

        // Filter out locked modules if needed
        if (preventLockedSelection && selected.length > 0) {
            const unlocked = filterLockedModules(selected);

            if (unlocked.length < selected.length) {
                // Some newly added modules are locked - remove them from selection
                isProgrammaticRef.current = true;

                const currentActive = canvas.getActiveObjects();
                const validObjects = currentActive.filter((obj) => {
                    const moduleId = getModuleId(obj);
                    return !moduleId || !isModuleLocked(moduleId);
                });

                canvas.discardActiveObject();

                if (validObjects.length === 1) {
                    canvas.setActiveObject(validObjects[0]!);
                } else if (validObjects.length > 1) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const fabric = (window as any).fabric;
                    if (fabric?.ActiveSelection) {
                        const selection = new fabric.ActiveSelection(validObjects, { canvas });
                        canvas.setActiveObject(selection);
                    }
                }

                canvas.requestRenderAll();
                isProgrammaticRef.current = false;
            }
        }

        const ids = extractSelectedIds(canvas.getActiveObjects());
        setStoreSelection(ids);
        onSelectionChange?.(ids);
    }, [canvas, preventLockedSelection, filterLockedModules, extractSelectedIds, setStoreSelection, isModuleLocked, onSelectionChange]);

    /**
     * Handle selection:cleared event
     */
    const handleSelectionCleared = useCallback(() => {
        if (isProgrammaticRef.current) return;

        clearStoreSelection();
        onSelectionChange?.([]);
    }, [clearStoreSelection, onSelectionChange]);

    /**
     * Handle object interaction start (to skip module sync)
     */
    const handleObjectMoving = useCallback((e: FabricEvent) => {
        const id = getModuleId(e.target);
        if (id && setInteractingId) {
            setInteractingId(id);
        }
    }, [setInteractingId]);

    /**
     * Handle object interaction end (to resume module sync)
     */
    const handleObjectModified = useCallback(() => {
        if (setInteractingId) {
            setInteractingId(null);
        }
    }, [setInteractingId]);

    // ========================================================================
    // ATTACH/DETACH LISTENERS
    // ========================================================================

    useEffect(() => {
        if (!canvas) return;

        canvas.on('selection:created', handleSelectionCreated);
        canvas.on('selection:updated', handleSelectionUpdated);
        canvas.on('selection:cleared', handleSelectionCleared);
        canvas.on('object:moving', handleObjectMoving);
        canvas.on('object:scaling', handleObjectMoving);
        canvas.on('object:rotating', handleObjectMoving);
        canvas.on('object:modified', handleObjectModified);

        return () => {
            canvas.off('selection:created', handleSelectionCreated);
            canvas.off('selection:updated', handleSelectionUpdated);
            canvas.off('selection:cleared', handleSelectionCleared);
            canvas.off('object:moving', handleObjectMoving);
            canvas.off('object:scaling', handleObjectMoving);
            canvas.off('object:rotating', handleObjectMoving);
            canvas.off('object:modified', handleObjectModified);
        };
    }, [canvas, handleSelectionCreated, handleSelectionUpdated, handleSelectionCleared, handleObjectMoving, handleObjectModified]);

    // ========================================================================
    // API METHODS
    // ========================================================================

    const getSelectedIds = useCallback((): string[] => {
        return useEditorStore.getState().selectedIds;
    }, []);

    const setSelection = useCallback((ids: string[]) => {
        setStoreSelection(ids);
        onSelectionChange?.(ids);
    }, [setStoreSelection, onSelectionChange]);

    const clearSelection = useCallback(() => {
        if (canvas) {
            isProgrammaticRef.current = true;
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            isProgrammaticRef.current = false;
        }
        clearStoreSelection();
        onSelectionChange?.([]);
    }, [canvas, clearStoreSelection, onSelectionChange]);

    const restoreSelection = useCallback((ids: string[]) => {
        if (!canvas || ids.length === 0) return;

        isProgrammaticRef.current = true;

        // Find Fabric objects matching the IDs
        const objects = canvas.getObjects();
        const toSelect = objects.filter((obj) => {
            const moduleId = getModuleId(obj);
            return moduleId && ids.includes(moduleId);
        });

        canvas.discardActiveObject();

        if (toSelect.length === 1) {
            canvas.setActiveObject(toSelect[0]!);
        } else if (toSelect.length > 1) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fabric = (window as any).fabric;
            if (fabric?.ActiveSelection) {
                const selection = new fabric.ActiveSelection(toSelect, { canvas });
                canvas.setActiveObject(selection);
            }
        }

        canvas.requestRenderAll();
        isProgrammaticRef.current = false;

        setStoreSelection(ids);
        onSelectionChange?.(ids);
    }, [canvas, setStoreSelection, onSelectionChange]);

    const syncFromFabric = useCallback(() => {
        if (!canvas) return;

        const ids = extractSelectedIds(canvas.getActiveObjects());
        setStoreSelection(ids);
        onSelectionChange?.(ids);
    }, [canvas, extractSelectedIds, setStoreSelection, onSelectionChange]);

    return useMemo(() => ({
        getSelectedIds,
        setSelection,
        clearSelection,
        restoreSelection,
        syncFromFabric,
    }), [getSelectedIds, setSelection, clearSelection, restoreSelection, syncFromFabric]);
}

export default useSelectionManager;
