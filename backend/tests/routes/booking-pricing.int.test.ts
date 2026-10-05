// Quote endpoint, booking creation with equipment, and cancelling (real Postgres, real routes).
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

describe('Pricing routes (real database)', () => {
  let userId: string;
  let siteId: string;
  let equipmentId: string;
  const extraSiteIds: string[] = [];

  const newSite = async () => {
    const site = await prisma.site.create({
      data: {
        name: `Route pricing ${unique()}`, type: 'CABIN', status: 'AVAILABLE', capacity: 6, basePrice: 100, maxVehicles: 1, maxTents: 1,
        sizeLength: 1, sizeWidth: 1, sizeUnit: 'feet', latitude: 1, longitude: 1, mapPositionX: 1, mapPositionY: 1,
      },
    });
    extraSiteIds.push(site.id);
    return site;
  };

  const as = () => ({ 'x-user-id': userId });

  beforeAll(async () => {
    userId = (await prisma.user.create({ data: { email: `route-pricing-${unique()}@example.com`, firstName: 'R', lastName: 'P', password: 'x', role: 'CUSTOMER' } })).id;
    siteId = (await newSite()).id;
    equipmentId = (
      await prisma.equipment.create({ data: { name: `Route kit ${unique()}`, category: 'CAMPING_GEAR', quantity: 1, dailyRate: 10, weeklyRate: 60, monthlyRate: 200, deposit: 0 } })
    ).id;
  });

  afterAll(async () => {
    await prisma.equipmentReservation.deleteMany({ where: { booking: { userId } } });
    await prisma.payment.deleteMany({ where: { userId } });
    await prisma.guest.deleteMany({ where: { booking: { userId } } });
    await prisma.booking.deleteMany({ where: { userId } });
    await prisma.equipment.delete({ where: { id: equipmentId } });
    await prisma.site.deleteMany({ where: { id: { in: extraSiteIds } } });
    await prisma.user.delete({ where: { id: userId } });
  });

  describe('POST /bookings/calculate-price', () => {
    const quote = (body: unknown) => request(app).post('/bookings/calculate-price').send(body as object);

    it('answers without logging in, in the shape the booking form expects', async () => {
      const res = await quote({ siteId, checkInDate: '2038-02-01', checkOutDate: '2038-02-04', equipmentReservations: [{ equipmentId, quantity: 1 }] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Object.keys(res.body.data)).toEqual(
        expect.arrayContaining(['basePrice', 'nights', 'subtotal', 'taxAmount', 'depositAmount', 'equipmentTotal', 'discountAmount', 'totalAmount', 'breakdown'])
      );
      expect(res.body.data).toMatchObject({ basePrice: 100, nights: 3, subtotal: 300, equipmentTotal: 30 });
      expect(res.body.data.breakdown).toEqual([
        { date: '2038-02-01', rate: 100, description: 'Base rate' },
        { date: '2038-02-02', rate: 100, description: 'Base rate' },
        { date: '2038-02-03', rate: 100, description: 'Base rate' },
      ]);
    });

    it.each([
      ['check-out not after check-in', { siteId: 'x', checkInDate: '2038-02-04', checkOutDate: '2038-02-01' }, 400],
      ['a missing date', { siteId: 'x', checkInDate: '2038-02-04' }, 400],
      ['a bad equipment quantity', { siteId: 'x', checkInDate: '2038-02-01', checkOutDate: '2038-02-04', equipmentReservations: [{ equipmentId: 'e', quantity: 0 }] }, 400],
      ['an unexpected field', { siteId: 'x', checkInDate: '2038-02-01', checkOutDate: '2038-02-04', totalAmount: 1 }, 400],
    ])('rejects %s', async (_label, body, status) => {
      expect((await quote(body)).status).toBe(status);
    });

    it('returns 404 for an unknown site', async () => {
      expect((await quote({ siteId: 'nope', checkInDate: '2038-02-01', checkOutDate: '2038-02-04' })).status).toBe(404);
    });
  });

  describe('creating and cancelling a booking with equipment', () => {
    const dates = { checkInDate: '2038-03-01', checkOutDate: '2038-03-03' };
    const create = (site: string) =>
      request(app).post('/bookings').set(as()).send({ siteId: site, ...dates, adultGuests: 1, childGuests: 0, equipmentReservations: [{ equipmentId, quantity: 1 }] });

    it('charges what the quote said, then frees the equipment when cancelled', async () => {
      const quoted = await request(app).post('/bookings/calculate-price').send({ siteId, ...dates, equipmentReservations: [{ equipmentId, quantity: 1 }] });

      const created = await create(siteId);
      expect(created.status).toBe(201);
      expect(created.body.data.totalAmount).toBe(quoted.body.data.totalAmount); // the price shown is the price charged
      expect(created.body.data.equipmentReservations).toHaveLength(1);

      // The only unit is taken, so a second booking for the same dates is refused
      const blocked = await create((await newSite()).id);
      expect(blocked.status).toBe(409);

      const cancelled = await request(app).post(`/bookings/${created.body.data.id}/cancel`).set(as()).send({ reason: 'plans changed' });
      expect(cancelled.status).toBe(200);
      expect((await prisma.equipmentReservation.findFirstOrThrow({ where: { bookingId: created.body.data.id } })).status).toBe('CANCELLED');

      // ...and now it is free again
      expect((await create((await newSite()).id)).status).toBe(201);
    });

    it('rejects equipment in an invalid shape', async () => {
      const res = await request(app).post('/bookings').set(as()).send({ siteId, checkInDate: '2038-04-01', checkOutDate: '2038-04-03', adultGuests: 1, childGuests: 0, equipmentReservations: [{ equipmentId, quantity: 'lots' }] });

      expect(res.status).toBe(400);
    });
  });
});
