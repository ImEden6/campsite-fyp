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

    execute(): void {
        const { _updateModule, getModule } = useMapStore.getState();
        const { lockedModuleIds, hiddenModuleIds } = useEditorStore.getState();

        for (const { moduleId, newProps } of this.changes) {
            // Validate: check module exists
            if (!getModule(moduleId)) {
                console.warn(
                    `[PropertyCommand] Module ${moduleId} not found, skipping`
                );
                continue;
            }
            _updateModule(moduleId, newProps);

            // Synchronize editorStore Sets with module data
            const module = getModule(moduleId);
            if (module) {
                const newLocked = new Set(lockedModuleIds);
                const newHidden = new Set(hiddenModuleIds);

                // Sync locked state
                if (module.locked && !newLocked.has(moduleId)) {
                    newLocked.add(moduleId);
                } else if (!module.locked && newLocked.has(moduleId)) {
                    newLocked.delete(moduleId);
                }

                // Sync visible state (inverted: hidden = !visible)
                if (!module.visible && !newHidden.has(moduleId)) {
                    newHidden.add(moduleId);
                } else if (module.visible && newHidden.has(moduleId)) {
                    newHidden.delete(moduleId);
                }

                // Update editorStore if changes were made
                if (newLocked.size !== lockedModuleIds.size || 
                    Array.from(newLocked).some(id => !lockedModuleIds.has(id)) ||
                    Array.from(lockedModuleIds).some(id => !newLocked.has(id))) {
                    useEditorStore.setState({ lockedModuleIds: newLocked });
                }
                if (newHidden.size !== hiddenModuleIds.size ||
                    Array.from(newHidden).some(id => !hiddenModuleIds.has(id)) ||
                    Array.from(hiddenModuleIds).some(id => !newHidden.has(id))) {
                    useEditorStore.setState({ hiddenModuleIds: newHidden });
                }
            }
        }
    }

    undo(): void {
        const { _updateModule, getModule } = useMapStore.getState();
        const { lockedModuleIds, hiddenModuleIds } = useEditorStore.getState();

        // Apply old props in reverse order
        for (const { moduleId, oldProps } of [...this.changes].reverse()) {
            _updateModule(moduleId, oldProps);

            // Synchronize editorStore Sets with module data after undo
            const module = getModule(moduleId);
            if (module) {
                const newLocked = new Set(lockedModuleIds);
                const newHidden = new Set(hiddenModuleIds);

                // Sync locked state
                if (module.locked && !newLocked.has(moduleId)) {
                    newLocked.add(moduleId);
                } else if (!module.locked && newLocked.has(moduleId)) {
                    newLocked.delete(moduleId);
                }

                // Sync visible state (inverted: hidden = !visible)
                if (!module.visible && !newHidden.has(moduleId)) {
                    newHidden.add(moduleId);
                } else if (module.visible && newHidden.has(moduleId)) {
                    newHidden.delete(moduleId);
                }

                // Update editorStore if changes were made
                if (newLocked.size !== lockedModuleIds.size || 
                    Array.from(newLocked).some(id => !lockedModuleIds.has(id)) ||
                    Array.from(lockedModuleIds).some(id => !newLocked.has(id))) {
                    useEditorStore.setState({ lockedModuleIds: newLocked });
                }
                if (newHidden.size !== hiddenModuleIds.size ||
                    Array.from(newHidden).some(id => !hiddenModuleIds.has(id)) ||
                    Array.from(hiddenModuleIds).some(id => !newHidden.has(id))) {
                    useEditorStore.setState({ hiddenModuleIds: newHidden });
                }
            }
        }
    }
}