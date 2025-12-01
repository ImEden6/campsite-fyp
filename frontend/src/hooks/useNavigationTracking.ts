/**
 * Navigation Tracking Hook
 * Tracks navigation events and adds breadcrumbs to Sentry
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { addBreadcrumb } from '@/config/sentry';

export const useNavigationTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Add breadcrumb for navigation
    addBreadcrumb(
      `Navigation to ${location.pathname}`,
      'navigation',
      'info',
      {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      }
    );
  }, [location]);
};
