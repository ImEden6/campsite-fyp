/**
 * Command Unit Tests
 * Comprehensive tests for all commands including validation and edge cases.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AddCommand } from '../AddCommand';
import { DeleteCommand } from '../DeleteCommand';
import { PropertyCommand } from '../PropertyCommand';
import { ReorderCommand } from '../ReorderCommand';
import { BatchCommand } from '../BatchCommand';
import { useMapStore } from '@/stores/mapStore';
import type { AnyModule, CampsiteMap } from '@/types';

// Helper to create mock modules
function createMockModule(
    id: string,
    overrides: Partial<AnyModule> = {}
): AnyModule {
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

// Create a minimal mock map
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

// Reset store before each test
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

describe('AddCommand', () => {
    it('should add module on execute', () => {
        const module = createMockModule('test-1');
        const cmd = new AddCommand([module]);

        cmd.execute();

        expect(useMapStore.getState().getModules()).toHaveLength(1);
        expect(useMapStore.getState().getModule('test-1')).toBeDefined();
    });

    it('should remove module on undo', () => {
        const module = createMockModule('test-1');
        const cmd = new AddCommand([module]);

        cmd.execute();
        cmd.undo();

        expect(useMapStore.getState().getModules()).toHaveLength(0);
    });

    it('should throw if modules is not an array', () => {
        expect(() => new AddCommand({} as unknown as AnyModule[])).toThrow(
            '[AddCommand] modules must be an array'
        );
    });

    it('should skip duplicate IDs with warning', () => {
        const module = createMockModule('test-1');
        const cmd1 = new AddCommand([module]);
        const cmd2 = new AddCommand([module]);

        const warnSpy = vi.spyOn(console, 'warn');

        cmd1.execute();
        cmd2.execute();

        expect(useMapStore.getState().getModules()).toHaveLength(1);
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('already exists')
        );
    });

    it('should handle multiple modules', () => {
        const modules = [
            createMockModule('m1'),
            createMockModule('m2'),
            createMockModule('m3'),
        ];
        const cmd = new AddCommand(modules);

        cmd.execute();

        expect(useMapStore.getState().getModules()).toHaveLength(3);
    });
});

describe('DeleteCommand', () => {
    it('should delete modules on execute', () => {
        const module = createMockModule('test-1');
        useMapStore.getState()._addModule(module);

        const cmd = new DeleteCommand([module]);
        cmd.execute();

        expect(useMapStore.getState().getModules()).toHaveLength(0);
    });

    it('should restore modules on undo', () => {
        const module = createMockModule('test-1');
        useMapStore.getState()._addModule(module);

        const cmd = new DeleteCommand([module]);
        cmd.execute();
        cmd.undo();

        expect(useMapStore.getState().getModules()).toHaveLength(1);
    });

    it('should warn when deleting non-existent modules', () => {
        const module = createMockModule('non-existent');
        const cmd = new DeleteCommand([module]);

        const warnSpy = vi.spyOn(console, 'warn');
        cmd.execute();

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('not found')
        );
    });

    it('should preserve module data for undo (deep copy)', () => {
        const module = createMockModule('test-1');
        useMapStore.getState()._addModule(module);

        const cmd = new DeleteCommand([module]);

        // Mutate original module after creating command
        (module.metadata as { name: string }).name = 'Changed Name';

        cmd.execute();
        cmd.undo();

        // Restored module should have original name
        const restored = useMapStore.getState().getModule('test-1');
        expect((restored?.metadata as { name: string }).name).toBe(
            'Module test-1'
        );
    });
});

describe('PropertyCommand', () => {
    it('should update module properties on execute', () => {
        const module = createMockModule('test-1');
        useMapStore.getState()._addModule(module);

        const cmd = new PropertyCommand([
            {
                moduleId: 'test-1',
                oldProps: { rotation: 0 },
                newProps: { rotation: 45 },
            },
        ]);

        cmd.execute();

        expect(useMapStore.getState().getModule('test-1')?.rotation).toBe(45);
    });

    it('should restore old properties on undo', () => {
        const module = createMockModule('test-1');
        useMapStore.getState()._addModule(module);

        const cmd = new PropertyCommand([
            {
                moduleId: 'test-1',
                oldProps: { rotation: 0 },
                newProps: { rotation: 45 },
            },
        ]);

        cmd.execute();
        cmd.undo();

        expect(useMapStore.getState().getModule('test-1')?.rotation).toBe(0);
    });

    it('should skip non-existent modules with warning', () => {
        const warnSpy = vi.spyOn(console, 'warn');

        const cmd = new PropertyCommand([
            {
                moduleId: 'non-existent',
                oldProps: {},
                newProps: { rotation: 45 },
            },
        ]);

        cmd.execute();

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('not found')
        );
    });
});

describe('ReorderCommand', () => {
    it('should change z-index on execute', () => {
        const module = createMockModule('test-1', { zIndex: 1 });
        useMapStore.getState()._addModule(module);

        const cmd = new ReorderCommand('test-1', 1, 10);
        cmd.execute();

        expect(useMapStore.getState().getModule('test-1')?.zIndex).toBe(10);
    });

    it('should restore z-index on undo', () => {
        const module = createMockModule('test-1', { zIndex: 1 });
        useMapStore.getState()._addModule(module);

        const cmd = new ReorderCommand('test-1', 1, 10);
        cmd.execute();
        cmd.undo();

        expect(useMapStore.getState().getModule('test-1')?.zIndex).toBe(1);
    });

    it('should clamp negative z-index values', () => {
        const warnSpy = vi.spyOn(console, 'warn');
        const cmd = new ReorderCommand('test-1', 5, -10);

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('negative')
        );
        expect((cmd as unknown as { newZIndex: number }).newZIndex).toBe(0);
    });

    it('should throw for non-number z-index', () => {
        expect(
            () =>
                new ReorderCommand('test-1', 'foo' as unknown as number, 10)
        ).toThrow();
    });
});

describe('BatchCommand', () => {
    it('should execute all commands in order', () => {
        const order: string[] = [];
        const cmd1 = {
            execute: () => order.push('1'),
            undo: vi.fn(),
            name: 'cmd1',
        };
        const cmd2 = {
            execute: () => order.push('2'),
            undo: vi.fn(),
            name: 'cmd2',
        };

        const batch = new BatchCommand('batch', [cmd1, cmd2]);
        batch.execute();

        expect(order).toEqual(['1', '2']);
    });

    it('should undo all commands in reverse order', () => {
        const order: string[] = [];
        const cmd1 = {
            execute: vi.fn(),
            undo: () => order.push('1'),
            name: 'cmd1',
        };
        const cmd2 = {
            execute: vi.fn(),
            undo: () => order.push('2'),
            name: 'cmd2',
        };

        const batch = new BatchCommand('batch', [cmd1, cmd2]);
        batch.undo();

        expect(order).toEqual(['2', '1']);
    });

    it('should report length of commands', () => {
        const batch = new BatchCommand('batch', [
            { execute: vi.fn(), undo: vi.fn(), name: 'a' },
            { execute: vi.fn(), undo: vi.fn(), name: 'b' },
        ]);

        expect(batch.length).toBe(2);
    });

    it('should warn when created with empty array', () => {
        const warnSpy = vi.spyOn(console, 'warn');
        new BatchCommand('empty', []);

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('empty command array')
        );
    });
});
