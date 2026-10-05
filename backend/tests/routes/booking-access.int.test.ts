// Who can see and change which bookings, and how lists are filtered (real Postgres, real routes).
// Only login is stubbed: the test says who is calling via a header.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('@/middleware/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/middleware/auth')>();
  return {
    ...actual,
    authenticate: async (req: any, _res: unknown, next: () => void) => {
      const user = await (await import('@/database')).default.user.findUniqueOrThrow({ where: { id: String(req.headers['x-user-id']) } });
      req.user = { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, isActive: true, isEmailVerified: true };
      next();
    },
  };
});

import bookingRoutes from '@/routes/booking.routes';
import { errorHandler } from '@/utils/errors';
import prisma from '@/database';

const app = express();
app.use(express.json());
app.use('/bookings', bookingRoutes);
app.use(errorHandler);

const unique = () => `${Date.now()}-${Math.random()}`;
const DAY = 86_400_000;

describe('Booking access and listing (real database)', () => {
  const people: Record<'alice' | 'bob' | 'stella' | 'mia' | 'ada', string> = {} as never;
  let siteId: string;
  let aliceBooking: { id: string; bookingNumber: string };
  let bobBooking: { id: string; bookingNumber: string };
  let pastStay: { id: string };

  const as = (who: keyof typeof people) => ({ 'x-user-id': people[who] });
  const call = (who: keyof typeof people) => ({
    get: (path: string) => request(app).get(path).set(as(who)),
    post: (path: string, body: object = {}) => request(app).post(path).set(as(who)).send(body),
  });

  const stay = async (userId: string, n: number, data: Record<string, unknown> = {}) => {
    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `BK-ACC-${unique()}`, userId, siteId,
        checkInDate: new Date(Date.UTC(2040, 0, 1 + n * 3)), checkOutDate: new Date(Date.UTC(2040, 0, 3 + n * 3)),
        adultGuests: 2, childGuests: 1, petGuests: 0, totalAmount: 200, status: 'PENDING', ...data,
      },
    });
    return booking;
  };

  beforeAll(async () => {
    const roles = { alice: 'CUSTOMER', bob: 'CUSTOMER', stella: 'STAFF', mia: 'MANAGER', ada: 'ADMIN' } as const;
    for (const [name, role] of Object.entries(roles)) {
      people[name as keyof typeof people] = (
        await prisma.user.create({ data: { email: `${name}-${unique()}@example.com`, firstName: name, lastName: 'Access', password: 'x', role } })
      ).id;
    }
    siteId = (
      await prisma.site.create({
        data: {
          name: `Access ${unique()}`, type: 'TENT', status: 'AVAILABLE', capacity: 6, basePrice: 50, maxVehicles: 1, maxTents: 1,
          sizeLength: 1, sizeWidth: 1, sizeUnit: 'feet', latitude: 1, longitude: 1, mapPositionX: 1, mapPositionY: 1,
        },
      })
    ).id;

    aliceBooking = await stay(people.alice, 0, { paidAmount: 200, paymentStatus: 'PAID', status: 'CONFIRMED' });
    bobBooking = await stay(people.bob, 1, { status: 'PENDING' });
    await stay(people.alice, 2, { status: 'CANCELLED' });
    await stay(people.alice, 3, { status: 'CONFIRMED' });
    pastStay = await prisma.booking.create({
      data: {
        bookingNumber: `BK-ACC-${unique()}`, userId: people.alice, siteId,
        checkInDate: new Date(Date.now() - 10 * DAY), checkOutDate: new Date(Date.now() - 8 * DAY),
        adultGuests: 1, childGuests: 0, totalAmount: 100, status: 'CHECKED_IN',
      },
    });
    await prisma.payment.create({ data: { bookingId: aliceBooking.id, userId: people.alice, amount: 200, method: 'CASH', status: 'PAID' } });
  });

  afterAll(async () => {
    const ids = Object.values(people);
    await prisma.payment.deleteMany({ where: { userId: { in: ids } } });
    await prisma.guest.deleteMany({ where: { booking: { siteId } } });
    await prisma.booking.deleteMany({ where: { siteId } });
    await prisma.site.delete({ where: { id: siteId } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  });

  describe('listing', () => {
    it('shows a customer only their own bookings', async () => {
      const res = await call('alice').get(`/bookings?siteId=${siteId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((b: { user: { id: string } }) => b.user.id === people.alice)).toBe(true);
      expect(res.body.data.some((b: { id: string }) => b.id === bobBooking.id)).toBe(false);
      expect(res.body.count).toBe(res.body.data.length);
    });

    it.each(['stella', 'mia', 'ada'] as const)('shows %s every booking', async (who) => {
      const res = await call(who).get(`/bookings?siteId=${siteId}`);

      const owners = new Set(res.body.data.map((b: { user: { id: string } }) => b.user.id));
      expect(owners).toEqual(new Set([people.alice, people.bob]));
    });

    it('gives guests as counts, keeps the rows as guestDetails, and never leaks a password', async () => {
      const res = await call('stella').get(`/bookings?siteId=${siteId}&searchTerm=${aliceBooking.bookingNumber}`);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({ guests: { adults: 2, children: 1, pets: 0 }, guestDetails: [] });
      expect(JSON.stringify(res.body)).not.toContain('"password"');
    });

    it('filters by status', async () => {
      const res = await call('stella').get(`/bookings?siteId=${siteId}&status=CANCELLED`);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data.every((b: { status: string }) => b.status === 'CANCELLED')).toBe(true);
    });

    it('searches by booking number, and by customer name for staff', async () => {
      const byNumber = await call('stella').get(`/bookings?siteId=${siteId}&searchTerm=${bobBooking.bookingNumber.toLowerCase()}`);
      const byName = await call('stella').get(`/bookings?siteId=${siteId}&searchTerm=bob`);

      expect(byNumber.body.data.map((b: { id: string }) => b.id)).toEqual([bobBooking.id]);
      expect(byName.body.data.every((b: { user: { firstName: string } }) => b.user.firstName === 'bob')).toBe(true);
    });

    it('filters by check-in date range', async () => {
      const res = await call('stella').get(`/bookings?siteId=${siteId}&startDate=2040-01-01&endDate=2040-01-05`);

      const ids = res.body.data.map((b: { id: string }) => b.id);
      expect(ids).toEqual(expect.arrayContaining([aliceBooking.id, bobBooking.id]));
      expect(ids).toHaveLength(2);
    });

    it('lists newest check-in first', async () => {
      const res = await call('stella').get(`/bookings?siteId=${siteId}`);

      const dates = res.body.data.map((b: { checkInDate: string }) => b.checkInDate);
      expect([...dates].sort().reverse()).toEqual(dates);
    });

    it('pages results and reports the totals', async () => {
      const first = await call('stella').get(`/bookings/paginated?siteId=${siteId}&page=1&limit=2`);
      const last = await call('stella').get(`/bookings/paginated?siteId=${siteId}&page=3&limit=2`);

      expect(first.body).toMatchObject({ success: true, page: 1, limit: 2, total: 5, totalPages: 3 });
      expect(first.body.data).toHaveLength(2);
      expect(last.body.data).toHaveLength(1);
    });

    it('falls back to sensible paging for nonsense values', async () => {
      const res = await call('stella').get(`/bookings/paginated?siteId=${siteId}&page=abc&limit=-5`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ page: 1, limit: 10 });
    });

    it('does not let a customer page through other people\'s bookings', async () => {
      const res = await call('bob').get(`/bookings/paginated?siteId=${siteId}`);

      expect(res.body.total).toBe(1);
    });

    it('lists my bookings, and shows a checked-in stay past its check-out date as checked out', async () => {
      const res = await call('alice').get('/bookings/my-bookings');

      expect(res.body.data.every((b: { userId: string }) => b.userId === people.alice)).toBe(true);
      expect(res.body.data.find((b: { id: string }) => b.id === pastStay.id).status).toBe('CHECKED_OUT');
      expect(res.body.data[0].guests).toEqual(expect.objectContaining({ adults: expect.any(Number) }));
    });

    it('filters my bookings by status', async () => {
      const res = await call('alice').get('/bookings/my-bookings?status=CANCELLED');

      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('opening a booking', () => {
    it('lets the owner open it, with guest counts and payments', async () => {
      const res = await call('alice').get(`/bookings/${aliceBooking.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ id: aliceBooking.id, guests: { adults: 2, children: 1, pets: 0 } });
      expect(res.body.data.payments).toHaveLength(1);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('stops one customer opening another\'s booking', async () => {
      expect((await call('bob').get(`/bookings/${aliceBooking.id}`)).status).toBe(403);
    });

    it.each(['stella', 'mia', 'ada'] as const)('lets %s open any booking', async (who) => {
      expect((await call(who).get(`/bookings/${aliceBooking.id}`)).status).toBe(200);
    });

    it('returns 404 to staff for a booking that does not exist', async () => {
      expect((await call('ada').get('/bookings/missing')).status).toBe(404);
    });

    it('does not reveal to a customer whether someone else\'s booking exists', async () => {
      const missing = await call('bob').get('/bookings/missing');
      const others = await call('bob').get(`/bookings/${aliceBooking.id}`);

      expect(missing.status).toBe(others.status);
    });
  });

  describe('payments of a booking', () => {
    it('are visible to the owner and to staff, not to another customer', async () => {
      expect((await call('alice').get(`/bookings/${aliceBooking.id}/payments`)).status).toBe(200);
      expect((await call('stella').get(`/bookings/${aliceBooking.id}/payments`)).body.data).toHaveLength(1);
      expect((await call('bob').get(`/bookings/${aliceBooking.id}/payments`)).status).toBe(403);
    });

    it('return 404 for a booking that does not exist', async () => {
      expect((await call('ada').get('/bookings/missing/payments')).status).toBe(404);
    });
  });

  describe('refund preview', () => {
    it('shows the owner what cancelling would refund', async () => {
      const res = await call('alice').get(`/bookings/${aliceBooking.id}/refund-calculation`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ refundPercentage: expect.any(Number), refundAmount: expect.any(Number) });
    });

    it('is closed to other customers', async () => {
      expect((await call('bob').get(`/bookings/${aliceBooking.id}/refund-calculation`)).status).toBe(403);
    });
  });

  describe('cancelling', () => {
    it('lets the owner cancel, returning the refund details and the booking', async () => {
      const own = await stay(people.alice, 20, { status: 'PENDING' });

      const res = await call('alice').post(`/bookings/${own.id}/cancel`, { reason: 'plans changed' });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ id: own.id, status: 'CANCELLED', guests: { adults: 2, children: 1, pets: 0 } });
      expect(res.body.meta.refund).toMatchObject({ refundAmount: 0, cancellationFee: 0 });
    });

    it('stops another customer cancelling it', async () => {
      const own = await stay(people.alice, 21);

      expect((await call('bob').post(`/bookings/${own.id}/cancel`)).status).toBe(403);
      expect((await prisma.booking.findUniqueOrThrow({ where: { id: own.id } })).status).toBe('PENDING');
    });

    it('lets staff cancel a customer\'s booking at the desk', async () => {
      const own = await stay(people.alice, 22);

      expect((await call('stella').post(`/bookings/${own.id}/cancel`)).status).toBe(200);
    });

    it('tells a customer a checked-in stay cannot be cancelled', async () => {
      const res = await call('alice').post(`/bookings/${pastStay.id}/cancel`);

      expect(res.status).toBe(400);
    });

    it('answers a second cancel as a success with nothing owed', async () => {
      const own = await stay(people.alice, 23);
      await call('alice').post(`/bookings/${own.id}/cancel`);

      const again = await call('alice').post(`/bookings/${own.id}/cancel`);

      expect(again.status).toBe(200);
      expect(again.body.meta.refund.reason).toMatch(/already cancelled/i);
    });
  });

  describe('front desk actions', () => {
    it('are closed to customers', async () => {
      const own = await stay(people.alice, 24, { status: 'CONFIRMED' });

      for (const action of ['check-in', 'check-out', 'confirm']) {
        expect((await call('alice').post(`/bookings/${own.id}/${action}`)).status).toBe(403);
      }
    });

    it('take a booking from confirmed to checked in to checked out', async () => {
      const own = await stay(people.alice, 25, { status: 'CONFIRMED' });

      const checkedIn = await call('stella').post(`/bookings/${own.id}/check-in`);
      const checkedOut = await call('stella').post(`/bookings/${own.id}/check-out`);

      expect(checkedIn.body.data).toMatchObject({ status: 'CHECKED_IN', guests: { adults: 2, children: 1, pets: 0 } });
      expect(checkedOut.body.data.status).toBe('CHECKED_OUT');
    });

    it('refuse a check-in for a booking that is not confirmed', async () => {
      const own = await stay(people.alice, 26, { status: 'PENDING' });

      expect((await call('stella').post(`/bookings/${own.id}/check-in`)).status).toBe(400);
    });
  });
});
