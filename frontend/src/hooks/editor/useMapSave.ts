import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import { saveMap, type SaveMapRequest, type SaveMapResponse } from '@/services/api/maps';
import type { CampsiteMap, AnyModule, UpdateModuleRequest } from '@/types';

export interface UseMapSaveOptions {
    /** Callback on save success */
    onSuccess?: (response: SaveMapResponse) => void;
    /** Callback on save error */
    onError?: (error: Error) => void;
    /** Whether the map has unsaved edits (e.g. mapStore.isDirty); preferred over internal isDirty */
    getIsDirty?: () => boolean;
    /** Get current map state */
    getCurrentMap: () => CampsiteMap | null;
    /** Callback to update local map state with server response */
    onMapUpdated?: (map: CampsiteMap, modules: AnyModule[]) => void;
}

export interface UseMapSaveReturn {
    /** Trigger save operation */
    save: () => void;
    /** Whether save is in progress */
    isSaving: boolean;
    /** Whether there are unsaved changes (reactive) */
    isDirty: boolean;
    /** Mark as dirty - triggers re-render */
    markDirty: () => void;
    /** Clear dirty state (called internally on success) */
    clearDirty: () => void;
    /** Last error from save operation */
    error: Error | null;
    /** Set initial map state after load - required for diff computation */
    setOriginalMap: (map: CampsiteMap) => void;
}

function computeModulesDiff(
    currentModules: AnyModule[],
    _originalModules: AnyModule[]
): UpdateModuleRequest[] {
    // Send all modules - backend handles idempotent updates
    // For FYP scope, this is simpler and more reliable than complex diff logic
    return currentModules.map(m => ({
        id: m.id,
        type: m.type,
        position: m.position,
        size: m.size,
        rotation: m.rotation,
        zIndex: m.zIndex,
        metadata: m.metadata,
        locked: m.locked,
        visible: m.visible,
    }));
}

export function useMapSave(options: UseMapSaveOptions): UseMapSaveReturn {
    const { getCurrentMap, getIsDirty, onSuccess, onError, onMapUpdated } = options;
    const queryClient = useQueryClient();

    // Use useState for isDirty to trigger re-renders
    const [isDirty, setIsDirty] = useState(false);

    // Store original map state for diff computation (non-reactive)
    const originalMapRef = useRef<CampsiteMap | null>(null);

    const mutation = useMutation({
        mutationFn: async (request: SaveMapRequest): Promise<SaveMapResponse> => {
            return saveMap(request);
        },
        onSuccess: (response) => {
            // Clear dirty state only after confirmed success
            setIsDirty(false);

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['maps', response.map.id] });

            // Let parent merge server modules with client-only modules (e.g. new UUIDs) before baseline
            if (onMapUpdated) {
                onMapUpdated(response.map, response.modules);
            }

            // Baseline for the next save must match what is actually in the store after onMapUpdated
            originalMapRef.current = getCurrentMap() ?? response.map;

            if (onSuccess) {
                onSuccess(response);
            }
        },
        onError: (error: Error) => {
            // Don't clear dirty state on error - user should retry
            if (onError) {
                onError(error);
            }
        },
    });

    const save = useCallback(() => {
        const currentMap = getCurrentMap();
        if (!currentMap) return;

        // Compute what changed
        const modulesDiff = computeModulesDiff(
            currentMap.modules,
            originalMapRef.current?.modules || []
        );

        const storeDirty = getIsDirty?.() ?? false;

        // Skip if nothing to save
        if (modulesDiff.length === 0 && !isDirty && !storeDirty) {
            return;
        }

        const request: SaveMapRequest = {
            mapId: currentMap.id,
            modules: modulesDiff,
            metadata: {
                name: currentMap.name,
                description: currentMap.description,
            },
            clientVersion: currentMap.updatedAt,
        };

        mutation.mutate(request);
    }, [getCurrentMap, getIsDirty, mutation, isDirty]);

    const markDirty = useCallback(() => {
        setIsDirty(true);
    }, []);

    const clearDirty = useCallback(() => {
        setIsDirty(false);
    }, []);

    const setOriginalMap = useCallback((map: CampsiteMap) => {
        originalMapRef.current = map;
    }, []);

    return useMemo(() => ({
        save,
        isSaving: mutation.isPending,
        isDirty,
        markDirty,
        clearDirty,
        error: mutation.error,
        setOriginalMap,
    }), [save, mutation.isPending, isDirty, mutation.error, markDirty, clearDirty, setOriginalMap]);
}
