/**
 * usePerformanceMonitor Hook
 * React hook for monitoring component performance
 */

import { useEffect, useRef } from 'react';
import { performanceMonitor } from '@/utils/performanceUtils';

/**
 * Hook to monitor component render performance
 * @param componentName Name of the component to monitor
 * @param enabled Whether monitoring is enabled (default: development mode only)
 */
export function usePerformanceMonitor(
  componentName: string,
  enabled: boolean = process.env.NODE_ENV === 'development'
): void {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;

    renderCount.current += 1;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    // Log slow renders (> 16ms for 60 FPS)
    if (timeSinceLastRender > 16 && renderCount.current > 1) {
      console.warn(
        `[Performance] ${componentName} render took ${timeSinceLastRender.toFixed(2)}ms (render #${renderCount.current})`
      );
    }
  });

  useEffect(() => {
    if (!enabled) return;

    // Log component mount
    console.log(`[Performance] ${componentName} mounted`);

    return () => {
      // Log component unmount and stats
      console.log(
        `[Performance] ${componentName} unmounted after ${renderCount.current} renders`
      );
    };
  }, [componentName, enabled]);
}

/**
 * Hook to measure operation performance
 * @param operationName Name of the operation to measure
 * @returns Function to call when operation starts
 */
export function useOperationTimer(operationName: string): () => () => void {
  return () => performanceMonitor.start(operationName);
}

/**
 * Hook to log performance stats on unmount
 * @param enabled Whether to log stats (default: development mode only)
 */
export function usePerformanceStats(
  enabled: boolean = process.env.NODE_ENV === 'development'
): void {
  useEffect(() => {
    if (!enabled) return;

    return () => {
      performanceMonitor.logStats();
    };
  }, [enabled]);
}
