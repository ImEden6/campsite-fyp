import { useQuery } from '@tanstack/react-query';
import { getSites } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';
import type { SiteFilters } from '@/types';


export const usePublicSites = (filters?: SiteFilters) => {
  return useQuery({
    queryKey: queryKeys.sites.list(filters),
    queryFn: () => getSites(filters),
  });
};

