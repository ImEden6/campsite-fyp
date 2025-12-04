/**
 * Rotate Module Command
 * Command for rotating a module
 */

import type { Command } from '../core/commands';
import type { IMapService } from '../core/services';
import type { AnyModule } from '@/types';

export class RotateModuleCommand implements Command {
  description: string;
  groupId?: string;

  constructor(
    private mapService: IMapService,
    private mapId: string,
    private moduleId: string,
    private newRotation: number,
    private oldRotation: number,
    groupId?: string
  ) {
    this.description = `Rotate module to ${Math.round(newRotation)}°`;
    this.groupId = groupId;
  }

  canExecute(): boolean {
    const module = this.mapService.getModule(this.mapId, this.moduleId);
    return module !== null && !module.locked;
  }

  async execute(): Promise<void> {
    const module = this.mapService.getModule(this.mapId, this.moduleId);
    if (!module) {
      throw new Error(`Module ${this.moduleId} not found`);
    }

    const updatedModule: AnyModule = {
      ...module,
      rotation: this.newRotation,
      updatedAt: new Date(),
    };

    await this.mapService.updateModule(this.mapId, updatedModule);
  }

  async undo(): Promise<void> {
    const module = this.mapService.getModule(this.mapId, this.moduleId);
    if (!module) {
      throw new Error(`Module ${this.moduleId} not found`);
    }

    const updatedModule: AnyModule = {
      ...module,
      rotation: this.oldRotation,
      updatedAt: new Date(),
    };

    await this.mapService.updateModule(this.mapId, updatedModule);
  }
}

