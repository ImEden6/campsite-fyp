/**
 * Performance Utilities
 * Utilities for optimizing performance in the map editor
 */

/**
 * Throttle function - limits how often a function can be called
 * @param func Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (this: unknown, ...args: Parameters<T>): void {
    if (!inThrottle) {
      inThrottle = true;
      func.apply(this, args);
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Debounce function - delays execution until after a period of inactivity
 * @param func Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: unknown, ...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Request animation frame throttle - limits function calls to animation frames
 * @param func Function to throttle
 * @returns RAF-throttled function
 */
export function rafThrottle<T extends (...args: never[]) => unknown>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let latestArgs: Parameters<T> | null = null;

  return function (this: unknown, ...args: Parameters<T>): void {
    latestArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (latestArgs) {
          func.apply(this, latestArgs);
        }
        rafId = null;
        latestArgs = null;
      });
    }
  };
}

/**
 * Memoize function results
 * @param func Function to memoize
 * @param keyGenerator Optional custom key generator
 * @returns Memoized function
 */
export function memoize<T extends (...args: never[]) => unknown>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Performance monitor for tracking operation durations
 */
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Start measuring an operation
   * @param label Label for the operation
   * @returns End function to call when operation completes
   */
  start(label: string): () => void {
    if (!this.enabled) {
      return () => {};
    }

    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.record(label, duration);
    };
  }

  /**
   * Record a measurement
   * @param label Label for the measurement
   * @param duration Duration in milliseconds
   */
  private record(label: string, duration: number): void {
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }

    const measurements = this.measurements.get(label)!;
    measurements.push(duration);

    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift();
    }

    // Log slow operations (> 16ms for 60 FPS)
    if (duration > 16) {
      console.warn(`[Performance] Slow operation: ${label} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get statistics for a label
   * @param label Label to get stats for
   * @returns Statistics object
   */
  getStats(label: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const measurements = this.measurements.get(label);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);

    return {
      count: sorted.length,
      avg: sum / sorted.length,
      min: sorted[0]!,
      max: sorted[sorted.length - 1]!,
      p95: sorted[Math.floor(sorted.length * 0.95)]!,
    };
  }

  /**
   * Log all statistics
   */
  logStats(): void {
    if (!this.enabled) {
      return;
    }

    console.group('[Performance] Statistics');
    for (const [label, _] of this.measurements) {
      const stats = this.getStats(label);
      if (stats) {
        console.log(
          `${label}: avg=${stats.avg.toFixed(2)}ms, p95=${stats.p95.toFixed(2)}ms, min=${stats.min.toFixed(2)}ms, max=${stats.max.toFixed(2)}ms (n=${stats.count})`
        );
      }
    }
    console.groupEnd();
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements.clear();
  }

  /**
   * Enable or disable monitoring
   * @param enabled Whether to enable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Batch updates to reduce re-renders
 * @param updates Array of update functions
 */
export function batchUpdates(updates: Array<() => void>): void {
  // Use requestAnimationFrame to batch updates
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

/**
 * Check if value has changed (shallow comparison)
 * @param prev Previous value
 * @param next Next value
 * @returns True if changed
 */
export function hasChanged<T>(prev: T, next: T): boolean {
  if (prev === next) {
    return false;
  }

  if (typeof prev !== 'object' || typeof next !== 'object' || prev === null || next === null) {
    return true;
  }

  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);

  if (prevKeys.length !== nextKeys.length) {
    return true;
  }

  for (const key of prevKeys) {
    if ((prev as Record<string, unknown>)[key] !== (next as Record<string, unknown>)[key]) {
      return true;
    }
  }

  return false;
}

/**
 * Create a cache key from objects
 * @param objects Objects to create key from
 * @returns Cache key string
 */
export function createCacheKey(...objects: unknown[]): string {
  return objects
    .map(obj => {
      if (typeof obj === 'object' && obj !== null) {
        return JSON.stringify(obj);
      }
      return String(obj);
    })
    .join('|');
}
