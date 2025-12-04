/**
 * Delete Module Command
 * Command for deleting one or more modules
 */

import type { Command } from '../core/commands';
import type { IMapService } from '../core/services';
import type { AnyModule } from '@/types';

export class DeleteModuleCommand implements Command {
  description: string;
  groupId?: string;

  private deletedModules: AnyModule[] = [];

  constructor(
    private mapService: IMapService,
    private mapId: string,
    private moduleIds: string[],
    groupId?: string
  ) {
    this.description =
      moduleIds.length === 1
        ? `Delete module`
        : `Delete ${moduleIds.length} modules`;
    this.groupId = groupId;
  }

  canExecute(): boolean {
    // Check if all modules exist and are not locked
    return this.moduleIds.every((id) => {
      const module = this.mapService.getModule(this.mapId, id);
      return module !== null && !module.locked;
    });
  }

  async execute(): Promise<void> {
    // Store modules before deletion for undo
    this.deletedModules = this.moduleIds
      .map((id) => this.mapService.getModule(this.mapId, id))
      .filter((m): m is AnyModule => m !== null);

    // Delete modules
    for (const moduleId of this.moduleIds) {
      await this.mapService.removeModule(this.mapId, moduleId);
    }
  }

  async undo(): Promise<void> {
    // Restore modules
    for (const module of this.deletedModules) {
      await this.mapService.addModule(this.mapId, module);
    }
  }
}

