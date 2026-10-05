// Booking events
//
// One place that decides who hears about a booking change and what they are told.
//   - the staff room gets every booking event
//   - the booking's owner gets events about their own booking
// The payload is deliberately small: ids, number, status and dates. No names, emails or
// phone numbers - clients that need more fetch it over REST, where permissions are enforced.

import socketService from '@/services/socket.service';
import logger from '@/utils/logger';
import { STAFF_ROOM, userRoom } from './rooms';

export const BOOKING_EVENTS = {
  created: 'booking:created',
  updated: 'booking:updated',
  confirmed: 'booking:confirmed',
  cancelled: 'booking:cancelled',
  checkedIn: 'booking:checked_in',
  checkedOut: 'booking:checked_out',
} as const;

export type BookingEventName = (typeof BOOKING_EVENTS)[keyof typeof BOOKING_EVENTS];

export interface BookingEventPayload {
  id: string;
  userId: string;
  siteId: string;
  status: string;
  checkInDate: Date;
  checkOutDate: Date;
  bookingNumber: string;
}

export const toBookingEventPayload = (booking: BookingEventPayload): BookingEventPayload => ({
  id: booking.id,
  userId: booking.userId,
  siteId: booking.siteId,
  status: booking.status,
  checkInDate: booking.checkInDate,
  checkOutDate: booking.checkOutDate,
  bookingNumber: booking.bookingNumber,
});

/**
 * Tell the right clients that a booking changed.
 * Never throws: a failed notification must not fail the request that caused it.
 */
export function publishBookingEvent(event: BookingEventName, booking: BookingEventPayload): void {
  try {
    socketService.emitToRooms([STAFF_ROOM, userRoom(booking.userId)], event, toBookingEventPayload(booking));
  } catch (error) {
    logger.error('Failed to publish booking event', { event, bookingId: booking?.id, error });
  }
}
