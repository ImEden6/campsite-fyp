/**
 * useBookingEvents Hook
 * Domain-specific hook for booking-related WebSocket events
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketEvent } from './useWebSocketEvent';
import { SOCKET_EVENTS, BookingEventPayload } from '@/services/websocket/types';
import { queryKeys } from '@/config/query-keys';

interface UseBookingEventsOptions {
  onBookingCreated?: (booking: BookingEventPayload) => void;
  onBookingUpdated?: (booking: BookingEventPayload) => void;
  onBookingConfirmed?: (booking: BookingEventPayload) => void;
  onBookingCancelled?: (booking: BookingEventPayload) => void;
  onBookingCheckedIn?: (booking: BookingEventPayload) => void;
  onBookingCheckedOut?: (booking: BookingEventPayload) => void;
  invalidateQueries?: boolean;
  enabled?: boolean;
}

/**
 * Hook for handling booking-related WebSocket events
 * Automatically invalidates React Query cache when enabled
 */
export const useBookingEvents = (options: UseBookingEventsOptions = {}) => {
  const {
    onBookingCreated,
    onBookingUpdated,
    onBookingConfirmed,
    onBookingCancelled,
    onBookingCheckedIn,
    onBookingCheckedOut,
    invalidateQueries = true,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();

  // Booking created
  const handleBookingCreated = useCallback(
    (booking: BookingEventPayload) => {
      console.log('[BookingEvents] Booking created:', booking.id);

      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
      }

      onBookingCreated?.(booking);
    },
    [queryClient, invalidateQueries, onBookingCreated]
  );

  // Booking updated. The event only carries a few fields (id, status, dates), so it must never
  // replace the cached booking: refetch instead.
  const handleBookingUpdated = useCallback(
    (booking: BookingEventPayload) => {
      console.log('[BookingEvents] Booking updated:', booking.id);

      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(booking.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
      }

      onBookingUpdated?.(booking);
    },
    [queryClient, invalidateQueries, onBookingUpdated]
  );

  // Booking confirmed (staff confirmed it, or it was paid in full)
  const handleBookingConfirmed = useCallback(
    (booking: BookingEventPayload) => {
      console.log('[BookingEvents] Booking confirmed:', booking.id);

      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(booking.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
      }

      onBookingConfirmed?.(booking);
    },
    [queryClient, invalidateQueries, onBookingConfirmed]
  );

  // Booking cancelled
  const handleBookingCancelled = useCallback(
    (booking: BookingEventPayload) => {
      console.log('[BookingEvents] Booking cancelled:', booking.id);

      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(booking.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
      }

      onBookingCancelled?.(booking);
    },
    [queryClient, invalidateQueries, onBookingCancelled]
  );

  // Booking checked in
  const handleBookingCheckedIn = useCallback(
    (booking: BookingEventPayload) => {
      console.log('[BookingEvents] Booking checked in:', booking.id);

      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(booking.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard() });
      }

      onBookingCheckedIn?.(booking);
    },
    [queryClient, invalidateQueries, onBookingCheckedIn]
  );

  // Booking checked out
  const handleBookingCheckedOut = useCallback(
    (booking: BookingEventPayload) => {
      console.log('[BookingEvents] Booking checked out:', booking.id);

      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(booking.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard() });
      }

      onBookingCheckedOut?.(booking);
    },
    [queryClient, invalidateQueries, onBookingCheckedOut]
  );

  // Subscribe to events
  const deps = [queryClient, invalidateQueries, onBookingCreated, onBookingUpdated, onBookingConfirmed, onBookingCancelled, onBookingCheckedIn, onBookingCheckedOut];

  useWebSocketEvent(SOCKET_EVENTS.BOOKING_CREATED, handleBookingCreated, { deps, enabled });
  useWebSocketEvent(SOCKET_EVENTS.BOOKING_UPDATED, handleBookingUpdated, { deps, enabled });
  useWebSocketEvent(SOCKET_EVENTS.BOOKING_CONFIRMED, handleBookingConfirmed, { deps, enabled });
  useWebSocketEvent(SOCKET_EVENTS.BOOKING_CANCELLED, handleBookingCancelled, { deps, enabled });
  useWebSocketEvent(SOCKET_EVENTS.BOOKING_CHECKED_IN, handleBookingCheckedIn, { deps, enabled });
  useWebSocketEvent(SOCKET_EVENTS.BOOKING_CHECKED_OUT, handleBookingCheckedOut, { deps, enabled });
};
