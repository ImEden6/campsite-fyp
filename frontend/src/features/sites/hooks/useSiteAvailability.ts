import { useQuery } from '@tanstack/react-query';
import { checkSiteAvailability } from '@/services/api/sites';

export const useSiteAvailability = (
  siteId: string,
  startDate: string,
  endDate: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['site-availability', siteId, startDate, endDate],
    queryFn: () => checkSiteAvailability(siteId, startDate, endDate),
    enabled: enabled && !!siteId && !!startDate && !!endDate,
  });
};

