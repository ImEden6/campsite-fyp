/**
 * Map Editor Keyboard Shortcuts Hook
 * Manages all keyboard shortcuts for the map editor
 */

import { useEffect, useCallback } from 'react';
import type { EditorState } from '@/types';

export interface MapEditorShortcutsHandlers {
  onSave: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onDeselect: () => void;
  onToggleShortcuts: () => void;
  onToolChange: (tool: EditorState['currentTool']) => void;
  onSelectAll: () => void;
  onToggleGrid: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onMoveSelected?: (direction: 'up' | 'down' | 'left' | 'right', distance?: number) => void;
}

interface UseMapEditorShortcutsOptions {
  enabled?: boolean;
  editor: EditorState;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  handlers: MapEditorShortcutsHandlers;
}

/**
 * Hook for managing map editor keyboard shortcuts
 */
export const useMapEditorShortcuts = ({
  enabled = true,
  editor,
  hasUnsavedChanges,
  isSaving,
  handlers,
}: UseMapEditorShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isModifierPressed = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;

      // Save: Ctrl/Cmd + S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges && !isSaving) {
          handlers.onSave();
        }
        return;
      }

      // Copy: Ctrl/Cmd + C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handlers.onCopy();
        return;
      }

      // Cut: Ctrl/Cmd + X
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        handlers.onCut();
        return;
      }

      // Paste: Ctrl/Cmd + V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlers.onPaste();
        return;
      }

      // Duplicate: Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handlers.onDuplicate();
        return;
      }

      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handlers.onUndo();
        return;
      }

      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handlers.onRedo();
        return;
      }

      // Delete: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && editor.selectedModuleIds.length > 0) {
        e.preventDefault();
        handlers.onDelete();
        return;
      }

      // Deselect: Escape
      if (e.key === 'Escape') {
        handlers.onDeselect();
        return;
      }

      // Help: ? or F1
      if (e.key === '?' || e.key === 'F1') {
        e.preventDefault();
        handlers.onToggleShortcuts();
        return;
      }

      // Tool shortcuts (only when no modifier keys are pressed)
      if (!isModifierPressed) {
        // Selection tool: V
        if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          handlers.onToolChange('select');
          return;
        }

        // Select all: A
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          handlers.onSelectAll();
          return;
        }

        // Pan tool: H
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          handlers.onToolChange('move');
          return;
        }

        // Rotate tool: R
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          handlers.onToolChange('rotate');
          return;
        }

        // Scale tool: S
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          handlers.onToolChange('scale');
          return;
        }

        // Toggle grid: G
        if (e.key === 'g' || e.key === 'G') {
          e.preventDefault();
          handlers.onToggleGrid();
          return;
        }

        // Zoom in: + or =
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          handlers.onZoomIn();
          return;
        }

        // Zoom out: -
        if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          handlers.onZoomOut();
          return;
        }

        // Arrow key navigation for selected modules
        if (editor.selectedModuleIds.length > 0 && handlers.onMoveSelected) {
          const moveDistance = e.shiftKey ? 10 : 1; // Shift = 10px, normal = 1px
          
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            handlers.onMoveSelected('up', moveDistance);
            return;
          }
          
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            handlers.onMoveSelected('down', moveDistance);
            return;
          }
          
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            handlers.onMoveSelected('left', moveDistance);
            return;
          }
          
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            handlers.onMoveSelected('right', moveDistance);
            return;
          }
        }
      }
    },
    [enabled, editor.selectedModuleIds.length, hasUnsavedChanges, isSaving, handlers]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
};

