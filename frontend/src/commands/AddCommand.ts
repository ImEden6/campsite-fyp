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
    // Track which modules were actually successfully added during execute()
    // This is needed because execute() may skip duplicates, but undo() should
    // only remove modules that were actually added
    private successfullyAddedIds: string[] = [];

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

        const skippedIds: string[] = [];
        this.successfullyAddedIds = []; // Reset tracking

        for (const module of this.modules) {
            // Validate: check for duplicate IDs
            if (getModule(module.id)) {
                skippedIds.push(module.id);
                console.warn(
                    `[AddCommand] Module with ID ${module.id} already exists, skipping`
                );
                continue;
            }
            _addModule(module);
            // Track successfully added modules
            this.successfullyAddedIds.push(module.id);
        }

        if (skippedIds.length > 0 && skippedIds.length === this.modules.length) {
            // All modules were skipped - this is an error condition
            throw new Error(
                `[AddCommand] All modules already exist. IDs: ${skippedIds.join(', ')}`
            );
        }
    }

    undo(): void {
        const { _removeModules } = useMapStore.getState();
        // Only remove modules that were actually successfully added during execute()
        // This prevents removing modules that were skipped due to duplicate IDs
        if (this.successfullyAddedIds.length > 0) {
            _removeModules(this.successfullyAddedIds);
        }
    }
}