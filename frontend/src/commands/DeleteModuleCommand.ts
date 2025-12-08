/**
 * DeleteModuleCommand
 * Removes one or more modules from the map.
 */

import type { Command } from './Command';
import type { AnyModule } from '@/types';
import { useMapStore } from '@/stores/mapStore';

export class DeleteModuleCommand implements Command {
    readonly name = 'Delete';

    constructor(private modules: AnyModule[]) { }

    execute(): void {
        const store = useMapStore.getState();
        const ids = this.modules.map((m) => m.id);
        store._removeModules(ids);
    }

    undo(): void {
        const store = useMapStore.getState();
        this.modules.forEach((module) => {
            store._addModule(module);
        });
    }
}
