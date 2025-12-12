/**
 * Property Command
 * Changes module properties with undo support.
 * Designed to be batched for multi-select edits.
 */

import type { Command } from './Command';
import type { AnyModule } from '@/types';
import { useMapStore } from '@/stores/mapStore';

export interface PropertyChange {
    moduleId: string;
    oldProps: Partial<AnyModule>;
    newProps: Partial<AnyModule>;
}

export class PropertyCommand implements Command {
    readonly name = 'Edit Properties';
    private readonly changes: PropertyChange[];

    /**
     * Create a property command
     * @param changes - Array of property changes to apply
     */
    constructor(changes: PropertyChange[]) {
        if (!Array.isArray(changes)) {
            throw new Error('[PropertyCommand] changes must be an array');
        }
        if (changes.length === 0) {
            console.warn('[PropertyCommand] Created with empty changes array');
        }
        this.changes = changes;
    }

    execute(): void {
        const { _updateModule, getModule } = useMapStore.getState();

        for (const { moduleId, newProps } of this.changes) {
            // Validate: check module exists
            if (!getModule(moduleId)) {
                console.warn(
                    `[PropertyCommand] Module ${moduleId} not found, skipping`
                );
                continue;
            }
            _updateModule(moduleId, newProps);
        }
    }

    undo(): void {
        const { _updateModule } = useMapStore.getState();

        // Apply old props in reverse order
        for (const { moduleId, oldProps } of [...this.changes].reverse()) {
            _updateModule(moduleId, oldProps);
        }
    }
}
