/**
 * useEditorShortcuts Hook
 * Manages global keyboard shortcuts for the map editor.
 * 
 * @see useCommandHistory - For undo/redo
 * @see useSelectionManager - For selection-related shortcuts
 * @see editorStore - For toggling grid, snap, etc.
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { Command } from '@/commands/Command';

// ============================================================================
// TYPES
// ============================================================================

export interface UseEditorShortcutsOptions {
    /** Execute a command */
    executeCommand?: ((command: Command) => void) | undefined;
    /** Undo action */
    undo?: (() => void) | undefined;
    /** Redo action */
    redo?: (() => void) | undefined;
    /** Delete selected modules */
    deleteSelected?: (() => void) | undefined;
    /** Copy selected modules */
    copySelected?: (() => void) | undefined;
    /** Paste clipboard */
    paste?: (() => void) | undefined;
    /** Duplicate selected modules */
    duplicateSelected?: (() => void) | undefined;
    /** Select all modules */
    selectAll?: (() => void) | undefined;
    /** Clear selection */
    clearSelection?: (() => void) | undefined;
    /** Zoom in */
    zoomIn?: (() => void) | undefined;
    /** Zoom out */
    zoomOut?: (() => void) | undefined;
    /** Fit to screen */
    fitToScreen?: (() => void) | undefined;
    /** Toggle pan mode */
    togglePanMode?: (() => void) | undefined;
    /** Save map */
    save?: (() => void) | undefined;
}

export interface UseEditorShortcutsReturn {
    /** Get current pressed keys */
    getPressedKeys: () => Set<string>;
    /** Check if a key is pressed */
    isKeyPressed: (key: string) => boolean;
    /** Show shortcuts dialog */
    showShortcutsDialog: () => void;
    /** Hide shortcuts dialog */
    hideShortcutsDialog: () => void;
}

// ============================================================================
// SHORTCUT DEFINITIONS
// ============================================================================

interface ShortcutDef {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: string;
}

const SHORTCUTS: ShortcutDef[] = [
    { key: 'z', ctrl: true, action: 'undo' },
    { key: 'z', ctrl: true, shift: true, action: 'redo' },
    { key: 'y', ctrl: true, action: 'redo' },
    { key: 'Delete', action: 'delete' },
    { key: 'Backspace', action: 'delete' },
    { key: 'c', ctrl: true, action: 'copy' },
    { key: 'v', ctrl: true, action: 'paste' },
    { key: 'd', ctrl: true, action: 'duplicate' },
    { key: 'a', ctrl: true, action: 'selectAll' },
    { key: 'Escape', action: 'clearSelection' },
    { key: '=', ctrl: true, action: 'zoomIn' },
    { key: '+', ctrl: true, action: 'zoomIn' },
    { key: '-', ctrl: true, action: 'zoomOut' },
    { key: '0', ctrl: true, action: 'fitToScreen' },
    { key: ' ', action: 'togglePan' }, // Spacebar
    { key: 'g', ctrl: true, action: 'toggleGrid' },
    { key: 's', ctrl: true, action: 'save' },
    { key: '?', action: 'showHelp' },
];

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing keyboard shortcuts in the map editor.
 * 
 * @param options - Shortcut action handlers
 * @returns Shortcut API
 * 
 * @example
 * ```tsx
 * useEditorShortcuts({
 *   undo: () => commandHistory.undo(),
 *   redo: () => commandHistory.redo(),
 *   deleteSelected: () => deleteModules(selectedIds),
 * });
 * ```
 */
export function useEditorShortcuts(
    options: UseEditorShortcutsOptions = {}
): UseEditorShortcutsReturn {
    const {
        undo,
        redo,
        deleteSelected,
        copySelected,
        paste,
        duplicateSelected,
        selectAll,
        clearSelection,
        zoomIn,
        zoomOut,
        fitToScreen,
        togglePanMode,
        save,
    } = options;

    // Track pressed keys
    const pressedKeysRef = useRef<Set<string>>(new Set());
    // Track shortcuts dialog visibility
    const shortcutsDialogVisibleRef = useRef(false);

    // Get store actions
    const toggleGrid = useEditorStore((state) => state.toggleGrid);

    // ========================================================================
    // SHORTCUT MATCHING
    // ========================================================================

    const matchShortcut = useCallback((e: KeyboardEvent): ShortcutDef | null => {
        for (const shortcut of SHORTCUTS) {
            const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() ||
                e.key === shortcut.key;
            const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
            const shiftMatch = !!shortcut.shift === e.shiftKey;
            const altMatch = !!shortcut.alt === e.altKey;

            if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                return shortcut;
            }
        }
        return null;
    }, []);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        pressedKeysRef.current.add(e.key.toLowerCase());

        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        const shortcut = matchShortcut(e);
        if (!shortcut) return;

        e.preventDefault();

        const actionMap: Record<string, () => void> = {
            undo: () => undo?.(),
            redo: () => redo?.(),
            delete: () => deleteSelected?.(),
            copy: () => copySelected?.(),
            paste: () => paste?.(),
            duplicate: () => duplicateSelected?.(),
            selectAll: () => selectAll?.(),
            clearSelection: () => clearSelection?.(),
            zoomIn: () => zoomIn?.(),
            zoomOut: () => zoomOut?.(),
            fitToScreen: () => fitToScreen?.(),
            togglePan: () => togglePanMode?.(),
            toggleGrid: () => toggleGrid(),
            save: () => save?.(),
            showHelp: () => { shortcutsDialogVisibleRef.current = true; },
        };

        actionMap[shortcut.action]?.();
    }, [
        matchShortcut, undo, redo, deleteSelected, copySelected, paste,
        duplicateSelected, selectAll, clearSelection, zoomIn, zoomOut,
        fitToScreen, togglePanMode, toggleGrid, save,
    ]);

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        pressedKeysRef.current.delete(e.key.toLowerCase());
    }, []);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    useEffect(() => {
        // Capture ref value for cleanup
        const pressedKeys = pressedKeysRef.current;

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            // Clear pressed keys on unmount
            pressedKeys.clear();
        };
    }, [handleKeyDown, handleKeyUp]);

    // ========================================================================
    // API
    // ========================================================================

    const getPressedKeys = useCallback(() => {
        return new Set(pressedKeysRef.current);
    }, []);

    const isKeyPressed = useCallback((key: string) => {
        return pressedKeysRef.current.has(key.toLowerCase());
    }, []);

    const showShortcutsDialog = useCallback(() => {
        shortcutsDialogVisibleRef.current = true;
    }, []);

    const hideShortcutsDialog = useCallback(() => {
        shortcutsDialogVisibleRef.current = false;
    }, []);

    return useMemo(() => ({
        getPressedKeys,
        isKeyPressed,
        showShortcutsDialog,
        hideShortcutsDialog,
    }), [getPressedKeys, isKeyPressed, showShortcutsDialog, hideShortcutsDialog]);
}

export default useEditorShortcuts;
