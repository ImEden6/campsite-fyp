import type { AnyModule, CampsiteMap } from '@/types';
import { useMapStore } from '@/stores/mapStore';

export function createMockModule(
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

export function createMockMap(modules: AnyModule[] = []): CampsiteMap {
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

export function resetMapStore() {
    useMapStore.setState({
        currentMap: createMockMap(),
        isDirty: false,
        isLoading: false,
        error: null,
    });
}
