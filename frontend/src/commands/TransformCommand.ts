/**
 * TransformCommand
 * Handles resize, rotate, and combined transform operations
 */

import type { Command } from './Command';
import type { Position, Size } from '@/types';
import { useMapStore } from '@/stores/mapStore';

interface TransformData {
    id: string;
    oldPosition: Position;
    newPosition: Position;
    oldSize: Size;
    newSize: Size;
    oldRotation: number;
    newRotation: number;
}

export class TransformCommand implements Command {
    readonly name = 'Transform';

    constructor(private transform: TransformData) { }

    execute(): void {
        useMapStore.getState()._updateModule(this.transform.id, {
            position: this.transform.newPosition,
            size: this.transform.newSize,
            rotation: this.transform.newRotation,
        });
    }

    undo(): void {
        useMapStore.getState()._updateModule(this.transform.id, {
            position: this.transform.oldPosition,
            size: this.transform.oldSize,
            rotation: this.transform.oldRotation,
        });
    }
}
