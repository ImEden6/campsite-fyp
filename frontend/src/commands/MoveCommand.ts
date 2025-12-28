/**
 * MoveCommand
 * Moves one or more modules to new positions
 */

import type { Command } from './Command';
import type { Position } from '@/types';
import { useMapStore } from '@/stores/mapStore';

interface MoveData {
    id: string;
    oldPosition: Position;
    newPosition: Position;
}

export class MoveCommand implements Command {
    readonly name = 'Move';
    // Track which moves were actually successful during execute()
    // This ensures undo() only reverts moves that were applied
    private successfulMoveIds = new Set<string>();

    constructor(private moves: MoveData[]) {
        if (moves.length === 0) {
            console.warn('[MoveCommand] Created with empty moves array');
        }
    }

    execute(): void {
        const { _updateModule, getModule } = useMapStore.getState();
        this.successfulMoveIds.clear(); // Reset tracking

        for (const { id, newPosition } of this.moves) {
            // Validate: check module exists
            if (!getModule(id)) {
                console.warn(`[MoveCommand] Module ${id} not found, skipping`);
                continue;
            }
            _updateModule(id, { position: newPosition });
            this.successfulMoveIds.add(id);
        }
    }

    undo(): void {
        const { _updateModule, getModule } = useMapStore.getState();

        for (const { id, oldPosition } of this.moves) {
            if (!this.successfulMoveIds.has(id)) continue;
            if (!getModule(id)) {
                console.warn(
                    `[MoveCommand] Cannot undo: Module ${id} no longer exists`
                );
                continue;
            }
            _updateModule(id, { position: oldPosition });
        }
    }
}
