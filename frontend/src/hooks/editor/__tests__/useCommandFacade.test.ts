/**
 * useCommandFacade Hook Unit Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCommandFacade } from '../useCommandFacade';
import { useMapStore } from '@/stores/mapStore';
import type { AnyModule, CampsiteMap } from '@/types';

// Helper to create mock modules
function createMockModule(id: string, overrides: Partial<AnyModule> = {}): AnyModule {
    return {
        id,
        type: 'campsite',
        position: { x: 100, y: 100 },
        size: { width: 120, height: 80 },
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        metadata: {
            name: `Module ${id}`,
            capacity: 4,
            amenities: [],
            pricing: { basePrice: 25, seasonalMultiplier: 1 },
            accessibility: false,
            electricHookup: false,
            waterHookup: false,
            sewerHookup: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    } as AnyModule;
}

function createMockMap(modules: AnyModule[] = []): CampsiteMap {
    return {
        id: 'test-map',
        name: 'Test Map',
        description: 'Test map for unit tests',
        imageUrl: '',
        imageSize: { width: 1000, height: 1000 },
        scale: 1,
        bounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 },
        modules,
        metadata: {
            address: 'Test Address',
            coordinates: { latitude: 0, longitude: 0 },
            timezone: 'UTC',
            capacity: 100,
            amenities: [],
            rules: [],
            emergencyContacts: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

describe('useCommandFacade', () => {
    beforeEach(() => {
        useMapStore.setState({
            currentMap: createMockMap(),
            isDirty: false,
            isLoading: false,
            error: null,
        });
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
