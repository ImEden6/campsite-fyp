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
    ) { }

    execute(): void {
        const store = useMapStore.getState();
        const module = store.getModule(this.id);
        if (module) {
            store._updateModule(this.id, { ...module, metadata: this.newMetadata } as unknown as Partial<AnyModule>);
        }
    }

    undo(): void {
        const store = useMapStore.getState();
        const module = store.getModule(this.id);
        if (module) {
            store._updateModule(this.id, { ...module, metadata: this.oldMetadata } as unknown as Partial<AnyModule>);
        }
    }
}
