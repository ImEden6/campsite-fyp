/**
 * Viewport Store
 * Manages canvas viewport state (zoom, pan, etc.)
 */

import { create } from 'zustand';
import type { ViewportState } from '@/types';

interface ViewportStoreState {
  viewport: ViewportState;
  setViewport: (updates: Partial<ViewportState>) => void;
  resetViewport: () => void;
}

const defaultViewport: ViewportState = {
  zoom: 1,
  position: { x: 0, y: 0 },
  rotation: 0,
};

export const useViewportStore = create<ViewportStoreState>((set) => ({
  viewport: defaultViewport,

  setViewport: (updates) =>
    set((state) => ({
      viewport: { ...state.viewport, ...updates },
    })),

  resetViewport: () => set({ viewport: defaultViewport }),
}));
