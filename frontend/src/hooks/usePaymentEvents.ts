/**
 * usePaymentEvents Hook
 * Domain-specific hook for payment-related WebSocket events
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketEvent } from './useWebSocketEvent';
import { SOCKET_EVENTS, PaymentEventPayload } from '@/services/websocket/types';
import { queryKeys } from '@/config/query-keys';

interface UsePaymentEventsOptions {
  onPaymentProcessed?: (payment: PaymentEventPayload) => void;
  onPaymentFailed?: (payment: PaymentEventPayload) => void;
  onPaymentRefunded?: (payment: PaymentEventPayload) => void;
  invalidateQueries?: boolean;
  enabled?: boolean;
}

/**
 * Hook for handling payment-related WebSocket events.
 * Payment events carry only ids, amount and status, so they refetch rather than patch the cache.
 */
export const usePaymentEvents = (options: UsePaymentEventsOptions = {}) => {
  const { onPaymentProcessed, onPaymentFailed, onPaymentRefunded, invalidateQueries = true, enabled = true } = options;

  const queryClient = useQueryClient();

  const refetchPaymentData = useCallback(
    (payment: PaymentEventPayload) => {
      if (!invalidateQueries) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      if (payment?.bookingId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(payment.bookingId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
    [queryClient, invalidateQueries]
  );

  const handleProcessed = useCallback(
    (payment: PaymentEventPayload) => {
      refetchPaymentData(payment);
      onPaymentProcessed?.(payment);
    },
    [refetchPaymentData, onPaymentProcessed]
  );

  const handleFailed = useCallback(
    (payment: PaymentEventPayload) => {
      refetchPaymentData(payment);
      onPaymentFailed?.(payment);
    },
    [refetchPaymentData, onPaymentFailed]
  );

  const handleRefunded = useCallback(
    (payment: PaymentEventPayload) => {
      refetchPaymentData(payment);
      onPaymentRefunded?.(payment);
    },
    [refetchPaymentData, onPaymentRefunded]
  );

  const deps = [refetchPaymentData, onPaymentProcessed, onPaymentFailed, onPaymentRefunded];

  useWebSocketEvent(SOCKET_EVENTS.PAYMENT_PROCESSED, handleProcessed, { deps, enabled });
  useWebSocketEvent(SOCKET_EVENTS.PAYMENT_FAILED, handleFailed, { deps, enabled });
  useWebSocketEvent(SOCKET_EVENTS.PAYMENT_REFUNDED, handleRefunded, { deps, enabled });
};
