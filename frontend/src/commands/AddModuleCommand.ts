/**
 * AddModuleCommand
 * Adds a new module to the map.
 */

import type { Command } from './Command';
import type { AnyModule } from '@/types';
import { useMapStore } from '@/stores/mapStore';

export class AddModuleCommand implements Command {
    readonly name = 'Add Module';

    constructor(private module: AnyModule) { }

    execute(): void {
        useMapStore.getState()._addModule(this.module);
    }

    undo(): void {
        useMapStore.getState()._removeModule(this.module.id);
    }
}
