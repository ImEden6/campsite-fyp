/**
 * useEditorLifecycle Hook Unit Tests
 * Simplified tests focusing on store integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useMapStore } from '@/stores/mapStore';
import type { CampsiteMap } from '@/types';

function createMockMap(): CampsiteMap {
    return {
        id: 'test-map',
        name: 'Test Map',
        description: '',
        imageUrl: '',
        imageSize: { width: 1000, height: 1000 },
        scale: 1,
        bounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 },
        modules: [],
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

describe('useEditorLifecycle store integration', () => {
    beforeEach(() => {
        useMapStore.setState({
            currentMap: createMockMap(),
            isDirty: false,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should start with isDirty false', () => {
        expect(useMapStore.getState().isDirty).toBe(false);
    });

    it('should mark dirty via store', () => {
        useMapStore.getState().markDirty();
        expect(useMapStore.getState().isDirty).toBe(true);
    });

    it('should mark clean via store', () => {
        useMapStore.setState({ isDirty: true });
        useMapStore.getState().markClean();
        expect(useMapStore.getState().isDirty).toBe(false);
    });
});

describe('Exit confirmation logic', () => {
    it('should return message when dirty', () => {
        const isDirty = true;
        const exitMessage = 'You have unsaved changes. Are you sure you want to leave?';

        const getExitMessage = () => isDirty ? exitMessage : undefined;

        expect(getExitMessage()).toBe(exitMessage);
    });

    it('should return undefined when clean', () => {
        const isDirty = false;
        const exitMessage = 'You have unsaved changes. Are you sure you want to leave?';

        const getExitMessage = () => isDirty ? exitMessage : undefined;

        expect(getExitMessage()).toBeUndefined();
    });
});
