/**
 * Zustand Repository
 * Wraps Zustand store as a repository implementation
 */

import { useMapStore } from '@/stores/mapStore';
import type { CampsiteMap, AnyModule } from '@/types';

/**
 * Repository interface for map data access
 */
export interface IMapRepository {
  getMap(id: string): CampsiteMap | null;
  getAllMaps(): CampsiteMap[];
  updateMap(id: string, updates: Partial<CampsiteMap>): void;
  addModule(mapId: string, module: AnyModule): void;
  updateModule(mapId: string, module: AnyModule): void;
  removeModule(mapId: string, moduleId: string): void;
  getModules(mapId: string): AnyModule[];
  getModule(mapId: string, moduleId: string): AnyModule | null;
  selectMap(id: string | null): void;
  getSelectedMapId(): string | null;
}

/**
 * Zustand-based map repository implementation
 */
export class ZustandMapRepository implements IMapRepository {
  getMap(id: string): CampsiteMap | null {
    const { maps } = useMapStore.getState();
    return maps.find((m) => m.id === id) ?? null;
  }

  getAllMaps(): CampsiteMap[] {
    const { maps } = useMapStore.getState();
    return maps;
  }

  updateMap(id: string, updates: Partial<CampsiteMap>): void {
    useMapStore.getState().updateMap(id, updates);
  }

  addModule(mapId: string, module: AnyModule): void {
    useMapStore.getState().addModule(mapId, module);
  }

  updateModule(mapId: string, module: AnyModule): void {
    useMapStore.getState().updateModule(mapId, module);
  }

  removeModule(mapId: string, moduleId: string): void {
    useMapStore.getState().removeModule(mapId, moduleId);
  }

  getModules(mapId: string): AnyModule[] {
    const map = this.getMap(mapId);
    return map?.modules ?? [];
  }

  getModule(mapId: string, moduleId: string): AnyModule | null {
    const modules = this.getModules(mapId);
    return modules.find((m) => m.id === moduleId) ?? null;
  }

  selectMap(id: string | null): void {
    useMapStore.getState().selectMap(id);
  }

  getSelectedMapId(): string | null {
    return useMapStore.getState().selectedMapId;
  }
}

