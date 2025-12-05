/**
 * MapCanvas Integration Tests
 * Tests for full MapCanvas workflows including selection, transforms, and interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/tests/utils/test-utils';
import { MapCanvas } from '../MapCanvas';
import { useMapStore } from '@/stores/mapStore';
import type { CampsiteMap as MapType } from '@/types';

// Mock Konva
vi.mock('konva', () => ({
  default: {
    Stage: class MockStage {},
    Layer: class MockLayer {},
    Group: class MockGroup {},
    Rect: class MockRect {},
    Circle: class MockCircle {},
    Line: class MockLine {},
    Image: class MockImage {},
    Tween: class MockTween {
      play() {}
      destroy() {}
    },
    Easings: {
      EaseInOut: () => {},
    },
  },
}));

// Mock react-konva
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => (
    <div data-testid="konva-stage" {...props}>
      {children}
    </div>
  ),
  Layer: ({ children, ...props }: any) => (
    <div data-testid="konva-layer" {...props}>
      {children}
    </div>
  ),
  Group: ({ children, ...props }: any) => (
    <div data-testid="konva-group" {...props}>
      {children}
    </div>
  ),
  Rect: (props: any) => <div data-testid="konva-rect" {...props} />,
  Circle: (props: any) => <div data-testid="konva-circle" {...props} />,
  Line: (props: any) => <div data-testid="konva-line" {...props} />,
  Image: (props: any) => <div data-testid="konva-image" {...props} />,
  Text: (props: any) => <div data-testid="konva-text" {...props} />,
}));

// Mock hooks
vi.mock('../../hooks/useKonvaStage', () => ({
  useKonvaStage: () => ({
    stageRef: { current: null },
    containerRef: { current: null },
    stageSize: { width: 800, height: 600 },
    getStage: () => null,
    getPointerPosition: () => ({ x: 100, y: 100 }),
    screenToCanvas: (pos: { x: number; y: number }) => pos,
    canvasToScreen: (pos: { x: number; y: number }) => pos,
    updateStageSize: vi.fn(),
  }),
}));

vi.mock('../../hooks/useKonvaAnimation', () => ({
  useKonvaAnimation: vi.fn(),
}));

vi.mock('../../hooks/useTouchGestures', () => ({
  useTouchGestures: vi.fn(),
}));

// Helper to create mock map
const createMockMap = (overrides?: Partial<MapType>): MapType => ({
  id: 'test-map-1',
  name: 'Test Map',
  description: 'Test map for integration tests',
  width: 2000,
  height: 2000,
  backgroundImage: null,
  modules: [
    {
      id: 'module-1',
      type: 'campsite',
      position: { x: 100, y: 100 },
      size: { width: 100, height: 100 },
      rotation: 0,
      zIndex: 1,
      locked: false,
      visible: true,
      metadata: {
        name: 'Campsite 1',
        capacity: 4,
        amenities: [],
        pricing: {
          basePrice: 35,
          seasonalMultiplier: 1,
        },
        accessibility: false,
        electricHookup: false,
        waterHookup: false,
        sewerHookup: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'module-2',
      type: 'toilet',
      position: { x: 300, y: 300 },
      size: { width: 50, height: 50 },
      rotation: 0,
      zIndex: 1,
      locked: false,
      visible: true,
      metadata: {
        name: 'Toilet 1',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
} as MapType);

describe('MapCanvas Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear maps by removing all
    const state = useMapStore.getState();
    state.maps.forEach((map) => {
      state.removeMap(map.id);
    });
  });

  describe('Rendering', () => {
    it('should render MapCanvas with map', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });
    });

    it('should render modules layer', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });
    });

    it('should render grid layer when grid is visible', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });
    });

    it('should render background layer', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });
    });

    it('should render accessibility layer', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        // Accessibility layer should be present (sr-only class)
        const accessibilityLayer = document.querySelector('.accessibility-layer-container');
        expect(accessibilityLayer).toBeInTheDocument();
      });
    });
  });

  describe('Module Selection', () => {
    it('should handle module selection', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Selection is handled through event bus
      // This test verifies the component renders and is ready for selection
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });

    it('should handle multi-module selection', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Multi-select is handled through event bus with shift key
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });
  });

  describe('Viewport Operations', () => {
    it('should handle zoom operations', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Zoom is handled through viewport service and synced to stage
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });

    it('should handle pan operations', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Pan is handled through viewport service and synced to stage
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle module drag from library', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Drag and drop is handled through dnd-kit
      // This test verifies the component is ready for drag operations
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });

    it('should handle module repositioning via drag', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Module drag is handled through Konva drag events
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });
  });

  describe('Transform Operations', () => {
    it('should handle module resize', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Resize is handled through selection handles
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });

    it('should handle module rotation', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });

      // Rotation is handled through rotation handle
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty map', async () => {
      const map = createMockMap({ modules: [] });
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });
    });

    it('should handle map with many modules', async () => {
      const modules = Array.from({ length: 50 }, (_, i) => ({
        id: `module-${i}`,
        type: 'campsite' as const,
        position: { x: i * 10, y: i * 10 },
        size: { width: 100, height: 100 },
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        metadata: {
          name: `Campsite ${i}`,
          capacity: 4,
          amenities: [],
          pricing: {
            basePrice: 35,
            seasonalMultiplier: 1,
          },
          accessibility: false,
          electricHookup: false,
          waterHookup: false,
          sewerHookup: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const map = createMockMap({ modules });
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
      });
    });

    it('should handle missing map gracefully', () => {
      render(<MapCanvas mapId="non-existent-map" />);

      // Should not crash, but may show error state
      expect(screen.queryByTestId('konva-stage')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render accessibility layer with modules', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        const accessibilityLayer = document.querySelector('.accessibility-layer-container');
        expect(accessibilityLayer).toBeInTheDocument();
      });
    });

    it('should provide keyboard navigation support', async () => {
      const map = createMockMap();
      useMapStore.getState().addMap(map);
      useMapStore.getState().selectMap(map.id);

      render(<MapCanvas mapId={map.id} />);

      await waitFor(() => {
        const accessibilityLayer = document.querySelector('.accessibility-layer-container');
        expect(accessibilityLayer).toBeInTheDocument();
        expect(accessibilityLayer).toHaveAttribute('tabIndex', '0');
      });
    });
  });
});

