/**
 * Move Module Command
 * Command for moving a module to a new position
 */

import type { Command } from '../core/commands';
import type { IMapService } from '../core/services';
import type { Position, AnyModule } from '@/types';

export class MoveModuleCommand implements Command {
  description: string;
  groupId?: string;

  constructor(
    private mapService: IMapService,
    private mapId: string,
    private moduleId: string,
    private newPosition: Position,
    private oldPosition: Position,
    groupId?: string
  ) {
    this.description = `Move module to (${Math.round(newPosition.x)}, ${Math.round(newPosition.y)})`;
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
      position: this.newPosition,
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
      position: this.oldPosition,
      updatedAt: new Date(),
    };

    await this.mapService.updateModule(this.mapId, updatedModule);
  }
}

