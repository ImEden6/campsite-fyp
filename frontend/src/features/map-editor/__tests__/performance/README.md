# Performance Testing

This directory contains performance tests and benchmarks for the map editor.

## Running Performance Tests

```bash
# Run all performance tests
npm run test:performance

# Run specific performance test file
npm test rendering.performance.test.tsx
```

## Test Files

### `rendering.performance.test.tsx`
Comprehensive performance benchmarks for rendering:
- Initial render performance with varying module counts (10, 50, 100, 200, 500)
- Frame rate during interactions (pan, zoom)
- Memory usage and leak detection
- Viewport culling effectiveness

## Performance Thresholds

The tests use the following performance thresholds:

| Modules | Max Render Time | Min Frame Rate |
|---------|----------------|----------------|
| 10      | 50ms           | 30 FPS         |
| 50      | 100ms          | 20 FPS         |
| 100     | 200ms          | 15 FPS         |
| 200     | 400ms          | 10 FPS         |
| 500     | 800ms          | 5 FPS          |

## Utilities

### `frameRateMonitor.ts`
Monitors and reports frame rates:
- Real-time FPS tracking
- Average, min, max FPS calculation
- Dropped frame detection
- Callback support for live updates

### `performanceBenchmark.ts`
Benchmarking utilities:
- Test module generation
- Rendering performance measurement
- Memory usage tracking
- Benchmark suite execution
- Results formatting

## Usage Example

```typescript
import { measureFrameRate } from '../../utils/frameRateMonitor';
import { createTestMap, benchmarkRendering } from '../../utils/performanceBenchmark';

// Measure frame rate
const stats = await measureFrameRate(2000, (currentStats) => {
  console.log(`Current FPS: ${currentStats.currentFPS}`);
});

// Benchmark rendering
const result = await benchmarkRendering(
  () => renderMap(testMap),
  { warmupIterations: 3, testIterations: 10 }
);
```

## Notes

- Performance tests may take longer to run than unit tests
- Tests use mocked Konva components for faster execution
- For real-world performance testing, use the actual Konva renderer
- Memory measurements require Chrome DevTools Performance API

