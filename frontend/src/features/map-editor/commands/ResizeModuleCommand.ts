/**
 * Resize Module Command
 * Command for resizing a module
 */

import type { Command } from '../core/commands';
import type { IMapService } from '../core/services';
import type { Size, AnyModule } from '@/types';

export class ResizeModuleCommand implements Command {
  description: string;
  groupId?: string;

  constructor(
    private mapService: IMapService,
    private mapId: string,
    private moduleId: string,
    private newSize: Size,
    private oldSize: Size,
    groupId?: string
  ) {
    this.description = `Resize module to ${Math.round(newSize.width)}x${Math.round(newSize.height)}`;
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
      size: this.newSize,
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
      size: this.oldSize,
      updatedAt: new Date(),
    };

    await this.mapService.updateModule(this.mapId, updatedModule);
  }
}

