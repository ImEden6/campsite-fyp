import { QueryClient } from '@tanstack/react-query';

// Create a custom test query client
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Renamed from cacheTime in React Query v5
      },
      mutations: {
        retry: false,
      },
    },
  });
