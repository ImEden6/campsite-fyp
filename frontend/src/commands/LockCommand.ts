/**
 * LockCommand
 * Toggles the locked state of a module.
 */

import type { Command } from './Command';
import { useMapStore } from '@/stores/mapStore';

interface LockData {
    id: string;
    oldLocked: boolean;
    newLocked: boolean;
}

export class LockCommand implements Command {
    readonly name: string;

    constructor(private lock: LockData) {
        this.name = lock.newLocked ? 'Lock' : 'Unlock';
    }

    execute(): void {
        useMapStore.getState()._updateModule(this.lock.id, { locked: this.lock.newLocked });
    }

    undo(): void {
        useMapStore.getState()._updateModule(this.lock.id, { locked: this.lock.oldLocked });
    }
}
