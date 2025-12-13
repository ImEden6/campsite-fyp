import { useQuery } from '@tanstack/react-query';
import { getSites } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';
import type { SiteFilters } from '@/services/api/sites';
import { mockSites } from '@/services/api/mock-sites';

export const usePublicSites = (filters?: SiteFilters) => {
  return useQuery({
    queryKey: queryKeys.sites.list(filters),
    queryFn: async () => {
      try {
        const apiSites = await getSites(filters);
        return apiSites.length > 0 ? apiSites : mockSites;
      } catch {
        return mockSites;
      }
    },
  });
};

