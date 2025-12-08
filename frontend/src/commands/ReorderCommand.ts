/**
 * ReorderCommand
 * Changes the z-index of a module.
 */

import type { Command } from './Command';
import { useMapStore } from '@/stores/mapStore';

interface ReorderData {
    id: string;
    oldZIndex: number;
    newZIndex: number;
}

export class ReorderCommand implements Command {
    readonly name = 'Reorder';

    constructor(private reorder: ReorderData) { }

    execute(): void {
        useMapStore.getState()._reorderModule(this.reorder.id, this.reorder.newZIndex);
    }

    undo(): void {
        useMapStore.getState()._reorderModule(this.reorder.id, this.reorder.oldZIndex);
    }
}
