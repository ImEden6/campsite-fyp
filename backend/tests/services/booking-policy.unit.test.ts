// Cancellation refund policy (pure: no database)

import { describe, it, expect } from 'vitest';
import { computeCancellationRefund, ALREADY_CANCELLED_REFUND } from '@/services/booking-policy';

const NOW = new Date('2030-06-01T12:00:00Z');
const DAY = 86_400_000;
const inDays = (days: number) => new Date(NOW.getTime() + days * DAY);

const refund = (overrides: Partial<Parameters<typeof computeCancellationRefund>[0]> = {}, now = NOW) =>
  computeCancellationRefund({ checkInDate: inDays(30), paidAmount: 200, totalAmount: 200, paymentStatus: 'PAID', ...overrides }, now);

describe('computeCancellationRefund', () => {
  describe('how much comes back', () => {
    it('refunds everything with a week or more to go', () => {
      expect(refund({ checkInDate: inDays(30) })).toMatchObject({ refundPercentage: 100, refundAmount: 200, cancellationFee: 0 });
      expect(refund({ checkInDate: inDays(7) })).toMatchObject({ refundPercentage: 100, refundAmount: 200 }); // exactly 7 days
    });

    it('refunds 90% from a week out down to two days', () => {
      expect(refund({ checkInDate: new Date(inDays(7).getTime() - 1) })).toMatchObject({ refundPercentage: 90, refundAmount: 180, cancellationFee: 20 });
      expect(refund({ checkInDate: inDays(2) })).toMatchObject({ refundPercentage: 90 }); // exactly 2 days
    });

    it('refunds 75% inside two days, and once the stay has begun', () => {
      expect(refund({ checkInDate: new Date(inDays(2).getTime() - 1) })).toMatchObject({ refundPercentage: 75, refundAmount: 150, cancellationFee: 50 });
      expect(refund({ checkInDate: inDays(0) })).toMatchObject({ refundPercentage: 75 });
      expect(refund({ checkInDate: inDays(-3) })).toMatchObject({ refundPercentage: 75 }); // check-in already passed
    });
  });

  describe('what was paid', () => {
    it('refunds a share of what was actually paid, not the total', () => {
      expect(refund({ paidAmount: 50, totalAmount: 200, paymentStatus: 'PARTIAL' })).toMatchObject({ refundAmount: 50, cancellationFee: 0 });
    });

    it('uses the total for a booking marked PAID whose paid amount was never recorded', () => {
      expect(refund({ paidAmount: 0, totalAmount: 120, paymentStatus: 'PAID' })).toMatchObject({ refundAmount: 120 });
    });

    it('owes nothing, with an explanation, when nothing was paid', () => {
      const result = refund({ paidAmount: 0, paymentStatus: 'PENDING' });

      expect(result).toMatchObject({ refundAmount: 0, cancellationFee: 0 });
      expect(result.reason).toMatch(/no payment recorded/i);
    });

    it('never reports a negative refund', () => {
      expect(refund({ paidAmount: -50, paymentStatus: 'PENDING' })).toMatchObject({ refundAmount: 0, cancellationFee: 0 });
    });

    it('rounds to cents, and refund plus fee always equals what was paid', () => {
      const result = refund({ checkInDate: inDays(3), paidAmount: 33.33, totalAmount: 33.33 }); // 90% of 33.33

      expect(result.refundAmount).toBe(30);
      expect(result.refundAmount + result.cancellationFee).toBeCloseTo(33.33, 2);
    });
  });

  it('explains the percentage it applied', () => {
    expect(refund({ checkInDate: inDays(3) }).reason).toContain('90%');
  });

  it('reports no refund for a booking that is already cancelled', () => {
    expect(ALREADY_CANCELLED_REFUND).toEqual({ refundAmount: 0, refundPercentage: 0, cancellationFee: 0, reason: 'Booking is already cancelled.' });
  });

  it('uses the current time when none is given', () => {
    expect(computeCancellationRefund({ checkInDate: new Date(Date.now() + 30 * DAY), paidAmount: 10, totalAmount: 10 }).refundPercentage).toBe(100);
  });
});
