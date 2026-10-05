// Cancelling, checking in and checking out (real Postgres)

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import bookingService from '@/services/booking.service';
import socketService from '@/services/socket.service';
import cacheService from '@/services/cache.service';
import prisma from '@/database';

const unique = () => `${Date.now()}-${Math.random()}`;

describe('Cancel, check-in and check-out (real database)', () => {
  let userId: string;
  let staffId: string;
  let seq = 0;
  const siteIds: string[] = [];
  const equipmentIds: string[] = [];
  let emit: ReturnType<typeof vi.spyOn>;
  let flush: ReturnType<typeof vi.spyOn>;

  const newSite = async () => {
    const site = await prisma.site.create({
      data: {
        name: `Desk ${unique()}`, type: 'TENT', status: 'AVAILABLE', capacity: 4, basePrice: 50, maxVehicles: 1, maxTents: 1,
        sizeLength: 1, sizeWidth: 1, sizeUnit: 'feet', latitude: 1, longitude: 1, mapPositionX: 1, mapPositionY: 1,
      },
    });
    siteIds.push(site.id);
    return site;
  };

  // Each booking gets its own dates so the site-overlap rule never gets in the way
  const newBooking = async (overrides: Record<string, unknown> = {}) => {
    const n = seq++;
    return prisma.booking.create({
      data: {
        bookingNumber: `BK-DESK-${unique()}`,
        userId,
        siteId: (await newSite()).id,
        checkInDate: new Date(Date.UTC(2039, 0, 1 + n * 3)),
        checkOutDate: new Date(Date.UTC(2039, 0, 3 + n * 3)),
        adultGuests: 2,
        childGuests: 1,
        totalAmount: 200,
        status: 'PENDING',
        ...overrides,
      },
    });
  };

  const events = () => emit.mock.calls.map(([rooms, event, data]) => ({ rooms, event, data }));
  const statusOf = async (id: string) => (await prisma.booking.findUniqueOrThrow({ where: { id } })).status;

  beforeAll(async () => {
    const mk = (label: string, role: 'CUSTOMER' | 'STAFF') =>
      prisma.user.create({ data: { email: `${label}-${unique()}@example.com`, firstName: label, lastName: 'T', password: 'x', role } });
    userId = (await mk('desk-cust', 'CUSTOMER')).id;
    staffId = (await mk('desk-staff', 'STAFF')).id;
  });

  beforeEach(() => {
    emit = vi.spyOn(socketService, 'emitToRooms').mockImplementation(() => {});
    flush = vi.spyOn(cacheService, 'flushPattern').mockResolvedValue(undefined);
  });

  afterEach(() => {
    emit.mockRestore();
    flush.mockRestore();
  });

  afterAll(async () => {
    await prisma.equipmentReservation.deleteMany({ where: { booking: { userId } } });
    await prisma.guest.deleteMany({ where: { booking: { userId } } });
    await prisma.booking.deleteMany({ where: { userId } });
    await prisma.equipment.deleteMany({ where: { id: { in: equipmentIds } } });
    await prisma.site.deleteMany({ where: { id: { in: siteIds } } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, staffId] } } });
  });

  describe('cancelBooking', () => {
    it('cancels a pending booking, returns it with its details, and works out the refund', async () => {
      const booking = await newBooking({ checkInDate: new Date(Date.now() + 30 * 86_400_000), checkOutDate: new Date(Date.now() + 32 * 86_400_000), paidAmount: 100, paymentStatus: 'PARTIAL' });

      const result = await bookingService.cancelBooking(booking.id, { cancelledBy: userId });

      expect(result.alreadyCancelled).toBe(false);
      expect(result.booking).toMatchObject({ id: booking.id, status: 'CANCELLED' });
      expect(result.booking.user).toMatchObject({ id: userId });
      expect(result.booking.user).not.toHaveProperty('password');
      expect(result.refund).toMatchObject({ refundPercentage: 100, refundAmount: 100, cancellationFee: 0 });
      expect(await statusOf(booking.id)).toBe('CANCELLED');
    });

    it('cancels a confirmed booking too', async () => {
      const booking = await newBooking({ status: 'CONFIRMED' });

      await bookingService.cancelBooking(booking.id, { cancelledBy: userId });

      expect(await statusOf(booking.id)).toBe('CANCELLED');
    });

    it('keeps the reason with the booking, trimmed, after any existing notes', async () => {
      const booking = await newBooking({ notes: 'Arriving late' });

      await bookingService.cancelBooking(booking.id, { reason: '  plans changed  ', cancelledBy: userId });

      expect((await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })).notes).toBe('Arriving late\nCancellation reason: plans changed');
    });

    it('leaves the notes alone when no reason is given', async () => {
      const booking = await newBooking({ notes: 'Arriving late' });

      await bookingService.cancelBooking(booking.id, { reason: '   ', cancelledBy: userId });

      expect((await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })).notes).toBe('Arriving late');
    });

    it('announces the cancellation once, to staff and the owner, and clears cached availability', async () => {
      const booking = await newBooking();

      await bookingService.cancelBooking(booking.id, { cancelledBy: userId });

      expect(events()).toEqual([
        { rooms: ['staff', `user:${userId}`], event: 'booking:cancelled', data: expect.objectContaining({ id: booking.id, status: 'CANCELLED' }) },
      ]);
      expect(flush).toHaveBeenCalledWith('equipment:availability:*');
      expect(flush).toHaveBeenCalledWith('sites:list:*');
    });

    it('gives back the equipment the booking held', async () => {
      const kit = await prisma.equipment.create({ data: { name: `Desk kit ${unique()}`, category: 'CAMPING_GEAR', quantity: 1, dailyRate: 10, weeklyRate: 60, monthlyRate: 200, deposit: 0 } });
      equipmentIds.push(kit.id);
      const created = await bookingService.createBooking({
        userId, siteId: (await newSite()).id, checkInDate: new Date('2039-09-01'), checkOutDate: new Date('2039-09-03'),
        adultGuests: 1, childGuests: 0, equipmentReservations: [{ equipmentId: kit.id, quantity: 1 }],
      });

      await bookingService.cancelBooking(created.id, { cancelledBy: userId });

      expect((await prisma.equipmentReservation.findFirstOrThrow({ where: { bookingId: created.id } })).status).toBe('CANCELLED');
    });

    it('is harmless to cancel twice: no second event, no refund owed', async () => {
      const booking = await newBooking();
      await bookingService.cancelBooking(booking.id, { cancelledBy: userId });
      emit.mockClear();

      const again = await bookingService.cancelBooking(booking.id, { cancelledBy: userId });

      expect(again.alreadyCancelled).toBe(true);
      expect(again.refund).toEqual({ refundAmount: 0, refundPercentage: 0, cancellationFee: 0, reason: 'Booking is already cancelled.' });
      expect(events()).toEqual([]);
    });

    it('lets only one of several simultaneous cancels do the work', async () => {
      const booking = await newBooking();

      const results = await Promise.all(Array.from({ length: 5 }, () => bookingService.cancelBooking(booking.id, { cancelledBy: userId })));

      expect(results.filter((r) => !r.alreadyCancelled)).toHaveLength(1);
      expect(events().filter((e) => e.event === 'booking:cancelled')).toHaveLength(1);
    });

    it.each(['CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW'])('refuses to cancel a %s booking, and changes nothing', async (status) => {
      const booking = await newBooking({ status });

      await expect(bookingService.cancelBooking(booking.id, { cancelledBy: userId })).rejects.toMatchObject({ statusCode: 400 });

      expect(await statusOf(booking.id)).toBe(status);
      expect(events()).toEqual([]);
    });

    it('returns 404 for a booking that does not exist', async () => {
      await expect(bookingService.cancelBooking('missing', { cancelledBy: userId })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('checkIn and checkOut', () => {
    it('checks a confirmed booking in, stamps the time, and announces it', async () => {
      const booking = await newBooking({ status: 'CONFIRMED' });

      const result = await bookingService.checkIn(booking.id, staffId);

      expect(result).toMatchObject({ id: booking.id, status: 'CHECKED_IN' });
      expect(result.checkInTime).toBeInstanceOf(Date);
      expect(result.user).not.toHaveProperty('password');
      expect(events()).toEqual([
        { rooms: ['staff', `user:${userId}`], event: 'booking:checked_in', data: expect.objectContaining({ id: booking.id, status: 'CHECKED_IN' }) },
      ]);
    });

    it('checks a checked-in booking out, stamps the time, and announces it', async () => {
      const booking = await newBooking({ status: 'CHECKED_IN' });

      const result = await bookingService.checkOut(booking.id, staffId);

      expect(result).toMatchObject({ status: 'CHECKED_OUT' });
      expect(result.checkOutTime).toBeInstanceOf(Date);
      expect(events().map((e) => e.event)).toEqual(['booking:checked_out']);
    });

    it.each(['PENDING', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT'])('will not check in a %s booking', async (status) => {
      const booking = await newBooking({ status });

      await expect(bookingService.checkIn(booking.id, staffId)).rejects.toMatchObject({ statusCode: 400, message: 'Only confirmed bookings can be checked in' });

      expect(await statusOf(booking.id)).toBe(status);
      expect(events()).toEqual([]);
    });

    it.each(['PENDING', 'CONFIRMED', 'CHECKED_OUT'])('will not check out a %s booking', async (status) => {
      const booking = await newBooking({ status });

      await expect(bookingService.checkOut(booking.id, staffId)).rejects.toMatchObject({ statusCode: 400, message: 'Only checked-in bookings can be checked out' });

      expect(events()).toEqual([]);
    });

    it('returns 404 for a booking that does not exist', async () => {
      await expect(bookingService.checkIn('missing', staffId)).rejects.toMatchObject({ statusCode: 404 });
      await expect(bookingService.checkOut('missing', staffId)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('checks in once even if the button is clicked several times', async () => {
      const booking = await newBooking({ status: 'CONFIRMED' });

      const results = await Promise.allSettled(Array.from({ length: 4 }, () => bookingService.checkIn(booking.id, staffId)));

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(events().filter((e) => e.event === 'booking:checked_in')).toHaveLength(1);
    });
  });
});
