/**
 * Bulk Operation Command
 * Command for bulk operations (lock, unlock, align, etc.)
 */

import type { Command } from '../core/commands';
import type { IMapService } from '../core/services';
import type { AnyModule } from '@/types';

export interface BulkOperation {
  type: 'lock' | 'unlock' | 'show' | 'hide' | 'align';
  moduleIds: string[];
  alignTo?: 'left' | 'right' | 'center' | 'top' | 'bottom';
}

export class BulkOperationCommand implements Command {
  description: string;
  groupId?: string;

  private originalModules: Map<string, AnyModule> = new Map();

  constructor(
    private mapService: IMapService,
    private mapId: string,
    private operation: BulkOperation,
    groupId?: string
  ) {
    this.description = this.getDescription();
    this.groupId = groupId;
  }

  private getDescription(): string {
    const { type, moduleIds } = this.operation;
    const count = moduleIds.length;

    switch (type) {
      case 'lock':
        return `Lock ${count} module${count > 1 ? 's' : ''}`;
      case 'unlock':
        return `Unlock ${count} module${count > 1 ? 's' : ''}`;
      case 'show':
        return `Show ${count} module${count > 1 ? 's' : ''}`;
      case 'hide':
        return `Hide ${count} module${count > 1 ? 's' : ''}`;
      case 'align':
        return `Align ${count} module${count > 1 ? 's' : ''} ${this.operation.alignTo}`;
      default:
        return `Bulk operation on ${count} module${count > 1 ? 's' : ''}`;
    }
  }

  canExecute(): boolean {
    return this.operation.moduleIds.length > 0;
  }

  async execute(): Promise<void> {
    const { type, moduleIds } = this.operation;

    // Store original state
    for (const moduleId of moduleIds) {
      const module = this.mapService.getModule(this.mapId, moduleId);
      if (module) {
        this.originalModules.set(moduleId, { ...module });
      }
    }

    // Apply operation
    switch (type) {
      case 'lock':
        await this.applyLock(moduleIds, true);
        break;
      case 'unlock':
        await this.applyLock(moduleIds, false);
        break;
      case 'show':
        await this.applyVisibility(moduleIds, true);
        break;
      case 'hide':
        await this.applyVisibility(moduleIds, false);
        break;
      case 'align':
        await this.applyAlign(moduleIds);
        break;
    }
  }

  async undo(): Promise<void> {
    // Restore original state
    for (const [moduleId, originalModule] of this.originalModules) {
      await this.mapService.updateModule(this.mapId, originalModule);
    }
  }

  private async applyLock(moduleIds: string[], locked: boolean): Promise<void> {
    for (const moduleId of moduleIds) {
      const module = this.mapService.getModule(this.mapId, moduleId);
      if (module) {
        const updated: AnyModule = {
          ...module,
          locked,
          updatedAt: new Date(),
        };
        await this.mapService.updateModule(this.mapId, updated);
      }
    }
  }

  private async applyVisibility(
    moduleIds: string[],
    visible: boolean
  ): Promise<void> {
    for (const moduleId of moduleIds) {
      const module = this.mapService.getModule(this.mapId, moduleId);
      if (module) {
        const updated: AnyModule = {
          ...module,
          visible,
          updatedAt: new Date(),
        };
        await this.mapService.updateModule(this.mapId, updated);
      }
    }
  }

  private async applyAlign(moduleIds: string[]): Promise<void> {
    if (!this.operation.alignTo || moduleIds.length < 2) {
      return;
    }

    const modules = moduleIds
      .map((id) => this.mapService.getModule(this.mapId, id))
      .filter((m): m is AnyModule => m !== null);

    if (modules.length < 2) {
      return;
    }

    // Calculate alignment target
    let targetValue = 0;
    const { alignTo } = this.operation;

    if (alignTo === 'left') {
      targetValue = Math.min(...modules.map((m) => m.position.x));
    } else if (alignTo === 'right') {
      targetValue = Math.max(
        ...modules.map((m) => m.position.x + m.size.width)
      );
    } else if (alignTo === 'center') {
      const left = Math.min(...modules.map((m) => m.position.x));
      const right = Math.max(
        ...modules.map((m) => m.position.x + m.size.width)
      );
      targetValue = (left + right) / 2;
    } else if (alignTo === 'top') {
      targetValue = Math.min(...modules.map((m) => m.position.y));
    } else if (alignTo === 'bottom') {
      targetValue = Math.max(
        ...modules.map((m) => m.position.y + m.size.height)
      );
    }

    // Apply alignment
    for (const module of modules) {
      const newPosition = { ...module.position };

      if (alignTo === 'left') {
        newPosition.x = targetValue;
      } else if (alignTo === 'right') {
        newPosition.x = targetValue - module.size.width;
      } else if (alignTo === 'center') {
        newPosition.x = targetValue - module.size.width / 2;
      } else if (alignTo === 'top') {
        newPosition.y = targetValue;
      } else if (alignTo === 'bottom') {
        newPosition.y = targetValue - module.size.height;
      }

      const updated: AnyModule = {
        ...module,
        position: newPosition,
        updatedAt: new Date(),
      };
      await this.mapService.updateModule(this.mapId, updated);
    }
  }
}

