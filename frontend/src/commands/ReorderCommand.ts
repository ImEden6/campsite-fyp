/**
 * Reorder Command
 * Changes the z-index of a module with undo support.
 * Used for layer management (bring forward, send backward).
 */

import type { Command } from './Command';
import { useMapStore } from '@/stores/mapStore';

export class ReorderCommand implements Command {
    readonly name = 'Reorder Layer';
    private readonly moduleId: string;
    private readonly oldZIndex: number;
    private readonly newZIndex: number;

    /**
     * Create a reorder command
     * @param moduleId - ID of the module to reorder
     * @param oldZIndex - Current z-index (for undo)
     * @param newZIndex - New z-index to apply
     */
    constructor(moduleId: string, oldZIndex: number, newZIndex: number) {
        if (typeof oldZIndex !== 'number' || typeof newZIndex !== 'number') {
            throw new Error('[ReorderCommand] zIndex values must be numbers');
        }
        if (oldZIndex === newZIndex) {
            console.warn('[ReorderCommand] oldZIndex equals newZIndex, no-op');
        }
        if (newZIndex < 0) {
            console.warn(
                '[ReorderCommand] newZIndex is negative, will be clamped'
            );
        }

        this.moduleId = moduleId;
        this.oldZIndex = oldZIndex;
        this.newZIndex = Math.max(0, newZIndex); // Clamp to non-negative
    }

    execute(): void {
        const { _reorderModule, getModule } = useMapStore.getState();

        // Validate: check module exists
        if (!getModule(this.moduleId)) {
            console.warn(
                `[ReorderCommand] Module ${this.moduleId} not found`
            );
            return;
        }

        _reorderModule(this.moduleId, this.newZIndex);
    }

    undo(): void {
        const { _reorderModule } = useMapStore.getState();
        _reorderModule(this.moduleId, this.oldZIndex);
    }
}
