/**
 * Delete Command
 * Deletes one or more modules from the map.
 * Stores full module data for undo restoration.
 */

import type { Command } from './Command';
import type { AnyModule } from '@/types';
import { useMapStore } from '@/stores/mapStore';

export class DeleteCommand implements Command {
    readonly name = 'Delete Module';
    private readonly modules: AnyModule[]; // Stored for undo

    /**
     * Create a delete command
     * @param modules - Array of modules to delete (must be full module objects for undo)
     */
    constructor(modules: AnyModule[]) {
        if (!Array.isArray(modules)) {
            throw new Error('[DeleteCommand] modules must be an array');
        }
        if (modules.length === 0) {
            console.warn('[DeleteCommand] Created with empty module array');
        }
        // Store deep copies to preserve state for undo
        // Using structuredClone for proper deep copy of nested objects like metadata
        this.modules = modules.map((m) => structuredClone(m));
    }

    execute(): void {
        const { _removeModules, getModule } = useMapStore.getState();

        // Validate: filter to only existing modules
        const existingIds = this.modules
            .filter((m) => getModule(m.id))
            .map((m) => m.id);

        if (existingIds.length !== this.modules.length) {
            console.warn(
                `[DeleteCommand] Some modules not found, deleting ${existingIds.length}/${this.modules.length}`
            );
        }

        _removeModules(existingIds);
    }

    undo(): void {
        const { _addModule } = useMapStore.getState();
        this.modules.forEach((m) => _addModule(m));
    }
}
