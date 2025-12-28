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
    // Track if execute() was successful to prevent undo on failed transforms
    private wasExecuted = false;

    constructor(private transform: TransformData) { }

    execute(): void {
        const { _updateModule, getModule } = useMapStore.getState();

        // Validate: check module exists
        if (!getModule(this.transform.id)) {
            console.warn(
                `[TransformCommand] Module ${this.transform.id} not found`
            );
            return;
        }

        _updateModule(this.transform.id, {
            position: this.transform.newPosition,
            size: this.transform.newSize,
            rotation: this.transform.newRotation,
        });
        this.wasExecuted = true;
    }

    undo(): void {
        // Only undo if execute was successful
        if (!this.wasExecuted) return;

        const { _updateModule, getModule } = useMapStore.getState();

        // Check if module still exists (could have been deleted)
        if (!getModule(this.transform.id)) {
            console.warn(
                `[TransformCommand] Module ${this.transform.id} not found during undo`
            );
            return;
        }

        _updateModule(this.transform.id, {
            position: this.transform.oldPosition,
            size: this.transform.oldSize,
            rotation: this.transform.oldRotation,
        });
    }
}
