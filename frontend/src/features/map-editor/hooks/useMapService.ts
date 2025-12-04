/**
 * useMapService Hook
 * Hook for accessing map service
 */

import { useMemo } from 'react';
import { useMapEditor } from './useMapEditor';
import type { CampsiteMap, AnyModule } from '@/types';

/**
 * Hook for accessing map service
 */
export function useMapService() {
  const { mapService } = useMapEditor();

  return useMemo(
    () => ({
      getMap: (id: string) => mapService.getMap(id),
      getAllMaps: () => mapService.getAllMaps(),
      updateMap: (id: string, updates: Partial<CampsiteMap>) =>
        mapService.updateMap(id, updates),
      addModule: (mapId: string, module: AnyModule) =>
        mapService.addModule(mapId, module),
      updateModule: (mapId: string, module: AnyModule) =>
        mapService.updateModule(mapId, module),
      removeModule: (mapId: string, moduleId: string) =>
        mapService.removeModule(mapId, moduleId),
      getModules: (mapId: string) => mapService.getModules(mapId),
      getModule: (mapId: string, moduleId: string) =>
        mapService.getModule(mapId, moduleId),
    }),
    [mapService]
  );
}

