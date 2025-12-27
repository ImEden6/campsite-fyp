/**
 * useCommandFacade Hook
 * Provides a simplified interface for common command operations.
 * 
 * This is a thin wrapper around useCommandHistory that provides stable
 * functions for adding, deleting, moving, and transforming modules.
 * 
 * @see useCommandHistory - Core command execution
 * @see commands - Command implementations
 */

import { useCallback } from 'react';
import { useCommandHistory } from '@/hooks/useCommandHistory';
import {
    AddCommand,
    DeleteCommand,
    MoveCommand,
    PropertyCommand,
    ReorderCommand,
    TransformCommand,
} from '@/commands';
import { useMapStore } from '@/stores/mapStore';
import type { AnyModule, Position, Size } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseCommandFacadeReturn {
    /** Add a new module */
    addModule: (module: AnyModule) => void;
    /** Delete modules by IDs */
    deleteModules: (ids: string[]) => void;
    /** Move a module to a new position */
    moveModule: (id: string, from: Position, to: Position) => void;
    /** Move multiple modules */
    moveModules: (moves: Array<{ id: string; oldPosition: Position; newPosition: Position }>) => void;
    /** Transform a module (position, size, rotation) */
    transformModule: (
        id: string,
        oldProps: { position: Position; size: Size; rotation: number },
        newProps: { position: Position; size: Size; rotation: number }
    ) => void;
    /** Update module properties */
    updateProperties: <T extends keyof AnyModule>(
        id: string,
        property: T,
        oldValue: AnyModule[T],
        newValue: AnyModule[T]
    ) => void;
    /** Reorder module (change zIndex) */
    reorderModule: (id: string, fromIndex: number, toIndex: number) => void;
    /** Undo last command */
    undo: () => void;
    /** Redo last undone command */
    redo: () => void;
    /** Whether undo is available */
    canUndo: boolean;
    /** Whether redo is available */
    canRedo: boolean;
    /** Execute a raw command */
    executeCommand: ReturnType<typeof useCommandHistory>['executeCommand'];
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook providing a simplified facade for command operations.
 * 
 * @returns Command facade API
 * 
 * @example
 * ```tsx
 * const { addModule, deleteModules, undo, redo, canUndo, canRedo } = useCommandFacade();
 * 
 * // Add a module
 * addModule(newModule);
 * 
 * // Delete selected modules
 * deleteModules(selectedIds);
 * 
 * // Undo if possible
 * if (canUndo) undo();
 * ```
 */
export function useCommandFacade(): UseCommandFacadeReturn {
    const { executeCommand, undo, redo, canUndo, canRedo } = useCommandHistory();

    const addModule = useCallback((module: AnyModule) => {
        executeCommand(new AddCommand([module]));
    }, [executeCommand]);

    const deleteModules = useCallback((ids: string[]) => {
        // Fetch full module objects for undo support
        const { getModule } = useMapStore.getState();
        const modulesToDelete = ids
            .map((id) => getModule(id))
            .filter((m): m is AnyModule => m !== undefined);
        if (modulesToDelete.length > 0) {
            executeCommand(new DeleteCommand(modulesToDelete));
        }
    }, [executeCommand]);

    const moveModule = useCallback((id: string, from: Position, to: Position) => {
        executeCommand(new MoveCommand([{
            id,
            oldPosition: from,
            newPosition: to,
        }]));
    }, [executeCommand]);

    const moveModules = useCallback((moves: Array<{ id: string; oldPosition: Position; newPosition: Position }>) => {
        executeCommand(new MoveCommand(moves));
    }, [executeCommand]);

    const transformModule = useCallback((
        id: string,
        oldProps: { position: Position; size: Size; rotation: number },
        newProps: { position: Position; size: Size; rotation: number }
    ) => {
        executeCommand(new TransformCommand({
            id,
            oldPosition: oldProps.position,
            newPosition: newProps.position,
            oldSize: oldProps.size,
            newSize: newProps.size,
            oldRotation: oldProps.rotation,
            newRotation: newProps.rotation,
        }));
    }, [executeCommand]);

    const updateProperties = useCallback(<T extends keyof AnyModule>(
        id: string,
        property: T,
        oldValue: AnyModule[T],
        newValue: AnyModule[T]
    ) => {
        executeCommand(new PropertyCommand([{
            moduleId: id,
            oldProps: { [property]: oldValue } as Partial<AnyModule>,
            newProps: { [property]: newValue } as Partial<AnyModule>,
        }]));
    }, [executeCommand]);

    const reorderModule = useCallback((id: string, fromIndex: number, toIndex: number) => {
        executeCommand(new ReorderCommand(id, fromIndex, toIndex));
    }, [executeCommand]);

    return {
        addModule,
        deleteModules,
        moveModule,
        moveModules,
        transformModule,
        updateProperties,
        reorderModule,
        undo,
        redo,
        canUndo,
        canRedo,
        executeCommand,
    };
}

export default useCommandFacade;
