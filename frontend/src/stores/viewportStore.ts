/**
 * Viewport Store
 * Manages the camera state (zoom, pan) for the map editor canvas.
 * Kept separate from editor store for performance - viewport updates frequently during pan.
 */

import { create } from 'zustand';
import type { Position, Size } from '@/types';

// Constants
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 1.2;
const DEFAULT_ZOOM = 1;

interface ViewportState {
    zoom: number;
    position: Position;
}

interface ViewportActions {
    setZoom: (zoom: number, around?: Position) => void;
    zoomIn: (around?: Position) => void;
    zoomOut: (around?: Position) => void;
    pan: (delta: Position) => void;
    setPosition: (position: Position) => void;
    fitToScreen: (mapSize: Size, containerSize: Size) => void;
    reset: () => void;
}

type ViewportStore = ViewportState & ViewportActions;

export const useViewportStore = create<ViewportStore>((set, get) => ({
    // Initial state
    zoom: DEFAULT_ZOOM,
    position: { x: 0, y: 0 },

    // Actions
    setZoom: (newZoom, around) => {
        const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

        if (around) {
            // Zoom around a specific point (e.g., mouse position)
            const { zoom, position } = get();
            const scale = clampedZoom / zoom;

            set({
                zoom: clampedZoom,
                position: {
                    x: around.x - (around.x - position.x) * scale,
                    y: around.y - (around.y - position.y) * scale,
                },
            });
        } else {
            set({ zoom: clampedZoom });
        }
    },

    zoomIn: (around) => {
        const { zoom } = get();
        get().setZoom(zoom * ZOOM_STEP, around);
    },

    zoomOut: (around) => {
        const { zoom } = get();
        get().setZoom(zoom / ZOOM_STEP, around);
    },

    pan: (delta) => set((state) => ({
        position: {
            x: state.position.x + delta.x,
            y: state.position.y + delta.y,
        },
    })),

    setPosition: (position) => set({ position }),

    fitToScreen: (mapSize, containerSize) => {
        // Calculate zoom to fit the map with 10% padding
        const padding = 0.9;
        const scaleX = (containerSize.width * padding) / mapSize.width;
        const scaleY = (containerSize.height * padding) / mapSize.height;
        const zoom = Math.min(scaleX, scaleY, MAX_ZOOM);
        const clampedZoom = Math.max(MIN_ZOOM, zoom);

        // Center the map
        const position = {
            x: (containerSize.width - mapSize.width * clampedZoom) / 2,
            y: (containerSize.height - mapSize.height * clampedZoom) / 2,
        };

        set({ zoom: clampedZoom, position });
    },

    reset: () => set({ zoom: DEFAULT_ZOOM, position: { x: 0, y: 0 } }),
}));

// Export constants for use in components
export const VIEWPORT_CONSTANTS = {
    MIN_ZOOM,
    MAX_ZOOM,
    ZOOM_STEP,
    DEFAULT_ZOOM,
};
