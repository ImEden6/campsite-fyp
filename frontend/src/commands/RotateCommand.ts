/**
 * RotateCommand
 * Rotates a module to a new angle.
 */

import type { Command } from './Command';
import { useMapStore } from '@/stores/mapStore';

interface RotateData {
    id: string;
    oldRotation: number;
    newRotation: number;
}

export class RotateCommand implements Command {
    readonly name = 'Rotate';

    constructor(private rotate: RotateData) { }

    execute(): void {
        useMapStore.getState()._updateModule(this.rotate.id, { rotation: this.rotate.newRotation });
    }

    undo(): void {
        useMapStore.getState()._updateModule(this.rotate.id, { rotation: this.rotate.oldRotation });
    }
}
