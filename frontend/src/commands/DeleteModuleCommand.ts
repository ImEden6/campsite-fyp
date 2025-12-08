/**
 * DeleteModuleCommand
 * Removes one or more modules from the map.
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

export class DeleteModuleCommand implements Command {
    readonly name = 'Delete';

    private modules: AnyModule[];
    private originalModulesSnapshot: AnyModule[];

    constructor(modules: AnyModule[]) {
        // Bug 1 Fix: Create deep copies to prevent mutation issues
        // Use deepClone helper that properly handles Date objects
        this.modules = modules.map((module) => deepClone(module));

        // Bug 2 Fix: Store snapshot of original modules array for accurate position restoration
        const store = useMapStore.getState();
        const currentModules = store.getModules();
        
        // Create deep copy of the entire original array to preserve order
        this.originalModulesSnapshot = deepClone(currentModules);
    }

    execute(): void {
        const store = useMapStore.getState();
        const ids = this.modules.map((m) => m.id);
        store._removeModules(ids);
    }

    undo(): void {
        const store = useMapStore.getState();
        const currentModules = store.getModules();
        
        // Bug 2 Fix: Restore modules at their original positions
        // Reconstruct the original array by merging:
        // 1. Modules from the original snapshot (restored at their original positions)
        // 2. Any new modules added after deletion (appended at the end)
        
        // Create maps for quick lookup
        const modulesToRestoreMap = new Map(this.modules.map((m) => [m.id, m]));
        const currentModuleMap = new Map(currentModules.map((m) => [m.id, m]));
        const deletedModuleIds = new Set(this.modules.map((m) => m.id));
        
        // Reconstruct array: for each module in original order, use restored version if deleted,
        // otherwise use current version if it exists, otherwise skip (was deleted elsewhere)
        const restoredModules: AnyModule[] = [];
        
        this.originalModulesSnapshot.forEach((originalModule) => {
            if (deletedModuleIds.has(originalModule.id)) {
                // This module was deleted - use the restored copy
                const restoredModule = modulesToRestoreMap.get(originalModule.id);
                if (restoredModule) {
                    restoredModules.push(restoredModule);
                }
            } else {
                // This module wasn't deleted - use current version if it still exists
                const currentModule = currentModuleMap.get(originalModule.id);
                if (currentModule) {
                    restoredModules.push(currentModule);
                }
                // If it doesn't exist in current, it was deleted by another operation - skip it
            }
        });
        
        // Append any modules that were added after the deletion (not in original snapshot)
        currentModules.forEach((module) => {
            const wasInOriginal = this.originalModulesSnapshot.some((m) => m.id === module.id);
            if (!wasInOriginal) {
                restoredModules.push(module);
            }
        });
        
        store._setModules(restoredModules);
    }
}
