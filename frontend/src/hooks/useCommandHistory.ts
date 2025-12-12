/**
 * useCommandHistory Hook
 * Manages undo/redo functionality for command-based operations.
 * Provides a clean interface for executing commands and managing history.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Command } from '@/commands';

interface UseCommandHistoryReturn {
    /** Execute a command and add it to the undo stack */
    executeCommand: (command: Command) => void;
    /** Undo the last command */
    undo: () => void;
    /** Redo the last undone command */
    redo: () => void;
    /** Whether undo is available */
    canUndo: boolean;
    /** Whether redo is available */
    canRedo: boolean;
    /** Ref to latest executeCommand function (for use in effects) */
    executeCommandRef: React.MutableRefObject<((command: Command) => void) | undefined>;
    /** Ref to latest undo function (for use in effects) */
    undoRef: React.MutableRefObject<(() => void) | undefined>;
    /** Ref to latest redo function (for use in effects) */
    redoRef: React.MutableRefObject<(() => void) | undefined>;
}

interface UseCommandHistoryOptions {
    /** Callback to mark the document as dirty when commands are executed */
    onCommandExecuted?: () => void;
    /** Maximum number of commands to keep in history (default: unlimited) */
    maxHistorySize?: number;
}

/**
 * Hook for managing command history with undo/redo functionality
 * 
 * @param options Configuration options for the command history
 * @returns Command history management functions and state
 */
export function useCommandHistory(
    options: UseCommandHistoryOptions = {}
): UseCommandHistoryReturn {
    const { onCommandExecuted, maxHistorySize } = options;

    // History state
    const [undoStack, setUndoStack] = useState<Command[]>([]);
    const [redoStack, setRedoStack] = useState<Command[]>([]);

    // Refs for stable function references (for use in effects)
    const executeCommandRef = useRef<((command: Command) => void) | undefined>();
    const undoRef = useRef<(() => void) | undefined>();
    const redoRef = useRef<(() => void) | undefined>();

    // Execute command and add to history
    const executeCommand = useCallback((command: Command) => {
        command.execute();
        
        setUndoStack((prev) => {
            const newStack = [...prev, command];
            // Apply max history size limit if specified
            if (maxHistorySize !== undefined && newStack.length > maxHistorySize) {
                return newStack.slice(-maxHistorySize);
            }
            return newStack;
        });
        
        setRedoStack([]); // Clear redo stack on new action
        onCommandExecuted?.();
    }, [maxHistorySize, onCommandExecuted]);

    // Undo
    const undo = useCallback(() => {
        if (undoStack.length === 0) return;
        
        try {
            const command = undoStack[undoStack.length - 1]!;
            command.undo();
            
            setUndoStack((prev) => prev.slice(0, -1));
            setRedoStack((prev) => [...prev, command]);
            onCommandExecuted?.();
        } catch (error) {
            console.error('[useCommandHistory] Error during undo:', error);
        }
    }, [undoStack.length, onCommandExecuted]);

    // Redo
    const redo = useCallback(() => {
        if (redoStack.length === 0) return;
        
        try {
            const command = redoStack[redoStack.length - 1]!;
            command.execute();
            
            setRedoStack((prev) => prev.slice(0, -1));
            setUndoStack((prev) => [...prev, command]);
            onCommandExecuted?.();
        } catch (error) {
            console.error('[useCommandHistory] Error during redo:', error);
        }
    }, [redoStack.length, onCommandExecuted]);

    // Update refs when functions change (for use in effects that need stable references)
    useEffect(() => {
        executeCommandRef.current = executeCommand;
    }, [executeCommand]);

    useEffect(() => {
        undoRef.current = undo;
    }, [undo]);

    useEffect(() => {
        redoRef.current = redo;
    }, [redo]);

    const canUndo = useMemo(() => undoStack.length > 0, [undoStack.length]);
    const canRedo = useMemo(() => redoStack.length > 0, [redoStack.length]);

    return {
        executeCommand,
        undo,
        redo,
        canUndo,
        canRedo,
        executeCommandRef,
        undoRef,
        redoRef,
    };
}
