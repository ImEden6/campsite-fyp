/**
 * UpdateMetadataCommand
 * Updates the metadata of a module.
 */

import type { Command } from './Command';
import type { AnyModule } from '@/types';
import { useMapStore } from '@/stores/mapStore';

/**
 * Deep clone helper that properly handles Date objects.
 * Uses structuredClone if available, otherwise falls back to a custom implementation
 * that preserves Date objects (unlike JSON.parse/stringify).
 */
function deepClone<T>(obj: T): T {
    if (typeof structuredClone !== 'undefined') {
        return structuredClone(obj);
    }
    
    // Fallback: Custom deep clone that handles Date objects
    return deepCloneWithDates(obj);
}

/**
 * Custom deep clone implementation that preserves Date objects.
 * Recursively clones objects and arrays without using JSON serialization,
 * ensuring Date objects remain as Date instances.
 */
function deepCloneWithDates<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime()) as unknown as T;
    }
    
    if (Array.isArray(obj)) {
        return obj.map((item) => deepCloneWithDates(item)) as unknown as T;
    }
    
    // Handle plain objects
    const cloned = {} as T;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            // Recursively clone nested objects (preserves Date objects)
            (cloned as Record<string, unknown>)[key] = deepCloneWithDates(value);
        }
    }
    
    return cloned;
}

export class UpdateMetadataCommand implements Command {
    readonly name = 'Update Properties';

    private id: string;
    private oldMetadata: AnyModule['metadata'];
    private newMetadata: AnyModule['metadata'];

    constructor(
        id: string,
        oldMetadata: AnyModule['metadata'],
        newMetadata: AnyModule['metadata']
    ) {
        this.id = id;
        
        // Bug 1 Fix: Create deep copies to prevent mutation issues
        // Use deepClone helper that properly handles Date objects
        this.oldMetadata = deepClone(oldMetadata);
        this.newMetadata = deepClone(newMetadata);

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
        
        // Pass only the metadata field for partial update
        store._updateModule(this.id, { metadata: this.newMetadata });
    }

    undo(): void {
        const store = useMapStore.getState();
        const module = store.getModule(this.id);
        
        // Fail explicitly if module doesn't exist (e.g., was deleted after execute)
        if (!module) {
            throw new Error(`Cannot undo update metadata: Module with id "${this.id}" does not exist`);
        }
        
        // Pass only the metadata field for partial update
        store._updateModule(this.id, { metadata: this.oldMetadata });
    }
}
