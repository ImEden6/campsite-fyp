/**
 * Add Command
 * Adds one or more modules to the map.
 * Supports undo by removing the added modules.
 */

import type { Command } from './Command';
import type { AnyModule } from '@/types';
import { useMapStore } from '@/stores/mapStore';

export class AddCommand implements Command {
    readonly name = 'Add Module';
    private readonly modules: AnyModule[];

    /**
     * Create an add command
     * @param modules - Array of modules to add (use [module] for single)
     */
    constructor(modules: AnyModule[]) {
        if (!Array.isArray(modules)) {
            throw new Error('[AddCommand] modules must be an array');
        }
        if (modules.length === 0) {
            console.warn('[AddCommand] Created with empty module array');
        }
        this.modules = modules;
    }

    execute(): void {
        const { _addModule, getModule } = useMapStore.getState();

        for (const module of this.modules) {
            // Validate: check for duplicate IDs
            if (getModule(module.id)) {
                console.warn(
                    `[AddCommand] Module with ID ${module.id} already exists, skipping`
                );
                continue;
            }
            _addModule(module);
        }
    }

    undo(): void {
        const { _removeModules } = useMapStore.getState();
        _removeModules(this.modules.map((m) => m.id));
    }
}