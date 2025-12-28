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
import { MoveCommand } from '../MoveCommand';
import { TransformCommand } from '../TransformCommand';
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

        // AddCommand throws when ALL modules are duplicates
        expect(() => cmd2.execute()).toThrow('[AddCommand] All modules already exist');

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

describe('MoveCommand', () => {

    it('should move module on execute', () => {
        const module = createMockModule('test-1', {
            position: { x: 0, y: 0 },
        });
        useMapStore.getState()._addModule(module);

        const cmd = new MoveCommand([
            {
                id: 'test-1',
                oldPosition: { x: 0, y: 0 },
                newPosition: { x: 100, y: 100 },
            },
        ]);
        cmd.execute();

        const moved = useMapStore.getState().getModule('test-1');
        expect(moved?.position).toEqual({ x: 100, y: 100 });
    });

    it('should restore position on undo', () => {
        const module = createMockModule('test-1', {
            position: { x: 0, y: 0 },
        });
        useMapStore.getState()._addModule(module);

        const cmd = new MoveCommand([
            {
                id: 'test-1',
                oldPosition: { x: 0, y: 0 },
                newPosition: { x: 100, y: 100 },
            },
        ]);
        cmd.execute();
        cmd.undo();

        const restored = useMapStore.getState().getModule('test-1');
        expect(restored?.position).toEqual({ x: 0, y: 0 });
    });

    it('should warn and skip undo for deleted modules', () => {
        const module = createMockModule('test-1', {
            position: { x: 0, y: 0 },
        });
        useMapStore.getState()._addModule(module);

        const cmd = new MoveCommand([
            {
                id: 'test-1',
                oldPosition: { x: 0, y: 0 },
                newPosition: { x: 100, y: 100 },
            },
        ]);
        cmd.execute();

        // Delete module before undo
        useMapStore.getState()._removeModules(['test-1']);

        const warnSpy = vi.spyOn(console, 'warn');
        cmd.undo(); // Should not throw

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('no longer exists')
        );
    });

    it('should handle multiple modules', () => {
        const m1 = createMockModule('m1', { position: { x: 0, y: 0 } });
        const m2 = createMockModule('m2', { position: { x: 50, y: 50 } });
        useMapStore.getState()._addModule(m1);
        useMapStore.getState()._addModule(m2);

        const cmd = new MoveCommand([
            { id: 'm1', oldPosition: { x: 0, y: 0 }, newPosition: { x: 10, y: 10 } },
            { id: 'm2', oldPosition: { x: 50, y: 50 }, newPosition: { x: 60, y: 60 } },
        ]);
        cmd.execute();

        expect(useMapStore.getState().getModule('m1')?.position).toEqual({ x: 10, y: 10 });
        expect(useMapStore.getState().getModule('m2')?.position).toEqual({ x: 60, y: 60 });
    });
});

describe('TransformCommand', () => {

    it('should transform module on execute', () => {
        const module = createMockModule('test-1', {
            position: { x: 0, y: 0 },
            size: { width: 100, height: 100 },
            rotation: 0,
        });
        useMapStore.getState()._addModule(module);

        const cmd = new TransformCommand({
            id: 'test-1',
            oldPosition: { x: 0, y: 0 },
            newPosition: { x: 50, y: 50 },
            oldSize: { width: 100, height: 100 },
            newSize: { width: 200, height: 200 },
            oldRotation: 0,
            newRotation: 45,
        });
        cmd.execute();

        const transformed = useMapStore.getState().getModule('test-1');
        expect(transformed?.position).toEqual({ x: 50, y: 50 });
        expect(transformed?.size).toEqual({ width: 200, height: 200 });
        expect(transformed?.rotation).toBe(45);
    });

    it('should restore on undo', () => {
        const module = createMockModule('test-1', {
            position: { x: 0, y: 0 },
            size: { width: 100, height: 100 },
            rotation: 0,
        });
        useMapStore.getState()._addModule(module);

        const cmd = new TransformCommand({
            id: 'test-1',
            oldPosition: { x: 0, y: 0 },
            newPosition: { x: 50, y: 50 },
            oldSize: { width: 100, height: 100 },
            newSize: { width: 200, height: 200 },
            oldRotation: 0,
            newRotation: 45,
        });
        cmd.execute();
        cmd.undo();

        const restored = useMapStore.getState().getModule('test-1');
        expect(restored?.position).toEqual({ x: 0, y: 0 });
        expect(restored?.size).toEqual({ width: 100, height: 100 });
        expect(restored?.rotation).toBe(0);
    });

    it('should not undo if execute failed', () => {
        const cmd = new TransformCommand({
            id: 'non-existent',
            oldPosition: { x: 0, y: 0 },
            newPosition: { x: 50, y: 50 },
            oldSize: { width: 100, height: 100 },
            newSize: { width: 200, height: 200 },
            oldRotation: 0,
            newRotation: 45,
        });

        const warnSpy = vi.spyOn(console, 'warn');
        cmd.execute(); // Should warn and not throw

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('not found')
        );

        // Undo should be a no-op since execute failed
        cmd.undo();
    });

    it('should warn if module deleted before undo', () => {
        const module = createMockModule('test-1');
        useMapStore.getState()._addModule(module);

        const cmd = new TransformCommand({
            id: 'test-1',
            oldPosition: { x: 0, y: 0 },
            newPosition: { x: 50, y: 50 },
            oldSize: { width: 100, height: 100 },
            newSize: { width: 200, height: 200 },
            oldRotation: 0,
            newRotation: 45,
        });
        cmd.execute();

        // Delete before undo
        useMapStore.getState()._removeModules(['test-1']);

        const warnSpy = vi.spyOn(console, 'warn');
        cmd.undo();

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('not found during undo')
        );
    });
});
