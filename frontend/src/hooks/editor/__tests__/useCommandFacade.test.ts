/**
 * useCommandFacade Hook Unit Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCommandFacade } from '../useCommandFacade';
import { useMapStore } from '@/stores/mapStore';
import { createMockModule, createMockMap, resetMapStore } from '@/tests/factories/map';

describe('useCommandFacade', () => {
    beforeEach(() => {
        resetMapStore();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should add a module via addModule', () => {
        const { result } = renderHook(() => useCommandFacade());
        const module = createMockModule('new-module');

        act(() => {
            result.current.addModule(module);
        });

        const modules = useMapStore.getState().getModules();
        expect(modules).toHaveLength(1);
        expect(modules[0]!.id).toBe('new-module');
    });

    it('should delete modules via deleteModules', () => {
        const module = createMockModule('to-delete');
        useMapStore.setState({
            currentMap: createMockMap([module]),
        });

        const { result } = renderHook(() => useCommandFacade());

        act(() => {
            result.current.deleteModules(['to-delete']);
        });

        const modules = useMapStore.getState().getModules();
        expect(modules).toHaveLength(0);
    });

    it('should provide undo functionality', () => {
        const { result } = renderHook(() => useCommandFacade());
        const module = createMockModule('undo-test');

        act(() => {
            result.current.addModule(module);
        });

        expect(useMapStore.getState().getModules()).toHaveLength(1);

        act(() => {
            result.current.undo();
        });

        expect(useMapStore.getState().getModules()).toHaveLength(0);
    });

    it('should provide redo functionality', () => {
        const { result } = renderHook(() => useCommandFacade());
        const module = createMockModule('redo-test');

        act(() => {
            result.current.addModule(module);
        });

        act(() => {
            result.current.undo();
        });

        expect(useMapStore.getState().getModules()).toHaveLength(0);

        act(() => {
            result.current.redo();
        });

        expect(useMapStore.getState().getModules()).toHaveLength(1);
    });

    it('should track canUndo state', () => {
        const { result } = renderHook(() => useCommandFacade());

        expect(result.current.canUndo).toBe(false);

        act(() => {
            result.current.addModule(createMockModule('can-undo-test'));
        });

        expect(result.current.canUndo).toBe(true);
    });

    it('should track canRedo state', () => {
        const { result } = renderHook(() => useCommandFacade());
        const module = createMockModule('can-redo-test');

        act(() => {
            result.current.addModule(module);
        });

        expect(result.current.canRedo).toBe(false);

        act(() => {
            result.current.undo();
        });

        expect(result.current.canRedo).toBe(true);
    });
});
