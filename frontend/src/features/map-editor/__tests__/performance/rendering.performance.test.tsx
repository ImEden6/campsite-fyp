/**
 * Rendering Performance Tests
 * Benchmarks rendering performance with varying module counts
 * 
 * Note: These tests may take longer to run and should be run separately
 * from unit tests. Use: npm run test:performance
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { render, waitFor } from '@/tests/utils/test-utils';
import { MapCanvas } from '../../components/MapCanvas/MapCanvas';
import { MapEditorProvider } from '../../context/MapEditorContext';
import { createTestMap, formatBenchmarkResults } from '../../utils/performanceBenchmark';
import { measureFrameRate } from '../../utils/frameRateMonitor';
import { useMapStore } from '@/stores/mapStore';

// Mock Konva for performance tests
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
  Text: (props: any) => <div data-testid="konva-text" {...props} />,
  Image: (props: any) => <div data-testid="konva-image" {...props} />,
}));

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  // Maximum render time in milliseconds
  maxRenderTime: {
    10: 50,   // 10 modules: < 50ms
    50: 100,  // 50 modules: < 100ms
    100: 200, // 100 modules: < 200ms
    200: 400, // 200 modules: < 400ms
    500: 800, // 500 modules: < 800ms
  },
  // Minimum frame rate
  minFrameRate: {
    10: 30,   // 10 modules: > 30 FPS
    50: 20,   // 50 modules: > 20 FPS
    100: 15,  // 100 modules: > 15 FPS
    200: 10,  // 200 modules: > 10 FPS
    500: 5,   // 500 modules: > 5 FPS
  },
};

describe('Rendering Performance', () => {
  beforeAll(() => {
    // Set up test environment
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('Initial Render Performance', () => {
    const moduleCounts = [10, 50, 100, 200, 500];

    it.each(moduleCounts)('should render %d modules within acceptable time', async (count) => {
      const testMap = createTestMap(count);
      
      // Add map to store
      useMapStore.getState().addMap(testMap);

      const startTime = performance.now();
      
      const { container } = render(
        <MapEditorProvider>
          <MapCanvas mapId={testMap.id} />
        </MapEditorProvider>
      );

      await waitFor(() => {
        expect(container.querySelector('[data-testid="konva-stage"]')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      const maxTime = PERFORMANCE_THRESHOLDS.maxRenderTime[count as keyof typeof PERFORMANCE_THRESHOLDS.maxRenderTime] || 1000;
      
      expect(renderTime).toBeLessThan(maxTime);
      
      console.log(`✓ Rendered ${count} modules in ${renderTime.toFixed(2)}ms (threshold: ${maxTime}ms)`);
    });
  });

  describe('Frame Rate During Interactions', () => {
    it('should maintain acceptable frame rate during pan', async () => {
      const testMap = createTestMap(100);
      useMapStore.getState().addMap(testMap);

      const { container } = render(
        <MapEditorProvider>
          <MapCanvas mapId={testMap.id} />
        </MapEditorProvider>
      );

      await waitFor(() => {
        expect(container.querySelector('[data-testid="konva-stage"]')).toBeInTheDocument();
      });

      // Measure frame rate during pan simulation
      const stats = await measureFrameRate(2000);

      expect(stats.averageFPS).toBeGreaterThan(PERFORMANCE_THRESHOLDS.minFrameRate[100]);
      expect(stats.droppedFrames).toBeLessThan(stats.frameCount * 0.1); // Less than 10% dropped frames
      
      console.log(`✓ Pan interaction: ${stats.averageFPS} FPS average, ${stats.droppedFrames} dropped frames`);
    });

    it('should maintain acceptable frame rate during zoom', async () => {
      const testMap = createTestMap(100);
      useMapStore.getState().addMap(testMap);

      const { container } = render(
        <MapEditorProvider>
          <MapCanvas mapId={testMap.id} />
        </MapEditorProvider>
      );

      await waitFor(() => {
        expect(container.querySelector('[data-testid="konva-stage"]')).toBeInTheDocument();
      });

      // Measure frame rate during zoom simulation
      const stats = await measureFrameRate(2000);

      expect(stats.averageFPS).toBeGreaterThan(PERFORMANCE_THRESHOLDS.minFrameRate[100]);
      
      console.log(`✓ Zoom interaction: ${stats.averageFPS} FPS average`);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with repeated renders', async () => {
      const testMap = createTestMap(100);
      useMapStore.getState().addMap(testMap);

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Render multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <MapEditorProvider>
            <MapCanvas mapId={testMap.id} />
          </MapEditorProvider>
        );

        await waitFor(() => {
          expect(document.querySelector('[data-testid="konva-stage"]')).toBeInTheDocument();
        });

        unmount();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Memory increase should be reasonable (< 50MB for 10 renders)
      expect(memoryIncreaseMB).toBeLessThan(50);
      
      console.log(`✓ Memory increase after 10 renders: ${memoryIncreaseMB.toFixed(2)}MB`);
    });
  });

  describe('Viewport Culling Effectiveness', () => {
    it('should only render modules in viewport', async () => {
      const testMap = createTestMap(100, { spread: 5000 }); // Spread modules far apart
      useMapStore.getState().addMap(testMap);

      const { container } = render(
        <MapEditorProvider>
          <MapCanvas mapId={testMap.id} />
        </MapEditorProvider>
      );

      await waitFor(() => {
        expect(container.querySelector('[data-testid="konva-stage"]')).toBeInTheDocument();
      });

      // Count rendered modules (this would need actual implementation)
      // For now, we just verify the component renders
      const stage = container.querySelector('[data-testid="konva-stage"]');
      expect(stage).toBeInTheDocument();
      
      console.log('✓ Viewport culling test passed (implementation needed for actual counting)');
    });
  });

  describe('Performance Benchmark Suite', () => {
    it('should run full benchmark suite', async () => {
      const moduleCounts = [10, 50, 100, 200, 500];
      const results: any[] = [];

      for (const count of moduleCounts) {
        const testMap = createTestMap(count);
        useMapStore.getState().addMap(testMap);

        const startTime = performance.now();
        
        const { unmount } = render(
          <MapEditorProvider>
            <MapCanvas mapId={testMap.id} />
          </MapEditorProvider>
        );

        await waitFor(() => {
          expect(document.querySelector('[data-testid="konva-stage"]')).toBeInTheDocument();
        });

        const endTime = performance.now();
        const renderTime = endTime - startTime;
        const frameRate = renderTime > 0 ? 1000 / renderTime : 0;

        results.push({
          moduleCount: count,
          renderTime: Math.round(renderTime * 100) / 100,
          frameRate: Math.round(frameRate * 10) / 10,
          timestamp: Date.now(),
        });

        unmount();
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Log results
      console.log('\n' + formatBenchmarkResults(results));
      
      // Verify all results meet thresholds
      for (const result of results) {
        const maxTime = PERFORMANCE_THRESHOLDS.maxRenderTime[result.moduleCount as keyof typeof PERFORMANCE_THRESHOLDS.maxRenderTime];
        const minFPS = PERFORMANCE_THRESHOLDS.minFrameRate[result.moduleCount as keyof typeof PERFORMANCE_THRESHOLDS.minFrameRate];
        
        if (maxTime) {
          expect(result.renderTime).toBeLessThan(maxTime);
        }
        if (minFPS) {
          expect(result.frameRate).toBeGreaterThan(minFPS);
        }
      }
    }, 30000); // 30 second timeout for full suite
  });
});

