/**
 * Performance Benchmark Utilities
 * Utilities for benchmarking map editor rendering performance
 */

import type { AnyModule, CampsiteMap } from '@/types';

export interface BenchmarkResult {
  moduleCount: number;
  renderTime: number;
  frameRate: number;
  memoryUsage?: {
    used: number;
    total: number;
  };
  timestamp: number;
}

export interface BenchmarkOptions {
  warmupIterations?: number;
  testIterations?: number;
  measureMemory?: boolean;
}

/**
 * Generate test modules for benchmarking
 */
export function generateTestModules(count: number, options?: {
  spread?: number; // How spread out modules are (default: 1000)
  types?: Array<AnyModule['type']>;
}): AnyModule[] {
  const spread = options?.spread ?? 1000;
  const types: Array<AnyModule['type']> = options?.types ?? [
    'campsite',
    'toilet',
    'storage',
    'building',
    'parking',
    'water_source',
    'electricity',
    'waste_disposal',
    'recreation',
  ];

  const modules: AnyModule[] = [];
  const typeCount = types.length;

  for (let i = 0; i < count; i++) {
    const typeIndex = i % typeCount;
    const type = types[typeIndex];
    if (!type) continue;
    
    const x = (i * 50) % spread;
    const y = Math.floor((i * 50) / spread) * 50;

    // Create minimal metadata based on type
    let metadata: AnyModule['metadata'];
    if (type === 'campsite') {
      metadata = {
        name: `Test Module ${i}`,
        capacity: 4,
        amenities: [],
        pricing: { basePrice: 50, seasonalMultiplier: 1 },
        accessibility: false,
        electricHookup: false,
        waterHookup: false,
        sewerHookup: false,
      };
    } else if (type === 'custom') {
      metadata = {
        name: `Test Module ${i}`,
        description: 'Test module',
        customType: 'test',
        properties: {},
      };
    } else {
      metadata = {
        name: `Test Module ${i}`,
      } as AnyModule['metadata'];
    }

    modules.push({
      id: `test-module-${i}`,
      type,
      position: { x, y },
      size: { width: 50, height: 50 },
      rotation: i % 4 === 0 ? 45 : 0,
      visible: true,
      locked: false,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as AnyModule);
  }

  return modules;
}

/**
 * Create a test map with specified number of modules
 */
export function createTestMap(moduleCount: number, options?: {
  spread?: number;
  types?: Array<AnyModule['type']>;
}): CampsiteMap {
  const modules = generateTestModules(moduleCount, options);

  return {
    id: 'test-map',
    name: `Test Map (${moduleCount} modules)`,
    description: `Performance test map with ${moduleCount} modules`,
    imageUrl: '',
    imageSize: { width: 2000, height: 2000 },
    scale: 10,
    bounds: {
      minX: 0,
      minY: 0,
      maxX: 2000,
      maxY: 2000,
    },
    modules,
    metadata: {
      address: '',
      coordinates: { latitude: 0, longitude: 0 },
      timezone: 'UTC',
      capacity: 0,
      amenities: [],
      rules: [],
      emergencyContacts: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Measure rendering performance
 */
export async function benchmarkRendering(
  renderFn: () => void | Promise<void>,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const {
    warmupIterations = 3,
    testIterations = 10,
    measureMemory = false,
  } = options;

  // Warmup
  for (let i = 0; i < warmupIterations; i++) {
    await renderFn();
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  // Measure memory before
  let memoryBefore: { used: number; total: number } | undefined;
  if (measureMemory && 'memory' in performance) {
    interface PerformanceMemory {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
    }
    const mem = (performance as unknown as { memory?: PerformanceMemory }).memory;
    if (mem) {
      memoryBefore = {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
      };
    }
  }

  // Run benchmark
  const startTime = performance.now();
  
  for (let i = 0; i < testIterations; i++) {
    await renderFn();
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const averageTime = totalTime / testIterations;

  // Measure memory after
  let memoryAfter: { used: number; total: number } | undefined;
  if (measureMemory && 'memory' in performance) {
    interface PerformanceMemory {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
    }
    const mem = (performance as unknown as { memory?: PerformanceMemory }).memory;
    if (mem) {
      memoryAfter = {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
      };
    }
  }

  // Calculate frame rate (assuming 60 FPS target)
  const frameRate = averageTime > 0 ? 1000 / averageTime : 0;

  return {
    moduleCount: 0, // Will be set by caller
    renderTime: Math.round(averageTime * 100) / 100,
    frameRate: Math.round(frameRate * 10) / 10,
    memoryUsage: memoryAfter && memoryBefore ? {
      used: memoryAfter.used - memoryBefore.used,
      total: memoryAfter.total - memoryBefore.total,
    } : undefined,
    timestamp: Date.now(),
  };
}

/**
 * Run performance benchmark suite
 */
export async function runBenchmarkSuite(
  renderFn: (moduleCount: number) => void | Promise<void>,
  moduleCounts: number[] = [10, 50, 100, 200, 500],
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  for (const count of moduleCounts) {
    console.log(`Benchmarking with ${count} modules...`);
    
    const result = await benchmarkRendering(
      () => renderFn(count),
      options
    );
    
    result.moduleCount = count;
    results.push(result);
    
    console.log(`  Render time: ${result.renderTime}ms, FPS: ${result.frameRate}`);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Format benchmark results for display
 */
export function formatBenchmarkResults(results: BenchmarkResult[]): string {
  const lines = [
    'Performance Benchmark Results',
    '='.repeat(50),
    '',
    'Modules | Render Time (ms) | Frame Rate (FPS) | Memory (MB)',
    '-'.repeat(50),
  ];

  for (const result of results) {
    const memory = result.memoryUsage
      ? `${((result.memoryUsage.used / 1024 / 1024) * 100) / 100}`
      : 'N/A';
    
    lines.push(
      `${result.moduleCount.toString().padStart(7)} | ${result.renderTime.toString().padStart(15)} | ${result.frameRate.toString().padStart(16)} | ${memory.padStart(12)}`
    );
  }

  return lines.join('\n');
}

