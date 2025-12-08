/**
 * ResizeCommand
 * Resizes a module to a new size and optionally adjusts position.
 * Position changes are needed when resizing from top/left handles.
 */

import type { Command } from './Command';
import type { Size, Position } from '@/types';
import { useMapStore } from '@/stores/mapStore';

interface ResizeData {
    id: string;
    oldSize: Size;
    newSize: Size;
    oldPosition?: Position;
    newPosition?: Position;
}

export class ResizeCommand implements Command {
    readonly name = 'Resize';

    constructor(private resize: ResizeData) { }

    execute(): void {
        const updates: { size: Size; position?: Position } = { size: this.resize.newSize };
        if (this.resize.newPosition) {
            updates.position = this.resize.newPosition;
        }
        useMapStore.getState()._updateModule(this.resize.id, updates);
    }

    undo(): void {
        const updates: { size: Size; position?: Position } = { size: this.resize.oldSize };
        if (this.resize.oldPosition) {
            updates.position = this.resize.oldPosition;
        }
        useMapStore.getState()._updateModule(this.resize.id, updates);
    }
}
