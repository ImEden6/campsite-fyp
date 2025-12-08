/**
 * Map Store
 * Manages the current campsite map data and modules.
 * This is the single source of truth for all module data.
 */

import { create } from 'zustand';
import type { CampsiteMap, AnyModule } from '@/types';

interface MapState {
    // State
    currentMap: CampsiteMap | null;
    isLoading: boolean;
    isDirty: boolean;
    error: string | null;
}

interface MapActions {
    // Map lifecycle
    setMap: (map: CampsiteMap) => void;
    clearMap: () => void;
    markDirty: () => void;
    markClean: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Module CRUD (internal - use commands for history)
    _addModule: (module: AnyModule) => void;
    _updateModule: (id: string, changes: Partial<AnyModule>) => void;
    _removeModule: (id: string) => void;
    _removeModules: (ids: string[]) => void;
    _setModules: (modules: AnyModule[]) => void;
    _reorderModule: (id: string, newZIndex: number) => void;

    // Selectors
    getModule: (id: string) => AnyModule | undefined;
    getModules: () => AnyModule[];
}

type MapStore = MapState & MapActions;

export const useMapStore = create<MapStore>((set, get) => ({
    // Initial state
    currentMap: null,
    isLoading: false,
    isDirty: false,
    error: null,

    // Map lifecycle
    setMap: (map) => set({ currentMap: map, isDirty: false, error: null }),

    clearMap: () => set({ currentMap: null, isDirty: false, error: null }),

    markDirty: () => set({ isDirty: true }),

    markClean: () => set({ isDirty: false }),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    // Module CRUD (internal)
    _addModule: (module) => set((state) => {
        if (!state.currentMap) return state;
        return {
            currentMap: {
                ...state.currentMap,
                modules: [...state.currentMap.modules, module],
                updatedAt: new Date(),
            },
        };
    }),

    _updateModule: (id, changes) => set((state) => {
        if (!state.currentMap) return state;
        return {
            currentMap: {
                ...state.currentMap,
                modules: state.currentMap.modules.map((m) =>
                    m.id === id ? { ...m, ...changes, updatedAt: new Date() } as AnyModule : m
                ),
                updatedAt: new Date(),
            },
        };
    }),

    _removeModule: (id) => set((state) => {
        if (!state.currentMap) return state;
        return {
            currentMap: {
                ...state.currentMap,
                modules: state.currentMap.modules.filter((m) => m.id !== id),
                updatedAt: new Date(),
            },
        };
    }),

    _removeModules: (ids) => set((state) => {
        if (!state.currentMap) return state;
        const idSet = new Set(ids);
        return {
            currentMap: {
                ...state.currentMap,
                modules: state.currentMap.modules.filter((m) => !idSet.has(m.id)),
                updatedAt: new Date(),
            },
        };
    }),

    _setModules: (modules) => set((state) => {
        if (!state.currentMap) return state;
        return {
            currentMap: {
                ...state.currentMap,
                modules,
                updatedAt: new Date(),
            },
        };
    }),

    _reorderModule: (id, newZIndex) => set((state) => {
        if (!state.currentMap) return state;
        return {
            currentMap: {
                ...state.currentMap,
                modules: state.currentMap.modules.map((m) =>
                    m.id === id ? { ...m, zIndex: newZIndex, updatedAt: new Date() } as AnyModule : m
                ),
                updatedAt: new Date(),
            },
        };
    }),

    // Selectors
    getModule: (id) => {
        const { currentMap } = get();
        return currentMap?.modules.find((m) => m.id === id);
    },

    getModules: () => {
        const { currentMap } = get();
        return currentMap?.modules ?? [];
    },
}));

// Granular selector for a specific module
export const selectModuleById = (id: string) => (state: MapStore) =>
    state.currentMap?.modules.find((m) => m.id === id);

// Selector for modules sorted by zIndex
export const selectModulesSorted = (state: MapStore) =>
    [...(state.currentMap?.modules ?? [])].sort((a, b) => a.zIndex - b.zIndex);
