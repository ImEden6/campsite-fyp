// confirmPayment against a real database (only Stripe is mocked)

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

const { stripeMock } = vi.hoisted(() => ({
  stripeMock: { paymentIntents: { create: vi.fn(), retrieve: vi.fn() }, refunds: { create: vi.fn() }, webhooks: { constructEvent: vi.fn() } },
}));
vi.mock('stripe', () => ({ default: vi.fn(() => stripeMock) }));

import paymentService from '@/services/payment.service';
import prisma from '@/database';

describe('confirmPayment (real database)', () => {
  let userId: string;
  let siteId: string;
  const bookingIds: string[] = [];

  const newBooking = async (status: 'PENDING' | 'CANCELLED' = 'PENDING') => {
    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `BK-PAY-${Date.now()}-${Math.random()}`,
        userId,
        siteId,
        // Distinct far-future stays so the overlap constraint never interferes
        checkInDate: new Date(Date.UTC(2032, 0, 1 + bookingIds.length * 3)),
        checkOutDate: new Date(Date.UTC(2032, 0, 3 + bookingIds.length * 3)),
        adultGuests: 1,
        childGuests: 0,
        totalAmount: 100,
        status,
      },
    });
    bookingIds.push(booking.id);
    return booking;
  };

  const newPayment = (bookingId: string, amount: number, intentId: string) =>
    prisma.payment.create({
      data: { bookingId, userId, amount, method: 'CREDIT_CARD', status: 'PENDING', stripePaymentId: intentId },
    });

  const stripeSucceeds = (intentId: string, amount: number) =>
    stripeMock.paymentIntents.retrieve.mockImplementation(async (id: string) =>
      id === intentId ? { id, status: 'succeeded', amount_received: Math.round(amount * 100) } : { id, status: 'requires_payment_method' }
    );

  beforeAll(async () => {
    userId = (
      await prisma.user.create({
        data: { email: `pay-${Date.now()}-${Math.random()}@example.com`, firstName: 'Pay', lastName: 'Tester', password: 'x', role: 'CUSTOMER' },
      })
    ).id;
    siteId = (
      await prisma.site.create({
        data: {
          name: `Pay site ${Date.now()}`, type: 'TENT', status: 'AVAILABLE', capacity: 4, basePrice: 50, maxVehicles: 1,
          maxTents: 1, sizeLength: 1, sizeWidth: 1, sizeUnit: 'feet', latitude: 1, longitude: 1, mapPositionX: 1, mapPositionY: 1,
        },
      })
    ).id;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { userId } });
    await prisma.booking.deleteMany({ where: { userId } });
    await prisma.site.delete({ where: { id: siteId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it('confirms a PENDING booking once it is paid in full', async () => {
    const booking = await newBooking();
    await newPayment(booking.id, 100, 'pi_full');
    stripeSucceeds('pi_full', 100);

    await paymentService.confirmPayment('pi_full');

    expect(await prisma.booking.findUnique({ where: { id: booking.id } })).toMatchObject({
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paidAmount: 100,
    });
  });

  it('stays PENDING after a partial payment, then confirms when the rest arrives', async () => {
    const booking = await newBooking();
    await newPayment(booking.id, 40, 'pi_part1');
    await newPayment(booking.id, 60, 'pi_part2');

    stripeSucceeds('pi_part1', 40);
    await paymentService.confirmPayment('pi_part1');
    expect(await prisma.booking.findUnique({ where: { id: booking.id } })).toMatchObject({
      status: 'PENDING',
      paymentStatus: 'PARTIAL',
      paidAmount: 40,
    });

    stripeSucceeds('pi_part2', 60);
    await paymentService.confirmPayment('pi_part2');
    expect(await prisma.booking.findUnique({ where: { id: booking.id } })).toMatchObject({
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paidAmount: 100,
    });
  });

  it('counts a payment once even when confirmed concurrently (webhook + manual confirm)', async () => {
    const booking = await newBooking();
    await newPayment(booking.id, 100, 'pi_race');
    stripeSucceeds('pi_race', 100);

    await Promise.all(Array.from({ length: 5 }, () => paymentService.confirmPayment('pi_race')));

    expect(await prisma.booking.findUnique({ where: { id: booking.id } })).toMatchObject({
      status: 'CONFIRMED',
      paidAmount: 100, // not 500
    });
  });

  it('does not resurrect a booking that was cancelled while the payment was in flight', async () => {
    const booking = await newBooking('CANCELLED');
    await newPayment(booking.id, 100, 'pi_cancelled');
    stripeSucceeds('pi_cancelled', 100);

    await paymentService.confirmPayment('pi_cancelled');

    expect(await prisma.booking.findUnique({ where: { id: booking.id } })).toMatchObject({
      status: 'CANCELLED',
      paymentStatus: 'PAID',
    });
  });
});
