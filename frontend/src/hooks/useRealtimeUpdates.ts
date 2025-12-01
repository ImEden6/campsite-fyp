/**
 * useRealtimeUpdates Hook
 * Comprehensive hook for all real-time updates
 * Combines multiple event hooks for convenience
 */

import { useBookingEvents } from './useBookingEvents';
import { useNotificationEvents } from './useNotificationEvents';
import { useWebSocketEvent } from './useWebSocketEvent';
import { SOCKET_EVENTS, PaymentEventPayload, MetricsEventPayload } from '@/services/websocket/types';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/config/query-keys';

interface UseRealtimeUpdatesOptions {
  enableBookingEvents?: boolean;
  enableNotificationEvents?: boolean;
  enablePaymentEvents?: boolean;
  enableMetricsEvents?: boolean;
  onPaymentProcessed?: (payment: PaymentEventPayload) => void;
  onMetricsUpdated?: (metrics: MetricsEventPayload) => void;
}

/**
 * Hook for enabling all real-time updates
 * Provides a single hook to enable multiple event subscriptions
 */
export const useRealtimeUpdates = (options: UseRealtimeUpdatesOptions = {}) => {
  const {
    enableBookingEvents = true,
    enableNotificationEvents = true,
    enablePaymentEvents = true,
    enableMetricsEvents = true,
    onPaymentProcessed,
    onMetricsUpdated,
  } = options;

  const queryClient = useQueryClient();

  // Enable booking events
  useBookingEvents({ enabled: enableBookingEvents });

  // Enable notification events
  useNotificationEvents({ enabled: enableNotificationEvents });

  // Payment events
  const handlePaymentProcessed = useCallback(
    (payment: PaymentEventPayload) => {
      console.log('[RealtimeUpdates] Payment processed:', payment.id);

      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(payment.bookingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });

      onPaymentProcessed?.(payment);
    },
    [queryClient, onPaymentProcessed]
  );

  const handlePaymentFailed = useCallback(
    (payment: PaymentEventPayload) => {
      console.log('[RealtimeUpdates] Payment failed:', payment.id);

      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(payment.bookingId) });

      // Show error toast
      window.dispatchEvent(
        new CustomEvent('notification:toast', {
          detail: {
            title: 'Payment Failed',
            message: 'A payment has failed. Please check the details.',
            type: 'error',
          },
        })
      );
    },
    [queryClient]
  );

  const handlePaymentRefunded = useCallback(
    (payment: PaymentEventPayload) => {
      console.log('[RealtimeUpdates] Payment refunded:', payment.id);

      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(payment.bookingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
    [queryClient]
  );

  useWebSocketEvent(SOCKET_EVENTS.PAYMENT_PROCESSED, handlePaymentProcessed, {
    deps: [queryClient, onPaymentProcessed],
    enabled: enablePaymentEvents,
  });
  useWebSocketEvent(SOCKET_EVENTS.PAYMENT_FAILED, handlePaymentFailed, {
    deps: [queryClient],
    enabled: enablePaymentEvents,
  });
  useWebSocketEvent(SOCKET_EVENTS.PAYMENT_REFUNDED, handlePaymentRefunded, {
    deps: [queryClient],
    enabled: enablePaymentEvents,
  });

  // Metrics events
  const handleMetricsUpdated = useCallback(
    (metrics: MetricsEventPayload) => {
      console.log('[RealtimeUpdates] Metrics updated:', metrics.type);

      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard() });

      onMetricsUpdated?.(metrics);
    },
    [queryClient, onMetricsUpdated]
  );

  const handleDashboardRefresh = useCallback(() => {
    console.log('[RealtimeUpdates] Dashboard refresh requested');

    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
  }, [queryClient]);

  useWebSocketEvent(SOCKET_EVENTS.METRICS_UPDATED, handleMetricsUpdated, {
    deps: [queryClient, onMetricsUpdated],
    enabled: enableMetricsEvents,
  });
  useWebSocketEvent(SOCKET_EVENTS.DASHBOARD_REFRESH, handleDashboardRefresh, {
    deps: [queryClient],
    enabled: enableMetricsEvents,
  });
};
