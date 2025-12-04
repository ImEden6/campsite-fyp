/**
 * Map Editor Keyboard Shortcuts Hook
 * Adapted for event-driven architecture
 */

import { useEffect, useCallback, useState } from 'react';
import { useMapEditor } from './useMapEditor';
import { useEditorService } from './useEditorService';
import { useMapCommands } from './useMapCommands';
import { useViewportService } from './useViewportService';
import { useMapService } from './useMapService';
import type { ToolType } from '../core/services';

interface UseMapEditorShortcutsOptions {
  enabled?: boolean;
  mapId?: string;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  onToggleShortcuts?: () => void;
}

/**
 * Hook for managing map editor keyboard shortcuts
 */
export const useMapEditorShortcuts = ({
  enabled = true,
  mapId,
  hasUnsavedChanges = false,
  isSaving = false,
  onSave,
  onToggleShortcuts,
}: UseMapEditorShortcutsOptions) => {
  const { eventBus } = useMapEditor();
  const editorService = useEditorService();
  const { undo, redo, deleteModules } = useMapCommands();
  const viewportService = useViewportService();
  const mapService = useMapService();
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

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
      const selectedIds = editorService.getSelection();

      // Save: Ctrl/Cmd + S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges && !isSaving && onSave) {
          onSave();
        }
        return;
      }

      // Copy: Ctrl/Cmd + C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedIds.length > 0) {
        e.preventDefault();
        eventBus.emit('clipboard:copy', { moduleIds: selectedIds });
        return;
      }

      // Cut: Ctrl/Cmd + X
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedIds.length > 0) {
        e.preventDefault();
        eventBus.emit('clipboard:cut', { moduleIds: selectedIds });
        return;
      }

      // Paste: Ctrl/Cmd + V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        eventBus.emit('clipboard:paste', {});
        return;
      }

      // Duplicate: Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedIds.length > 0) {
        e.preventDefault();
        eventBus.emit('clipboard:duplicate', { moduleIds: selectedIds });
        return;
      }

      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // Delete: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0 && mapId) {
        e.preventDefault();
        deleteModules(mapId, selectedIds);
        return;
      }

      // Deselect: Escape
      if (e.key === 'Escape') {
        editorService.clearSelection();
        return;
      }

      // Help: ? or F1
      if (e.key === '?' || e.key === 'F1') {
        e.preventDefault();
        if (onToggleShortcuts) {
          onToggleShortcuts();
        } else {
          setShowShortcutsDialog((prev) => !prev);
        }
        return;
      }

      // Tool shortcuts (only when no modifier keys are pressed)
      if (!isModifierPressed) {
        // Selection tool: V
        if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          editorService.setTool('select');
          eventBus.emit('tool:change', { tool: 'select' });
          return;
        }

        // Select all: A
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          if (mapId) {
            const map = mapService.getMap(mapId);
            if (map) {
              editorService.selectModules(map.modules.map((m) => m.id));
            }
          }
          return;
        }

        // Pan tool: H
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          editorService.setTool('move');
          eventBus.emit('tool:change', { tool: 'move' });
          return;
        }

        // Rotate tool: R
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          editorService.setTool('rotate');
          eventBus.emit('tool:change', { tool: 'rotate' });
          return;
        }

        // Scale tool: S
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          editorService.setTool('scale');
          eventBus.emit('tool:change', { tool: 'scale' });
          return;
        }

        // Toggle grid: G
        if (e.key === 'g' || e.key === 'G') {
          e.preventDefault();
          editorService.toggleGrid();
          return;
        }

        // Zoom in: + or =
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          viewportService.zoomIn();
          return;
        }

        // Zoom out: -
        if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          viewportService.zoomOut();
          return;
        }

        // Arrow key navigation for selected modules
        if (selectedIds.length > 0 && mapId) {
          const moveDistance = e.shiftKey ? 10 : 1; // Shift = 10px, normal = 1px
          const gridSize = editorService.getGridSize();
          const snapToGrid = editorService.isSnapToGrid();
          const delta = snapToGrid ? moveDistance * gridSize : moveDistance;

          if (e.key === 'ArrowUp') {
            e.preventDefault();
            eventBus.emit('module:move-arrow', { direction: 'up', distance: delta });
            return;
          }

          if (e.key === 'ArrowDown') {
            e.preventDefault();
            eventBus.emit('module:move-arrow', { direction: 'down', distance: delta });
            return;
          }

          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            eventBus.emit('module:move-arrow', { direction: 'left', distance: delta });
            return;
          }

          if (e.key === 'ArrowRight') {
            e.preventDefault();
            eventBus.emit('module:move-arrow', { direction: 'right', distance: delta });
            return;
          }
        }
      }
    },
    [
      enabled,
      hasUnsavedChanges,
      isSaving,
      onSave,
      onToggleShortcuts,
      mapId,
      editorService,
      eventBus,
      undo,
      redo,
      deleteModules,
      viewportService,
      mapService,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return { showShortcutsDialog };
};

