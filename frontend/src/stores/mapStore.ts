/**
 * Map Store
 * Manages campsite map state and modules
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CampsiteMap, AnyModule } from '@/types';
import { indexedDBStorage } from '@/utils/indexedDBStorage';

interface MapState {
  maps: CampsiteMap[];
  selectedMapId: string | null;
  
  // Actions
  setMaps: (maps: CampsiteMap[]) => void;
  addMap: (map: CampsiteMap) => void;
  updateMap: (id: string, updates: Partial<CampsiteMap>) => void;
  removeMap: (id: string) => void;
  selectMap: (id: string | null) => void;
  
  // Module actions
  addModule: (mapId: string, module: AnyModule) => void;
  updateModule: (mapId: string, module: AnyModule) => void;
  removeModule: (mapId: string, moduleId: string) => void;
  duplicateModule: (mapId: string, moduleId: string) => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      maps: [],
      selectedMapId: null,

      setMaps: (maps) => set({ maps }),

      addMap: (map) =>
        set((state) => ({
          maps: [...state.maps, map],
        })),

      updateMap: (id, updates) =>
        set((state) => ({
          maps: state.maps.map((map) =>
            map.id === id ? { ...map, ...updates, updatedAt: new Date() } : map
          ),
        })),

      removeMap: (id) =>
        set((state) => ({
          maps: state.maps.filter((map) => map.id !== id),
          selectedMapId: state.selectedMapId === id ? null : state.selectedMapId,
        })),

      selectMap: (id) => set({ selectedMapId: id }),

      addModule: (mapId, module) =>
        set((state) => ({
          maps: state.maps.map((map) =>
            map.id === mapId
              ? { ...map, modules: [...map.modules, module], updatedAt: new Date() }
              : map
          ),
        })),

      updateModule: (mapId, updatedModule) =>
        set((state) => ({
          maps: state.maps.map((map) =>
            map.id === mapId
              ? {
                  ...map,
                  modules: map.modules.map((module) =>
                    module.id === updatedModule.id ? updatedModule : module
                  ),
                  updatedAt: new Date(),
                }
              : map
          ),
        })),

      removeModule: (mapId, moduleId) =>
        set((state) => ({
          maps: state.maps.map((map) =>
            map.id === mapId
              ? {
                  ...map,
                  modules: map.modules.filter((module) => module.id !== moduleId),
                  updatedAt: new Date(),
                }
              : map
          ),
        })),

      duplicateModule: (mapId, moduleId) =>
        set((state) => ({
          maps: state.maps.map((map) => {
            if (map.id !== mapId) return map;

            const moduleToDuplicate = map.modules.find((m) => m.id === moduleId);
            if (!moduleToDuplicate) return map;

            const duplicatedModule: AnyModule = {
              ...moduleToDuplicate,
              id: `${moduleToDuplicate.id}-copy-${Date.now()}`,
              position: {
                x: moduleToDuplicate.position.x + 20,
                y: moduleToDuplicate.position.y + 20,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            return {
              ...map,
              modules: [...map.modules, duplicatedModule],
              updatedAt: new Date(),
            };
          }),
        })),
    }),
    {
      name: 'campsite-map-storage',
      storage: indexedDBStorage,
      partialize: (state) => ({
        maps: state.maps,
        selectedMapId: state.selectedMapId,
      }),
    }
  )
);
