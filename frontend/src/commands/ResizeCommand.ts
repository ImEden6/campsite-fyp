/**
 * ResizeCommand
 * Resizes a module to a new size.
 */

import type { Command } from './Command';
import type { Size } from '@/types';
import { useMapStore } from '@/stores/mapStore';

interface ResizeData {
    id: string;
    oldSize: Size;
    newSize: Size;
}

export class ResizeCommand implements Command {
    readonly name = 'Resize';

    constructor(private resize: ResizeData) { }

    execute(): void {
        useMapStore.getState()._updateModule(this.resize.id, { size: this.resize.newSize });
    }

    undo(): void {
        useMapStore.getState()._updateModule(this.resize.id, { size: this.resize.oldSize });
    }
}
