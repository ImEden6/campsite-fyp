// Staff confirmation + automatic expiry of unpaid PENDING bookings (real Postgres)

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import bookingService from '@/services/booking.service';
import prisma from '@/database';
import { config } from '@/config';
import socketService from '@/services/socket.service';

const MIN = 60_000;

describe('Booking lifecycle (real database)', () => {
  let userId: string;
  let staffId: string;
  let siteId: string;
  let seq = 0;

  // Each booking gets its own stay so the overlap constraint never interferes
  const newBooking = async (overrides: Record<string, unknown> = {}) => {
    const n = seq++;
    return prisma.booking.create({
      data: {
        bookingNumber: `BK-LC-${Date.now()}-${n}-${Math.random()}`,
        userId,
        siteId,
        checkInDate: new Date(Date.UTC(2033, 0, 1 + n * 3)),
        checkOutDate: new Date(Date.UTC(2033, 0, 3 + n * 3)),
        adultGuests: 1,
        childGuests: 0,
        totalAmount: 100,
        status: 'PENDING',
        ...overrides,
      },
    });
  };

  const addPayment = (bookingId: string, status: 'PAID' | 'PENDING' | 'PARTIAL', createdAt = new Date()) =>
    prisma.payment.create({
      data: { bookingId, userId, amount: 10, method: 'CREDIT_CARD', status, createdAt },
    });

  const statusOf = async (id: string) => (await prisma.booking.findUniqueOrThrow({ where: { id } })).status;

  beforeAll(async () => {
    const mkUser = (label: string, role: 'CUSTOMER' | 'STAFF') =>
      prisma.user.create({
        data: { email: `${label}-${Date.now()}-${Math.random()}@example.com`, firstName: label, lastName: 'T', password: 'x', role },
      });
    userId = (await mkUser('cust', 'CUSTOMER')).id;
    staffId = (await mkUser('staff', 'STAFF')).id;
    siteId = (
      await prisma.site.create({
        data: {
          name: `Lifecycle ${Date.now()}-${Math.random()}`, type: 'TENT', status: 'AVAILABLE', capacity: 4, basePrice: 50, maxVehicles: 1,
          maxTents: 1, sizeLength: 1, sizeWidth: 1, sizeUnit: 'feet', latitude: 1, longitude: 1, mapPositionX: 1, mapPositionY: 1,
        },
      })
    ).id;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { userId } });
    await prisma.guest.deleteMany({ where: { booking: { userId } } });
    await prisma.booking.deleteMany({ where: { userId } });
    await prisma.site.delete({ where: { id: siteId } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, staffId] } } });
  });

  describe('confirmBooking', () => {
    it('confirms and records the balance as paid when a payment method is given', async () => {
      const booking = await newBooking();

      await bookingService.confirmBooking(booking.id, { paymentMethod: 'CASH', confirmedBy: staffId });

      expect(await prisma.booking.findUnique({ where: { id: booking.id } })).toMatchObject({
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paidAmount: 100,
      });
      const payments = await prisma.payment.findMany({ where: { bookingId: booking.id } });
      expect(payments).toHaveLength(1);
      expect(payments[0]).toMatchObject({ amount: 100, method: 'CASH', status: 'PAID' });
    });

    it('confirms without taking payment when no method is given', async () => {
      const booking = await newBooking();

      await bookingService.confirmBooking(booking.id, { confirmedBy: staffId });

      expect(await prisma.booking.findUnique({ where: { id: booking.id } })).toMatchObject({
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        paidAmount: 0,
      });
      expect(await prisma.payment.count({ where: { bookingId: booking.id } })).toBe(0);
    });

    it('records only the outstanding balance on a part-paid booking', async () => {
      const booking = await newBooking({ paidAmount: 40, paymentStatus: 'PARTIAL' });

      await bookingService.confirmBooking(booking.id, { paymentMethod: 'BANK_TRANSFER', confirmedBy: staffId });

      expect(await prisma.booking.findUnique({ where: { id: booking.id } })).toMatchObject({ paidAmount: 100, paymentStatus: 'PAID' });
      const [payment] = await prisma.payment.findMany({ where: { bookingId: booking.id } });
      expect(payment).toMatchObject({ amount: 60, method: 'BANK_TRANSFER' });
    });

    it.each(['CONFIRMED', 'CANCELLED', 'CHECKED_IN'] as const)('rejects a %s booking with 409', async (status) => {
      const booking = await newBooking({ status });

      await expect(bookingService.confirmBooking(booking.id, { confirmedBy: staffId })).rejects.toMatchObject({ statusCode: 409 });
      expect(await statusOf(booking.id)).toBe(status);
    });

    it('returns 404 for an unknown booking', async () => {
      await expect(bookingService.confirmBooking('nope', { confirmedBy: staffId })).rejects.toMatchObject({ statusCode: 404 });
    });

    it('records one payment when confirmed concurrently', async () => {
      const booking = await newBooking();

      const results = await Promise.allSettled(
        Array.from({ length: 4 }, () => bookingService.confirmBooking(booking.id, { paymentMethod: 'CASH', confirmedBy: staffId }))
      );

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(await prisma.payment.count({ where: { bookingId: booking.id } })).toBe(1);
      expect((await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })).paidAmount).toBe(100);
    });
  });

  describe('real-time events', () => {
    let spy: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      spy = vi.spyOn(socketService, 'emitToRooms').mockImplementation(() => {});
    });
    afterEach(() => spy.mockRestore());

    const sent = () => spy.mock.calls.map(([rooms, event, data]) => ({ rooms, event, data }));
    const rooms = () => ['staff', `user:${userId}`];

    it('confirming with payment announces the booking and the payment, to staff and the owner', async () => {
      const booking = await newBooking();

      await bookingService.confirmBooking(booking.id, { paymentMethod: 'CASH', confirmedBy: staffId });

      expect(sent().map((e) => e.event)).toEqual(['booking:confirmed', 'payment:processed']);
      expect(sent().every((e) => JSON.stringify(e.rooms) === JSON.stringify(rooms()))).toBe(true);
      expect(sent()[0]!.data).toMatchObject({ id: booking.id, status: 'CONFIRMED', userId });
      expect(sent()[1]!.data).toMatchObject({ bookingId: booking.id, amount: 100, status: 'PAID' });
    });

    it('confirming without payment announces only the booking', async () => {
      const booking = await newBooking();

      await bookingService.confirmBooking(booking.id, { confirmedBy: staffId });

      expect(sent().map((e) => e.event)).toEqual(['booking:confirmed']);
    });

    it('a rejected confirm announces nothing', async () => {
      const booking = await newBooking({ status: 'CANCELLED' });

      await bookingService.confirmBooking(booking.id, { confirmedBy: staffId }).catch(() => undefined);

      expect(sent()).toEqual([]);
    });

    it('editing a booking announces the updated state', async () => {
      const booking = await newBooking();

      await bookingService.updateBooking(booking.id, { notes: 'Late arrival' });

      expect(sent()).toEqual([
        { rooms: rooms(), event: 'booking:updated', data: expect.objectContaining({ id: booking.id, status: 'PENDING' }) },
      ]);
    });

    it('replacing the guest list announces the updated booking', async () => {
      const booking = await newBooking();
      const guests = [{ firstName: 'Una', lastName: 'User', type: 'ADULT' as const, isPrimary: true }];

      await bookingService.updateBookingGuests(booking.id, guests);

      expect(sent().map((e) => e.event)).toEqual(['booking:updated']);
    });

    it('an edit that conflicts with another booking announces nothing', async () => {
      const first = await newBooking();
      const second = await newBooking();

      await bookingService
        .updateBooking(second.id, { checkInDate: first.checkInDate, checkOutDate: first.checkOutDate })
        .catch(() => undefined);

      expect(sent()).toEqual([]);
    });
  });

  describe('expireUnpaidBookings', () => {
    // Expiry works on the whole table, so these tests backdate createdAt on their own rows
    // and use the real clock. Never fake "now" here: that would also cancel fresh PENDING
    // bookings created by other test files sharing the database.
    const minutesAgo = (m: number) => new Date(Date.now() - m * MIN);
    const hold = () => config.business.pendingBookingHoldMinutes;

    it('defaults to a 3 day hold', () => {
      expect(config.business.pendingBookingHoldMinutes).toBe(3 * 24 * 60);
    });

    it('cancels an unpaid PENDING booking after the hold and frees the site', async () => {
      const booking = await newBooking({ createdAt: minutesAgo(hold() + 1) });

      const cancelled = await bookingService.expireUnpaidBookings();

      expect(cancelled.map((b) => b.id)).toContain(booking.id);
      expect(await statusOf(booking.id)).toBe('CANCELLED');
      // The dates can be booked again
      await expect(
        bookingService.createBooking({
          userId, siteId, checkInDate: booking.checkInDate, checkOutDate: booking.checkOutDate, adultGuests: 1, childGuests: 0,
        })
      ).resolves.toBeDefined();
    });

    it('leaves a booking alone before the hold has passed', async () => {
      const booking = await newBooking({ createdAt: minutesAgo(hold() - 1) });

      await bookingService.expireUnpaidBookings();

      expect(await statusOf(booking.id)).toBe('PENDING');
    });

    it('leaves a part-paid booking alone', async () => {
      const booking = await newBooking({ createdAt: minutesAgo(hold() + 120), paidAmount: 10, paymentStatus: 'PARTIAL' });

      await bookingService.expireUnpaidBookings();

      expect(await statusOf(booking.id)).toBe('PENDING');
    });

    it('leaves a booking alone while a payment started in the last hour is in flight', async () => {
      const booking = await newBooking({ createdAt: minutesAgo(hold() + 1) });
      await addPayment(booking.id, 'PENDING', minutesAgo(5));

      await bookingService.expireUnpaidBookings();

      expect(await statusOf(booking.id)).toBe('PENDING');
    });

    it('expires a booking whose payment attempt was abandoned over an hour ago', async () => {
      const booking = await newBooking({ createdAt: minutesAgo(hold() + 60) });
      await addPayment(booking.id, 'PENDING', minutesAgo(90));

      await bookingService.expireUnpaidBookings();

      expect(await statusOf(booking.id)).toBe('CANCELLED');
    });

    it('never touches confirmed bookings', async () => {
      const booking = await newBooking({ createdAt: minutesAgo(hold() + 600), status: 'CONFIRMED' });

      await bookingService.expireUnpaidBookings();

      expect(await statusOf(booking.id)).toBe('CONFIRMED');
    });
  });
});
