// Payment events
//
// Delivered to the staff room and to the person who paid. Like booking events, the payload is
// small and carries no personal details: ids, amount and status only.

import socketService from '@/services/socket.service';
import logger from '@/utils/logger';
import { STAFF_ROOM, userRoom } from './rooms';

export const PAYMENT_EVENTS = {
  processed: 'payment:processed',
  failed: 'payment:failed',
  refunded: 'payment:refunded',
} as const;

export type PaymentEventName = (typeof PAYMENT_EVENTS)[keyof typeof PAYMENT_EVENTS];

export interface PaymentEventPayload {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  status: string;
}

export const toPaymentEventPayload = (payment: PaymentEventPayload): PaymentEventPayload => ({
  id: payment.id,
  bookingId: payment.bookingId,
  userId: payment.userId,
  amount: payment.amount,
  status: payment.status,
});

/** Never throws: a failed notification must not fail the payment that caused it. */
export function publishPaymentEvent(event: PaymentEventName, payment: PaymentEventPayload): void {
  try {
    socketService.emitToRooms([STAFF_ROOM, userRoom(payment.userId)], event, toPaymentEventPayload(payment));
  } catch (error) {
    logger.error('Failed to publish payment event', { event, paymentId: payment?.id, error });
  }
}
