/**
 * Unit tests for KeyboardHandler
 * Tests shortcut detection, modifier keys, and conflict prevention
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  KeyboardHandler,
  createKeyboardHandler,
  parseShortcutString,
  type KeyboardShortcut,
} from '../keyboardHandler';

describe('KeyboardHandler', () => {
  let keyboardHandler: KeyboardHandler;
  let mockHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    keyboardHandler = new KeyboardHandler();
    mockHandler = vi.fn();
  });

  afterEach(() => {
    keyboardHandler.stopListening();
  });

  describe('register', () => {
    it('should register a keyboard shortcut', () => {
      const shortcut: KeyboardShortcut = {
        key: 'c',
        ctrl: true,
        handler: mockHandler,
        description: 'Copy',
      };

      keyboardHandler.register(shortcut);
      const shortcuts = keyboardHandler.getAllShortcuts();

      expect(shortcuts).toHaveLength(1);
      expect(shortcuts[0]).toEqual(shortcut);
    });

    it('should warn about conflicts when registering duplicate shortcuts', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const shortcut1: KeyboardShortcut = {
        key: 'c',
        ctrl: true,
        handler: mockHandler,
      };
      
      const shortcut2: KeyboardShortcut = {
        key: 'c',
        ctrl: true,
        handler: vi.fn(),
      };

      keyboardHandler.register(shortcut1);
      keyboardHandler.register(shortcut2);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('conflict'));
      consoleSpy.mockRestore();
    });

    it('should register shortcuts with different modifier combinations', () => {
      const shortcut1: KeyboardShortcut = { key: 'c', ctrl: true, handler: mockHandler };
      const shortcut2: KeyboardShortcut = { key: 'c', ctrl: true, shift: true, handler: mockHandler };
      const shortcut3: KeyboardShortcut = { key: 'c', handler: mockHandler };

      keyboardHandler.register(shortcut1);
      keyboardHandler.register(shortcut2);
      keyboardHandler.register(shortcut3);

      expect(keyboardHandler.getAllShortcuts()).toHaveLength(3);
    });
  });

  describe('unregister', () => {
    it('should unregister a keyboard shortcut', () => {
      const shortcut: KeyboardShortcut = {
        key: 'c',
        ctrl: true,
        handler: mockHandler,
      };

      keyboardHandler.register(shortcut);
      expect(keyboardHandler.getAllShortcuts()).toHaveLength(1);

      keyboardHandler.unregister({ key: 'c', ctrl: true });
      expect(keyboardHandler.getAllShortcuts()).toHaveLength(0);
    });
  });

  describe('registerMultiple', () => {
    it('should register multiple shortcuts at once', () => {
      const shortcuts: KeyboardShortcut[] = [
        { key: 'c', ctrl: true, handler: mockHandler },
        { key: 'v', ctrl: true, handler: mockHandler },
        { key: 'x', ctrl: true, handler: mockHandler },
      ];

      keyboardHandler.registerMultiple(shortcuts);
      expect(keyboardHandler.getAllShortcuts()).toHaveLength(3);
    });
  });

  describe('clearAll', () => {
    it('should clear all registered shortcuts', () => {
      const shortcuts: KeyboardShortcut[] = [
        { key: 'c', ctrl: true, handler: mockHandler },
        { key: 'v', ctrl: true, handler: mockHandler },
      ];

      keyboardHandler.registerMultiple(shortcuts);
      expect(keyboardHandler.getAllShortcuts()).toHaveLength(2);

      keyboardHandler.clearAll();
      expect(keyboardHandler.getAllShortcuts()).toHaveLength(0);
    });
  });

  describe('enable/disable', () => {
    it('should be enabled by default', () => {
      expect(keyboardHandler.isHandlerEnabled()).toBe(true);
    });

    it('should disable handler', () => {
      keyboardHandler.disable();
      expect(keyboardHandler.isHandlerEnabled()).toBe(false);
    });

    it('should enable handler', () => {
      keyboardHandler.disable();
      keyboardHandler.enable();
      expect(keyboardHandler.isHandlerEnabled()).toBe(true);
    });
  });

  describe('keyboard event handling', () => {
    beforeEach(() => {
      keyboardHandler.startListening();
    });

    it('should trigger handler on matching key combination', () => {
      const shortcut: KeyboardShortcut = {
        key: 'c',
        ctrl: true,
        handler: mockHandler,
      };

      keyboardHandler.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should not trigger handler when disabled', () => {
      const shortcut: KeyboardShortcut = {
        key: 'c',
        ctrl: true,
        handler: mockHandler,
      };

      keyboardHandler.register(shortcut);
      keyboardHandler.disable();

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should prevent default behavior by default', () => {
      const shortcut: KeyboardShortcut = {
        key: 'c',
        ctrl: true,
        handler: mockHandler,
      };

      keyboardHandler.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not prevent default when preventDefault is false', () => {
      const shortcut: KeyboardShortcut = {
        key: 'c',
        ctrl: true,
        handler: mockHandler,
        preventDefault: false,
      };

      keyboardHandler.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      window.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should track pressed keys', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Control',
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(keyboardHandler.isKeyPressed('control')).toBe(true);
    });

    it('should clear pressed keys on keyup', () => {
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'Control',
        bubbles: true,
      });
      window.dispatchEvent(keydownEvent);

      expect(keyboardHandler.isKeyPressed('control')).toBe(true);

      const keyupEvent = new KeyboardEvent('keyup', {
        key: 'Control',
        bubbles: true,
      });
      window.dispatchEvent(keyupEvent);

      expect(keyboardHandler.isKeyPressed('control')).toBe(false);
    });

    it('should not trigger shortcuts when typing in input', () => {
      const shortcut: KeyboardShortcut = {
        key: 'c',
        ctrl: true,
        handler: mockHandler,
      };

      keyboardHandler.register(shortcut);

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', { value: input, enumerable: true });
      
      window.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('should handle Shift modifier', () => {
      const shortcut: KeyboardShortcut = {
        key: 'z',
        ctrl: true,
        shift: true,
        handler: mockHandler,
      };

      keyboardHandler.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle Alt modifier', () => {
      const shortcut: KeyboardShortcut = {
        key: 'f',
        alt: true,
        handler: mockHandler,
      };

      keyboardHandler.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'f',
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle Meta/Cmd modifier as Ctrl', () => {
      // Meta key should trigger shortcuts registered with ctrl
      const shortcut: KeyboardShortcut = {
        key: 'c',
        ctrl: true,
        handler: mockHandler,
      };

      keyboardHandler.register(shortcut);

      // Dispatch event with metaKey (which sets ctrl to true in the combination)
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        metaKey: true,
        ctrlKey: false, // Only metaKey is pressed
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Should trigger because metaKey is treated as ctrl
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('modifier key checking', () => {
    beforeEach(() => {
      keyboardHandler.startListening();
    });

    it('should detect Ctrl key press', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Control',
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(keyboardHandler.isCtrlPressed()).toBe(true);
    });

    it('should detect Shift key press', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Shift',
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(keyboardHandler.isShiftPressed()).toBe(true);
    });

    it('should detect Alt key press', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Alt',
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(keyboardHandler.isAltPressed()).toBe(true);
    });
  });

  describe('getPressedKeys', () => {
    beforeEach(() => {
      keyboardHandler.startListening();
    });

    it('should return set of pressed keys', () => {
      const event1 = new KeyboardEvent('keydown', { key: 'Control', bubbles: true });
      const event2 = new KeyboardEvent('keydown', { key: 'c', bubbles: true });
      
      window.dispatchEvent(event1);
      window.dispatchEvent(event2);

      const pressedKeys = keyboardHandler.getPressedKeys();
      expect(pressedKeys.has('control')).toBe(true);
      expect(pressedKeys.has('c')).toBe(true);
    });

    it('should clear pressed keys on stopListening', () => {
      const event = new KeyboardEvent('keydown', { key: 'Control', bubbles: true });
      window.dispatchEvent(event);

      expect(keyboardHandler.getPressedKeys().size).toBeGreaterThan(0);

      keyboardHandler.stopListening();
      expect(keyboardHandler.getPressedKeys().size).toBe(0);
    });
  });

  describe('getShortcutsByCategory', () => {
    it('should group shortcuts by category', () => {
      const shortcuts: KeyboardShortcut[] = [
        { key: 'c', ctrl: true, handler: mockHandler, description: 'Copy' },
        { key: 'v', ctrl: true, handler: mockHandler, description: 'Paste' },
        { key: 'z', ctrl: true, handler: mockHandler, description: 'Undo' },
        { key: 'y', ctrl: true, handler: mockHandler, description: 'Redo' },
      ];

      keyboardHandler.registerMultiple(shortcuts);
      const categories = keyboardHandler.getShortcutsByCategory();

      expect(categories.has('Editing')).toBe(true);
      expect(categories.has('History')).toBe(true);
      expect(categories.get('Editing')?.length).toBe(2);
      expect(categories.get('History')?.length).toBe(2);
    });

    it('should categorize selection shortcuts', () => {
      const shortcuts: KeyboardShortcut[] = [
        { key: 'v', handler: mockHandler },
        { key: 'a', handler: mockHandler },
        { key: 'escape', handler: mockHandler },
      ];

      keyboardHandler.registerMultiple(shortcuts);
      const categories = keyboardHandler.getShortcutsByCategory();

      expect(categories.has('Selection')).toBe(true);
      expect(categories.get('Selection')?.length).toBe(3);
    });

    it('should categorize tool shortcuts', () => {
      const shortcuts: KeyboardShortcut[] = [
        { key: 'h', handler: mockHandler },
        { key: 'r', handler: mockHandler },
        { key: 's', handler: mockHandler },
      ];

      keyboardHandler.registerMultiple(shortcuts);
      const categories = keyboardHandler.getShortcutsByCategory();

      expect(categories.has('Tools')).toBe(true);
      expect(categories.get('Tools')?.length).toBe(3);
    });

    it('should categorize view shortcuts', () => {
      const shortcuts: KeyboardShortcut[] = [
        { key: 'g', handler: mockHandler },
        { key: '+', handler: mockHandler },
        { key: '-', handler: mockHandler },
      ];

      keyboardHandler.registerMultiple(shortcuts);
      const categories = keyboardHandler.getShortcutsByCategory();

      expect(categories.has('View')).toBe(true);
      expect(categories.get('View')?.length).toBe(3);
    });

    it('should categorize file shortcuts', () => {
      const shortcut: KeyboardShortcut = {
        key: 's',
        ctrl: true,
        handler: mockHandler,
      };

      keyboardHandler.register(shortcut);
      const categories = keyboardHandler.getShortcutsByCategory();

      expect(categories.has('File')).toBe(true);
    });

    it('should categorize help shortcuts', () => {
      const shortcuts: KeyboardShortcut[] = [
        { key: '?', handler: mockHandler },
        { key: 'f1', handler: mockHandler },
      ];

      keyboardHandler.registerMultiple(shortcuts);
      const categories = keyboardHandler.getShortcutsByCategory();

      expect(categories.has('Help')).toBe(true);
      expect(categories.get('Help')?.length).toBe(2);
    });
  });

  describe('formatShortcut', () => {
    it('should format simple key', () => {
      const shortcut: KeyboardShortcut = {
        key: 'c',
        handler: mockHandler,
      };

      const formatted = KeyboardHandler.formatShortcut(shortcut);
      expect(formatted).toBe('C');
    });

    it('should format Ctrl+Key', () => {
      const shortcut: KeyboardShortcut = {
        key: 'c',
        ctrl: true,
        handler: mockHandler,
      };

      const formatted = KeyboardHandler.formatShortcut(shortcut);
      expect(formatted).toBe('Ctrl+C');
    });

    it('should format Ctrl+Shift+Key', () => {
      const shortcut: KeyboardShortcut = {
        key: 'z',
        ctrl: true,
        shift: true,
        handler: mockHandler,
      };

      const formatted = KeyboardHandler.formatShortcut(shortcut);
      expect(formatted).toBe('Ctrl+Shift+Z');
    });

    it('should format special keys', () => {
      const shortcut: KeyboardShortcut = {
        key: 'escape',
        handler: mockHandler,
      };

      const formatted = KeyboardHandler.formatShortcut(shortcut);
      expect(formatted).toBe('Escape');
    });

    it('should format with all modifiers', () => {
      const shortcut: KeyboardShortcut = {
        key: 'a',
        ctrl: true,
        shift: true,
        alt: true,
        meta: true,
        handler: mockHandler,
      };

      const formatted = KeyboardHandler.formatShortcut(shortcut);
      expect(formatted).toBe('Ctrl+Shift+Alt+Cmd+A');
    });
  });

  describe('createKeyboardHandler', () => {
    it('should create a new KeyboardHandler instance', () => {
      const handler = createKeyboardHandler();
      expect(handler).toBeInstanceOf(KeyboardHandler);
    });
  });

  describe('parseShortcutString', () => {
    it('should parse simple key', () => {
      const shortcut = parseShortcutString('c', mockHandler, 'Copy');

      expect(shortcut.key).toBe('c');
      expect(shortcut.ctrl).toBeUndefined();
      expect(shortcut.handler).toBe(mockHandler);
      expect(shortcut.description).toBe('Copy');
    });

    it('should parse Ctrl+Key', () => {
      const shortcut = parseShortcutString('Ctrl+C', mockHandler);

      expect(shortcut.key).toBe('c');
      expect(shortcut.ctrl).toBe(true);
    });

    it('should parse Ctrl+Shift+Key', () => {
      const shortcut = parseShortcutString('Ctrl+Shift+Z', mockHandler);

      expect(shortcut.key).toBe('z');
      expect(shortcut.ctrl).toBe(true);
      expect(shortcut.shift).toBe(true);
    });

    it('should parse Alt+Key', () => {
      const shortcut = parseShortcutString('Alt+F', mockHandler);

      expect(shortcut.key).toBe('f');
      expect(shortcut.alt).toBe(true);
    });

    it('should parse Cmd+Key', () => {
      const shortcut = parseShortcutString('Cmd+C', mockHandler);

      expect(shortcut.key).toBe('c');
      expect(shortcut.meta).toBe(true);
    });

    it('should handle case insensitivity', () => {
      const shortcut = parseShortcutString('CTRL+SHIFT+C', mockHandler);

      expect(shortcut.key).toBe('c');
      expect(shortcut.ctrl).toBe(true);
      expect(shortcut.shift).toBe(true);
    });

    it('should parse Control as Ctrl', () => {
      const shortcut = parseShortcutString('Control+C', mockHandler);

      expect(shortcut.key).toBe('c');
      expect(shortcut.ctrl).toBe(true);
    });
  });
});
