/**
 * MoveCommand
 * Moves one or more modules to new positions.
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

    constructor(private moves: MoveData[]) { }

    execute(): void {
        const store = useMapStore.getState();
        this.moves.forEach(({ id, newPosition }) => {
            store._updateModule(id, { position: newPosition });
        });
    }

    undo(): void {
        const store = useMapStore.getState();
        this.moves.forEach(({ id, oldPosition }) => {
            store._updateModule(id, { position: oldPosition });
        });
    }
}
