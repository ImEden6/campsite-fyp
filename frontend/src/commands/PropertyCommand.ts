/**
 * Property Command
 * Changes module properties with undo support.
 * Designed to be batched for multi-select edits.
 */

import type { Command } from './Command';
import type { AnyModule } from '@/types';
import { useMapStore } from '@/stores/mapStore';
import { useEditorStore } from '@/stores/editorStore';

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

    /**
     * Sync editorStore locked/hidden Sets with module's locked/visible state.
     * Batches all changes and updates the store once for efficiency.
     */
    private syncEditorStoreState(): void {
        const { lockedModuleIds, hiddenModuleIds } = useEditorStore.getState();
        const { getModule } = useMapStore.getState();
        const newLocked = new Set(lockedModuleIds);
        const newHidden = new Set(hiddenModuleIds);
        let hasChanges = false;

        for (const { moduleId } of this.changes) {
            const module = getModule(moduleId);
            if (!module) continue;

            const shouldBeLocked = module.locked;
            const shouldBeHidden = !module.visible;

            if (lockedModuleIds.has(moduleId) !== shouldBeLocked) {
                hasChanges = true;
                if (shouldBeLocked) {
                    newLocked.add(moduleId);
                } else {
                    newLocked.delete(moduleId);
                }
            }
            if (hiddenModuleIds.has(moduleId) !== shouldBeHidden) {
                hasChanges = true;
                if (shouldBeHidden) {
                    newHidden.add(moduleId);
                } else {
                    newHidden.delete(moduleId);
                }
            }
        }

        if (hasChanges) {
            useEditorStore.setState({
                lockedModuleIds: newLocked,
                hiddenModuleIds: newHidden,
            });
        }
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
        this.syncEditorStoreState();
    }

    undo(): void {
        const { _updateModule, getModule } = useMapStore.getState();

        // Apply old props in reverse order
        for (const { moduleId, oldProps } of [...this.changes].reverse()) {
            if (!getModule(moduleId)) {
                console.warn(
                    `[PropertyCommand] Module ${moduleId} not found during undo, skipping`
                );
                continue;
            }
            _updateModule(moduleId, oldProps);
        }
        this.syncEditorStoreState();
    }
}