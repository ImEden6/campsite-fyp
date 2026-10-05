/**
 * useSelectionManager: selecting several modules at once
 *
 * Restoring a multi-object selection (after undo, or select-all) used to look for a global
 * `window.fabric` that nothing ever defined, so it silently selected nothing. It now builds a
 * real Fabric ActiveSelection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { ActiveSelectionMock } = vi.hoisted(() => ({
    ActiveSelectionMock: vi.fn(function (this: { objects: unknown[]; options: unknown }, objects: unknown[], options: unknown) {
        this.objects = objects;
        this.options = options;
    }),
}));

vi.mock('@/utils/fabricRuntime', () => ({ fabric: { ActiveSelection: ActiveSelectionMock } }));

import { useSelectionManager } from '../useSelectionManager';
import { useEditorStore } from '@/stores/editorStore';
import type { FabricCanvas, FabricObject } from '@/types/fabricTypes';

const moduleObject = (id: string): FabricObject => ({ type: 'group', data: { moduleId: id, moduleType: 'campsite' } }) as unknown as FabricObject;

const makeCanvas = (objects: FabricObject[]) => {
    const canvas = {
        getObjects: vi.fn(() => objects),
        getActiveObjects: vi.fn(() => []),
        discardActiveObject: vi.fn(),
        setActiveObject: vi.fn(),
        requestRenderAll: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
    };
    return canvas as typeof canvas & FabricCanvas;
};

describe('useSelectionManager.restoreSelection', () => {
    const a = moduleObject('a');
    const b = moduleObject('b');
    const c = moduleObject('c');

    beforeEach(() => {
        vi.clearAllMocks();
        useEditorStore.setState({ selectedIds: [] });
    });

    it('selects several modules together as one Fabric selection', () => {
        const canvas = makeCanvas([a, b, c]);
        const { result } = renderHook(() => useSelectionManager(canvas));

        act(() => result.current.restoreSelection(['a', 'c']));

        expect(ActiveSelectionMock).toHaveBeenCalledTimes(1);
        expect(ActiveSelectionMock).toHaveBeenCalledWith([a, c], { canvas });
        const selection = ActiveSelectionMock.mock.instances[0];
        expect(canvas.setActiveObject).toHaveBeenCalledWith(selection);
        expect(useEditorStore.getState().selectedIds).toEqual(['a', 'c']);
    });

    it('selects a single module directly, with no group selection', () => {
        const canvas = makeCanvas([a, b]);
        const { result } = renderHook(() => useSelectionManager(canvas));

        act(() => result.current.restoreSelection(['b']));

        expect(ActiveSelectionMock).not.toHaveBeenCalled();
        expect(canvas.setActiveObject).toHaveBeenCalledWith(b);
    });

    it('clears the previous selection first and redraws', () => {
        const canvas = makeCanvas([a, b]);
        const { result } = renderHook(() => useSelectionManager(canvas));

        act(() => result.current.restoreSelection(['a', 'b']));

        expect(canvas.discardActiveObject).toHaveBeenCalled();
        expect(canvas.requestRenderAll).toHaveBeenCalled();
    });

    it('selects nothing for ids that are no longer on the canvas', () => {
        const canvas = makeCanvas([a]);
        const { result } = renderHook(() => useSelectionManager(canvas));

        act(() => result.current.restoreSelection(['gone-1', 'gone-2']));

        expect(ActiveSelectionMock).not.toHaveBeenCalled();
        expect(canvas.setActiveObject).not.toHaveBeenCalled();
    });

    it('does nothing without a canvas or without ids', () => {
        const canvas = makeCanvas([a, b]);
        const withoutCanvas = renderHook(() => useSelectionManager(null));
        const withoutIds = renderHook(() => useSelectionManager(canvas));

        act(() => withoutCanvas.result.current.restoreSelection(['a', 'b']));
        act(() => withoutIds.result.current.restoreSelection([]));

        expect(canvas.setActiveObject).not.toHaveBeenCalled();
        expect(ActiveSelectionMock).not.toHaveBeenCalled();
    });
});
