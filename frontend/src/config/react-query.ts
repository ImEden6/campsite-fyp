/**
 * React Query Configuration
 * Centralized configuration for React Query with caching strategies
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import {
  QUERY_STALE_TIME,
  QUERY_CACHE_TIME,
  QUERY_RETRY_ATTEMPTS,
} from './constants';

/**
 * Query Cache Configuration
 * Handles global query cache events
 */
const queryCache = new QueryCache({
  onError: (error, query) => {
    // Log query errors for monitoring
    console.error('Query error:', error, 'Query key:', query.queryKey);
    
    // Could integrate with error tracking service (e.g., Sentry) here
    // Sentry.captureException(error, { tags: { queryKey: query.queryKey } });
  },
  onSuccess: (_data, query) => {
    // Optional: Log successful queries for debugging
    if (import.meta.env.DEV) {
      console.log('Query success:', query.queryKey);
    }
  },
});

/**
 * Mutation Cache Configuration
 * Handles global mutation cache events
 */
const mutationCache = new MutationCache({
  onError: (error, variables, _context, _mutation) => {
    // Log mutation errors for monitoring
    console.error('Mutation error:', error, 'Variables:', variables);
    
    // Could integrate with error tracking service here
    // Sentry.captureException(error, { tags: { mutationKey: _mutation.options.mutationKey } });
  },
  onSuccess: (_data, _variables, _context, _mutation) => {
    // Optional: Log successful mutations for debugging
    if (import.meta.env.DEV) {
      console.log('Mutation success:', _mutation.options.mutationKey);
    }
  },
});

/**
 * Query Client Instance
 * Configured with caching strategies and default options
 */
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Caching Strategy
      staleTime: QUERY_STALE_TIME, // 5 minutes - data is fresh for this duration
      gcTime: QUERY_CACHE_TIME, // 10 minutes - unused data stays in cache (renamed from cacheTime in v5)
      
      // Retry Strategy
      retry: QUERY_RETRY_ATTEMPTS, // Retry failed requests 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      
      // Refetch Strategy
      refetchOnWindowFocus: false, // Don't refetch on window focus (can be noisy)
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // Refetch when component mounts
      
      // Error Handling
      throwOnError: false, // Don't throw errors to error boundary by default (renamed from useErrorBoundary in v5)
    },
    mutations: {
      // Retry Strategy for Mutations
      retry: 1, // Only retry once for mutations (they may have side effects)
      retryDelay: 1000, // Wait 1 second before retrying
      
      // Error Handling
      throwOnError: false, // Don't throw errors to error boundary (renamed from useErrorBoundary in v5)
    },
  },
});

/**
 * Query Client Configuration for Testing
 * Separate configuration for test environment
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
        gcTime: 0, // Don't cache in tests (renamed from cacheTime in v5)
        staleTime: 0, // Always stale in tests
      },
      mutations: {
        retry: false, // Don't retry in tests
      },
    },
  });
};

/**
 * Invalidate all queries
 * Useful for logout or major state changes
 */
export const invalidateAllQueries = () => {
  return queryClient.invalidateQueries();
};

/**
 * Clear all query cache
 * Useful for logout
 */
export const clearQueryCache = () => {
  queryClient.clear();
};

/**
 * Prefetch query helper
 * Useful for optimistic data loading
 */
export const prefetchQuery = async <TData = unknown>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options?: { staleTime?: number }
) => {
  await queryClient.prefetchQuery({ queryKey, queryFn, ...options });
};

/**
 * Set query data helper
 * Useful for optimistic updates
 */
export const setQueryData = <TData = unknown>(
  queryKey: unknown[],
  data: TData | ((oldData: TData | undefined) => TData)
) => {
  queryClient.setQueryData(queryKey, data);
};

/**
 * Get query data helper
 * Useful for reading cached data
 */
export const getQueryData = <TData = unknown>(queryKey: unknown[]): TData | undefined => {
  return queryClient.getQueryData<TData>(queryKey);
};
