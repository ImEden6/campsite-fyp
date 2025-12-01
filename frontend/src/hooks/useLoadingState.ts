import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  startLoading: () => void;
  stopLoading: () => void;
  setError: (error: Error | null) => void;
  reset: () => void;
}

/**
 * Hook for managing loading states
 * Useful for async operations, form submissions, etc.
 */
export const useLoadingState = (initialLoading = false): LoadingState => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<Error | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleSetError = useCallback((error: Error | null) => {
    setError(error);
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError: handleSetError,
    reset,
  };
};

/**
 * Hook for managing multiple loading states
 * Useful when you have multiple async operations on the same page
 */
export const useMultipleLoadingStates = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some((loading) => loading);
  }, [loadingStates]);

  const reset = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    reset,
  };
};

/**
 * Hook for wrapping async functions with loading state
 */
export const useAsyncAction = <T extends unknown[], R>(
  asyncFn: (...args: T) => Promise<R>
) => {
  const { isLoading, error, startLoading, stopLoading, setError } = useLoadingState();

  const execute = useCallback(
    async (...args: T): Promise<R | undefined> => {
      try {
        startLoading();
        const result = await asyncFn(...args);
        stopLoading();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        return undefined;
      }
    },
    [asyncFn, startLoading, stopLoading, setError]
  );

  return {
    execute,
    isLoading,
    error,
  };
};
