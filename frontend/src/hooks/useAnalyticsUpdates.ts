/**
 * useAnalyticsUpdates Hook
 * Manages real-time analytics updates via WebSocket
 */

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketSubscription } from './useWebSocketSubscription';
import { queryKeys } from '@/config/query-keys';
// DashboardMetrics type is available but not used directly in this file

interface AnalyticsUpdateEvent {
  type: 'metrics' | 'revenue' | 'occupancy' | 'booking';
  data: unknown;
  timestamp: string;
}

interface UseAnalyticsUpdatesOptions {
  enabled?: boolean;
  onUpdate?: (event: AnalyticsUpdateEvent) => void;
}

/**
 * Hook for subscribing to real-time analytics updates
 * Automatically invalidates relevant queries when updates are received
 */
export const useAnalyticsUpdates = (options: UseAnalyticsUpdatesOptions = {}) => {
  const { enabled = true, onUpdate } = options;
  const queryClient = useQueryClient();

  // Subscribe to analytics updates
  const { data: updateEvent, lastUpdate } = useWebSocketSubscription<AnalyticsUpdateEvent>({
    event: 'analytics:update',
    enabled,
  });

  // Subscribe to booking events (affects analytics)
  const { data: bookingEvent } = useWebSocketSubscription({
    event: 'booking:created',
    enabled,
  });

  const { data: bookingUpdatedEvent } = useWebSocketSubscription({
    event: 'booking:updated',
    enabled,
  });

  const { data: bookingCancelledEvent } = useWebSocketSubscription({
    event: 'booking:cancelled',
    enabled,
  });

  // Subscribe to payment events (affects revenue)
  const { data: paymentEvent } = useWebSocketSubscription({
    event: 'payment:processed',
    enabled,
  });

  // Handle analytics updates
  useEffect(() => {
    if (!updateEvent) return;

    // Invalidate relevant queries based on update type
    switch (updateEvent.type) {
      case 'metrics':
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard() });
        break;
      case 'revenue':
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
        break;
      case 'occupancy':
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
        break;
      case 'booking':
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard() });
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
        break;
    }

    // Call optional callback
    if (onUpdate) {
      onUpdate(updateEvent);
    }
  }, [updateEvent, queryClient, onUpdate]);

  // Handle booking events
  useEffect(() => {
    if (bookingEvent || bookingUpdatedEvent || bookingCancelledEvent) {
      // Invalidate dashboard and occupancy metrics
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    }
  }, [bookingEvent, bookingUpdatedEvent, bookingCancelledEvent, queryClient]);

  // Handle payment events
  useEffect(() => {
    if (paymentEvent) {
      // Invalidate dashboard and revenue metrics
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    }
  }, [paymentEvent, queryClient]);

  return {
    lastUpdate,
    isReceivingUpdates: enabled,
  };
};

/**
 * Hook for manual refresh with visual feedback
 */
export const useAnalyticsRefresh = () => {
  const queryClient = useQueryClient();

  const refreshAll = useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all }),
    ]);
  }, [queryClient]);

  const refreshMetrics = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard() });
  }, [queryClient]);

  const refreshRevenue = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
  }, [queryClient]);

  const refreshOccupancy = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
  }, [queryClient]);

  const refreshCustomers = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.analytics.customers() });
  }, [queryClient]);

  return {
    refreshAll,
    refreshMetrics,
    refreshRevenue,
    refreshOccupancy,
    refreshCustomers,
  };
};
