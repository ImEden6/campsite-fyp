// Booking cancellation policy (pure: no database, easy to test)

export interface CancellationRefund {
  refundAmount: number;
  refundPercentage: number;
  cancellationFee: number;
  reason: string;
}

export interface RefundableBooking {
  checkInDate: Date;
  paidAmount: number;
  totalAmount: number;
  paymentStatus?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** What a cancelled booking would owe back, shown before and after cancelling. */
export const ALREADY_CANCELLED_REFUND: CancellationRefund = {
  refundAmount: 0,
  refundPercentage: 0,
  cancellationFee: 0,
  reason: 'Booking is already cancelled.',
};

/**
 * Refund owed if the booking is cancelled now.
 *
 *   7 or more days before check-in : 100% back
 *   2 to 7 days before             :  90% back
 *   under 2 days (or already begun):  75% back
 */
export function computeCancellationRefund(booking: RefundableBooking, now: Date = new Date()): CancellationRefund {
  const daysUntilCheckIn = Math.max(booking.checkInDate.getTime() - now.getTime(), 0) / DAY_MS;
  const refundPercentage = daysUntilCheckIn >= 7 ? 100 : daysUntilCheckIn >= 2 ? 90 : 75;

  // Some legacy rows have paymentStatus=PAID while paidAmount stayed at 0. Use the total as the
  // refundable base for those, rather than telling the customer their refund is nothing.
  const normalizedPaid = booking.paidAmount > 0 ? booking.paidAmount : booking.paymentStatus === 'PAID' ? booking.totalAmount : 0;

  const paidAmount = Math.max(normalizedPaid, 0);
  const refundAmount = Number(((paidAmount * refundPercentage) / 100).toFixed(2));
  const cancellationFee = Number((paidAmount - refundAmount).toFixed(2));

  return {
    refundAmount,
    refundPercentage,
    cancellationFee,
    reason:
      paidAmount <= 0
        ? 'No payment recorded yet. Cancelling now will not incur a refund or fee.'
        : `Cancellation policy applies ${refundPercentage}% refund based on check-in date proximity.`,
  };
}
