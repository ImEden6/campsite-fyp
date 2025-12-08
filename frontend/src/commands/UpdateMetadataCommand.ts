/**
 * UpdateMetadataCommand
 * Updates the metadata of a module.
 */

import type { Command } from './Command';
import type { AnyModule } from '@/types';
import { useMapStore } from '@/stores/mapStore';

export class UpdateMetadataCommand implements Command {
    readonly name = 'Update Properties';

    constructor(
        private id: string,
        private oldMetadata: AnyModule['metadata'],
        private newMetadata: AnyModule['metadata']
    ) {
        // Validate that the module exists at construction time
        const store = useMapStore.getState();
        const module = store.getModule(this.id);
        if (!module) {
            throw new Error(`Cannot update metadata: Module with id "${this.id}" does not exist`);
        }
    }

    execute(): void {
        const store = useMapStore.getState();
        const module = store.getModule(this.id);
        
        // Fail explicitly if module doesn't exist (e.g., was deleted after command creation)
        if (!module) {
            throw new Error(`Cannot execute update metadata: Module with id "${this.id}" does not exist`);
        }
        
        store._updateModule(this.id, { ...module, metadata: this.newMetadata } as unknown as Partial<AnyModule>);
    }

    undo(): void {
        const store = useMapStore.getState();
        const module = store.getModule(this.id);
        
        // Fail explicitly if module doesn't exist (e.g., was deleted after execute)
        if (!module) {
            throw new Error(`Cannot undo update metadata: Module with id "${this.id}" does not exist`);
        }
        
        store._updateModule(this.id, { ...module, metadata: this.oldMetadata } as unknown as Partial<AnyModule>);
    }
}
