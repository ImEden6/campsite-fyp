import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  handler: () => void;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

/**
 * Hook for managing keyboard shortcuts
 * Supports modifier keys (Ctrl, Shift, Alt, Meta/Cmd)
 */
export const useKeyboardShortcuts = ({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey;
        const metaMatches = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler();
          break;
        }
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
};

/**
 * Common keyboard shortcuts for the application
 */
export const KEYBOARD_SHORTCUTS = {
  // Navigation
  DASHBOARD: { key: 'd', ctrlKey: true, description: 'Go to Dashboard' },
  BOOKINGS: { key: 'b', ctrlKey: true, description: 'Go to Bookings' },
  PROFILE: { key: 'p', ctrlKey: true, description: 'Go to Profile' },
  SEARCH: { key: 'k', ctrlKey: true, description: 'Open Search' },
  
  // Actions
  NEW_BOOKING: { key: 'n', ctrlKey: true, description: 'Create New Booking' },
  SAVE: { key: 's', ctrlKey: true, description: 'Save' },
  CANCEL: { key: 'Escape', description: 'Cancel/Close' },
  
  // UI
  TOGGLE_SIDEBAR: { key: 'b', ctrlKey: true, shiftKey: true, description: 'Toggle Sidebar' },
  HELP: { key: '?', shiftKey: true, description: 'Show Keyboard Shortcuts' },
} as const;
