/**
 * Map Service
 * Implements IMapService using Zustand repository
 */

import type { IMapService } from '../core/services';
import type { CampsiteMap, AnyModule } from '@/types';
import { ZustandMapRepository } from '../infrastructure/ZustandRepository';
import type { EventBus as IEventBus } from '../infrastructure/EventBus';

export class MapService implements IMapService {
  private repository: ZustandMapRepository;
  private eventBus: IEventBus;

  constructor(repository: ZustandMapRepository, eventBus: IEventBus) {
    this.repository = repository;
    this.eventBus = eventBus;
  }

  getMap(id: string): CampsiteMap | null {
    return this.repository.getMap(id);
  }

  getAllMaps(): CampsiteMap[] {
    return this.repository.getAllMaps();
  }

  async updateMap(id: string, updates: Partial<CampsiteMap>): Promise<void> {
    this.repository.updateMap(id, updates);
    
    // Emit event
    const map = this.getMap(id);
    if (map) {
      this.eventBus.emit('map:save', {
        mapId: id,
        success: true,
      });
    }
  }

  async addModule(mapId: string, module: AnyModule): Promise<void> {
    this.repository.addModule(mapId, module);
    
    // Emit event
    this.eventBus.emit('module:add', {
      module,
      mapId,
    });
  }

  async updateModule(mapId: string, module: AnyModule): Promise<void> {
    this.repository.updateModule(mapId, module);
    
    // Emit event
    this.eventBus.emit('module:update', {
      moduleId: module.id,
      updates: module,
      mapId,
    });
  }

  async removeModule(mapId: string, moduleId: string): Promise<void> {
    this.repository.removeModule(mapId, moduleId);
    
    // Emit event
    this.eventBus.emit('module:delete', {
      moduleIds: [moduleId],
      mapId,
    });
  }

  getModules(mapId: string): AnyModule[] {
    return this.repository.getModules(mapId);
  }

  getModule(mapId: string, moduleId: string): AnyModule | null {
    return this.repository.getModule(mapId, moduleId);
  }
}

