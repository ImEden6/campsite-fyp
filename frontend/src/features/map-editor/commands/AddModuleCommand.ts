/**
 * Add Module Command
 * Command for adding a new module to a map
 */

import type { Command } from '../core/commands';
import type { IMapService } from '../core/services';
import type { AnyModule } from '@/types';

export class AddModuleCommand implements Command {
  description: string;
  groupId?: string;

  constructor(
    private mapService: IMapService,
    private mapId: string,
    private module: AnyModule,
    groupId?: string
  ) {
    this.description = `Add ${module.type} module`;
    this.groupId = groupId;
  }

  canExecute(): boolean {
    return true;
  }

  async execute(): Promise<void> {
    await this.mapService.addModule(this.mapId, this.module);
  }

  async undo(): Promise<void> {
    await this.mapService.removeModule(this.mapId, this.module.id);
  }
}

