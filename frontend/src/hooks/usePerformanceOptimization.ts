import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for component performance optimization
 * Provides utilities for debouncing, throttling, and memoization
 */

/**
 * Debounce a function
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
type TimeoutHandle = ReturnType<typeof setTimeout>;

export function useDebounce<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<TimeoutHandle | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * Throttle a function
 * @param callback - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<TimeoutHandle | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRunRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRunRef.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  );
}

/**
 * Hook to detect if component is in viewport
 * @param options - Intersection Observer options
 * @returns Ref and isInView state
 */
export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null);
  const isInViewRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          isInViewRef.current = entry.isIntersecting;
        }
      },
      options
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { ref, isInView: isInViewRef.current };
}

/**
 * Hook to measure component render time
 * @param componentName - Name of component for logging
 */
export function useRenderTime(componentName: string): void {
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;
    
    if (import.meta.env.DEV && renderTime > 16) {
      console.warn(
        `⚠️ ${componentName} render took ${renderTime.toFixed(2)}ms (>16ms threshold)`
      );
    }
  });
}

/**
 * Hook to defer non-critical updates
 * @param callback - Callback to defer
 * @param deps - Dependencies array
 */
export function useDeferredUpdate(
  callback: () => void,
  deps: React.DependencyList
): void {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(callback, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(callback, 100);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, callback]);
}

/**
 * Hook to batch state updates
 * @param initialState - Initial state
 * @returns State and batch update function
 */
export function useBatchedState<T>(initialState: T) {
  const [state, setState] = React.useState<T>(initialState);
  const pendingUpdatesRef = useRef<Partial<T>[]>([]);
  const timeoutRef = useRef<TimeoutHandle | null>(null);

  const batchUpdate = useCallback((update: Partial<T>) => {
    pendingUpdatesRef.current.push(update);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState((prev) => {
        const updates = pendingUpdatesRef.current;
        pendingUpdatesRef.current = [];
        return updates.reduce((acc, update) => ({ ...acc, ...update }), prev) as T;
      });
    }, 16); // Batch updates within a frame
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchUpdate] as const;
}

// React import
import React from 'react';
