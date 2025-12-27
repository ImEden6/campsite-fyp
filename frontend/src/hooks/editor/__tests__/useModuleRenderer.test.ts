/**
 * useModuleRenderer Hook Unit Tests
 * Simplified tests focusing on store integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '@/stores/mapStore';
import { useEditorStore } from '@/stores/editorStore';
import type { AnyModule, CampsiteMap } from '@/types';

function createMockModule(id: string): AnyModule {
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
    } as AnyModule;
}

function createMockMap(modules: AnyModule[] = []): CampsiteMap {
    return {
        id: 'test-map',
        name: 'Test Map',
        description: '',
        imageUrl: '',
        imageSize: { width: 1000, height: 1000 },
        scale: 1,
        bounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 },
        modules,
        metadata: {
            address: '',
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

describe('useModuleRenderer store integration', () => {
    beforeEach(() => {
        useMapStore.setState({
            currentMap: createMockMap(),
        });
        useEditorStore.setState({
            hiddenModuleIds: new Set<string>(),
            lockedModuleIds: new Set<string>(),
        });
    });

    it('should get modules from map store', () => {
        const modules = [createMockModule('mod-1'), createMockModule('mod-2')];
        useMapStore.setState({
            currentMap: createMockMap(modules),
        });

        const currentModules = useMapStore.getState().getModules();
        expect(currentModules).toHaveLength(2);
    });

    it('should detect hidden modules', () => {
        useEditorStore.setState({
            hiddenModuleIds: new Set(['mod-1']),
        });

        const hiddenIds = useEditorStore.getState().hiddenModuleIds;
        expect(hiddenIds).toContain('mod-1');
        expect(hiddenIds).not.toContain('mod-2');
    });

    it('should detect locked modules', () => {
        useEditorStore.setState({
            lockedModuleIds: new Set(['mod-1']),
        });

        const lockedIds = useEditorStore.getState().lockedModuleIds;
        expect(lockedIds).toContain('mod-1');
        expect(lockedIds).not.toContain('mod-2');
    });
});

describe('Module property hashing', () => {
    const hashModuleProps = (module: AnyModule): string => {
        return JSON.stringify({
            position: module.position,
            size: module.size,
            rotation: module.rotation,
            zIndex: module.zIndex,
        });
    };

    it('should produce same hash for same properties', () => {
        const mod1 = createMockModule('test');
        const mod2 = createMockModule('test');

        expect(hashModuleProps(mod1)).toBe(hashModuleProps(mod2));
    });

    it('should produce different hash for different position', () => {
        const mod1 = createMockModule('test');
        const mod2 = { ...createMockModule('test'), position: { x: 200, y: 200 } };

        expect(hashModuleProps(mod1)).not.toBe(hashModuleProps(mod2));
    });

    it('should produce different hash for different rotation', () => {
        const mod1 = createMockModule('test');
        const mod2 = { ...createMockModule('test'), rotation: 45 };

        expect(hashModuleProps(mod1)).not.toBe(hashModuleProps(mod2));
    });
});
