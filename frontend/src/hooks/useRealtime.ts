/**
 * useRealtime Hook
 * Connects the WebSocket for the signed-in user and keeps booking and payment data fresh.
 * Used by every authenticated layout (staff and customer). The server decides what each user
 * receives: staff get everything, customers only their own bookings and payments.
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { webSocketService } from '@/services/websocket';
import type { BookingEventPayload, PaymentEventPayload } from '@/services/websocket/types';
import { useBookingEvents } from './useBookingEvents';
import { usePaymentEvents } from './usePaymentEvents';

interface UseRealtimeOptions {
  onBookingConfirmed?: (booking: BookingEventPayload) => void;
  onPaymentFailed?: (payment: PaymentEventPayload) => void;
  onPaymentRefunded?: (payment: PaymentEventPayload) => void;
}

export const useRealtime = (options: UseRealtimeOptions = {}) => {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.tokens?.accessToken);
  const enabled = Boolean(user && accessToken);

  // Connect while signed in; disconnect on logout or when the token changes
  useEffect(() => {
    if (!user || !accessToken) return undefined;

    console.log('[Realtime] Connecting WebSocket');
    webSocketService.connect(accessToken);

    return () => {
      console.log('[Realtime] Disconnecting WebSocket');
      webSocketService.disconnect();
    };
  }, [user, accessToken]);

  useBookingEvents({ enabled, ...(options.onBookingConfirmed && { onBookingConfirmed: options.onBookingConfirmed }) });
  usePaymentEvents({
    enabled,
    ...(options.onPaymentFailed && { onPaymentFailed: options.onPaymentFailed }),
    ...(options.onPaymentRefunded && { onPaymentRefunded: options.onPaymentRefunded }),
  });
};
