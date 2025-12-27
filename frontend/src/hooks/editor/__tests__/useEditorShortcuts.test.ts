/**
 * useEditorShortcuts Hook Unit Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorShortcuts } from '../useEditorShortcuts';

describe('useEditorShortcuts', () => {
    let mockHandlers: {
        undo: ReturnType<typeof vi.fn>;
        redo: ReturnType<typeof vi.fn>;
        deleteSelected: ReturnType<typeof vi.fn>;
        copySelected: ReturnType<typeof vi.fn>;
        paste: ReturnType<typeof vi.fn>;
        selectAll: ReturnType<typeof vi.fn>;
        save: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        mockHandlers = {
            undo: vi.fn(),
            redo: vi.fn(),
            deleteSelected: vi.fn(),
            copySelected: vi.fn(),
            paste: vi.fn(),
            selectAll: vi.fn(),
            save: vi.fn(),
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return key tracking functions', () => {
        const { result } = renderHook(() => useEditorShortcuts(mockHandlers));

        expect(result.current.getPressedKeys).toBeDefined();
        expect(result.current.isKeyPressed).toBeDefined();
        expect(result.current.showShortcutsDialog).toBeDefined();
        expect(result.current.hideShortcutsDialog).toBeDefined();
    });

    it('should track key presses', () => {
        const { result } = renderHook(() => useEditorShortcuts(mockHandlers));

        // Simulate keydown
        act(() => {
            const event = new KeyboardEvent('keydown', { key: 'a' });
            window.dispatchEvent(event);
        });

        expect(result.current.isKeyPressed('a')).toBe(true);
    });

    it('should remove tracked key on keyup', () => {
        const { result } = renderHook(() => useEditorShortcuts(mockHandlers));

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        });

        expect(result.current.isKeyPressed('a')).toBe(true);

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
        });

        expect(result.current.isKeyPressed('a')).toBe(false);
    });

    it('should call undo handler on Ctrl+Z', () => {
        renderHook(() => useEditorShortcuts(mockHandlers));

        act(() => {
            const event = new KeyboardEvent('keydown', {
                key: 'z',
                ctrlKey: true,
                bubbles: true,
            });
            window.dispatchEvent(event);
        });

        expect(mockHandlers.undo).toHaveBeenCalled();
    });

    it('should call redo handler on Ctrl+Y', () => {
        renderHook(() => useEditorShortcuts(mockHandlers));

        act(() => {
            const event = new KeyboardEvent('keydown', {
                key: 'y',
                ctrlKey: true,
                bubbles: true,
            });
            window.dispatchEvent(event);
        });

        expect(mockHandlers.redo).toHaveBeenCalled();
    });

    it('should call delete handler on Delete key', () => {
        renderHook(() => useEditorShortcuts(mockHandlers));

        act(() => {
            const event = new KeyboardEvent('keydown', {
                key: 'Delete',
                bubbles: true,
            });
            window.dispatchEvent(event);
        });

        expect(mockHandlers.deleteSelected).toHaveBeenCalled();
    });

    it('should call copy handler on Ctrl+C', () => {
        renderHook(() => useEditorShortcuts(mockHandlers));

        act(() => {
            const event = new KeyboardEvent('keydown', {
                key: 'c',
                ctrlKey: true,
                bubbles: true,
            });
            window.dispatchEvent(event);
        });

        expect(mockHandlers.copySelected).toHaveBeenCalled();
    });

    it('should call paste handler on Ctrl+V', () => {
        renderHook(() => useEditorShortcuts(mockHandlers));

        act(() => {
            const event = new KeyboardEvent('keydown', {
                key: 'v',
                ctrlKey: true,
                bubbles: true,
            });
            window.dispatchEvent(event);
        });

        expect(mockHandlers.paste).toHaveBeenCalled();
    });

    it('should call selectAll handler on Ctrl+A', () => {
        renderHook(() => useEditorShortcuts(mockHandlers));

        act(() => {
            const event = new KeyboardEvent('keydown', {
                key: 'a',
                ctrlKey: true,
                bubbles: true,
            });
            window.dispatchEvent(event);
        });

        expect(mockHandlers.selectAll).toHaveBeenCalled();
    });

    it('should call save handler on Ctrl+S', () => {
        renderHook(() => useEditorShortcuts(mockHandlers));

        act(() => {
            const event = new KeyboardEvent('keydown', {
                key: 's',
                ctrlKey: true,
                bubbles: true,
            });
            window.dispatchEvent(event);
        });

        expect(mockHandlers.save).toHaveBeenCalled();
    });

    it('should cleanup event listeners on unmount', () => {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

        const { unmount } = renderHook(() => useEditorShortcuts(mockHandlers));

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    });
});
