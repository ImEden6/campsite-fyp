// Equipment Routes Integration Tests (real Postgres)

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { EquipmentCategory, BookingStatus } from '@prisma/client';
import request from 'supertest';
import express from 'express';
import equipmentRoutes from '@/routes/equipment.routes';
import { errorHandler } from '@/utils/errors';

import prisma from '@/database';
const app = express();

app.use(express.json());
app.use('/equipment', equipmentRoutes);
app.use(errorHandler);

describe('Equipment Routes - Availability Endpoint', () => {
  let testEquipmentIds: string[] = [];
  let testBookingIds: string[] = [];
  let testUserIds: string[] = [];
  let testSiteIds: string[] = [];

  const range = { startDate: '2024-06-01', endDate: '2024-06-07' };

  /** A confirmed booking for the test site that reserves `quantity` units of one equipment item. */
  const reserve = async (equipmentId: string, quantity: number, dates = { from: '2024-06-03', to: '2024-06-05' }) => {
    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `BK-EQ-${Date.now()}-${Math.random()}`,
        userId: testUserIds[0]!,
        siteId: testSiteIds[0]!,
        checkInDate: new Date(dates.from),
        checkOutDate: new Date(dates.to),
        adultGuests: 2,
        childGuests: 0,
        petGuests: 0,
        status: BookingStatus.CONFIRMED,
        paymentStatus: 'PENDING',
        totalAmount: 100,
      },
    });
    testBookingIds.push(booking.id);

    await prisma.equipmentReservation.create({
      data: {
        bookingId: booking.id,
        equipmentId,
        quantity,
        startDate: new Date(dates.from),
        endDate: new Date(dates.to),
        status: 'CONFIRMED',
        dailyRate: 15,
        totalAmount: 15 * quantity,
      },
    });
    return booking;
  };

  const find = (body: { data: Array<{ id: string }> }, id: string) => body.data.find((e) => e.id === id) as any;

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}-${Math.random()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword',
        role: 'CUSTOMER',
      },
    });
    testUserIds.push(testUser.id);

    const testSite = await prisma.site.create({
      data: {
        name: `Test Site ${Date.now()}-${Math.random()}`,
        type: 'TENT',
        status: 'AVAILABLE',
        capacity: 4,
        basePrice: 50,
        maxVehicles: 2,
        maxTents: 1,
        sizeLength: 20,
        sizeWidth: 15,
        sizeUnit: 'feet',
        latitude: 40.7128,
        longitude: -74.006,
        mapPositionX: 100,
        mapPositionY: 100,
      },
    });
    testSiteIds.push(testSite.id);

    const tent = await prisma.equipment.create({
      data: {
        name: 'Test Tent',
        description: 'A test camping tent',
        category: EquipmentCategory.CAMPING_GEAR,
        quantity: 5,
        dailyRate: 15,
        weeklyRate: 90,
        monthlyRate: 300,
        deposit: 50,
      },
    });
    const kayak = await prisma.equipment.create({
      data: {
        name: 'Test Kayak',
        description: 'A test kayak',
        category: EquipmentCategory.RECREATIONAL,
        quantity: 3,
        dailyRate: 25,
        weeklyRate: 150,
        monthlyRate: 500,
        deposit: 100,
      },
    });
    testEquipmentIds.push(tent.id, kayak.id);
  });

  afterEach(async () => {
    await prisma.equipmentReservation.deleteMany({ where: { bookingId: { in: testBookingIds } } });
    await prisma.booking.deleteMany({ where: { id: { in: testBookingIds } } });
    await prisma.equipment.deleteMany({ where: { id: { in: testEquipmentIds } } });
    await prisma.site.deleteMany({ where: { id: { in: testSiteIds } } });
    await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });

    testEquipmentIds = [];
    testBookingIds = [];
    testUserIds = [];
    testSiteIds = [];
  });

  describe('GET /equipment/available', () => {
    it('returns the equipment for a valid date range', async () => {
      const response = await request(app).get('/equipment/available').query(range);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(2);
      expect(testEquipmentIds.every((id) => find(response.body, id))).toBe(true);
    });

    it.each([
      ['startDate is missing', { endDate: '2024-06-07' }],
      ['endDate is missing', { startDate: '2024-06-01' }],
      ['a date is not a date', { startDate: 'invalid-date', endDate: '2024-06-07' }],
      ['startDate is after endDate', { startDate: '2024-06-07', endDate: '2024-06-01' }],
      ['startDate equals endDate', { startDate: '2024-06-07', endDate: '2024-06-07' }],
    ])('returns 400 when %s', async (_label, query) => {
      const response = await request(app).get('/equipment/available').query(query);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('filters by equipment type', async () => {
      const response = await request(app)
        .get('/equipment/available')
        .query({ ...range, equipmentType: EquipmentCategory.CAMPING_GEAR });

      expect(response.status).toBe(200);
      const ours = response.body.data.filter((e: { id: string }) => testEquipmentIds.includes(e.id));
      expect(ours).toHaveLength(1);
      expect(ours[0].category).toBe(EquipmentCategory.CAMPING_GEAR);
    });

    it('reports reduced availability while some units are reserved', async () => {
      await reserve(testEquipmentIds[0]!, 3);

      const response = await request(app).get('/equipment/available').query(range);

      const tent = find(response.body, testEquipmentIds[0]!);
      expect(tent.availableQuantity).toBe(2); // 5 - 3
      expect(tent.available).toBe(true);
      expect(tent.conflictingBookings).toHaveLength(1);
    });

    it('reports equipment as unavailable once every unit is reserved', async () => {
      await reserve(testEquipmentIds[0]!, 5);

      const response = await request(app).get('/equipment/available').query(range);

      const tent = find(response.body, testEquipmentIds[0]!);
      expect(tent.availableQuantity).toBe(0);
      expect(tent.available).toBe(false);
    });

    it('adds up reservations from different bookings', async () => {
      await reserve(testEquipmentIds[0]!, 2, { from: '2024-06-02', to: '2024-06-04' });
      await reserve(testEquipmentIds[0]!, 2, { from: '2024-06-04', to: '2024-06-06' }); // back to back: same site, no overlap

      const response = await request(app).get('/equipment/available').query(range);

      expect(find(response.body, testEquipmentIds[0]!).availableQuantity).toBe(1);
    });

    it('ignores reservations outside the requested dates', async () => {
      await reserve(testEquipmentIds[0]!, 4, { from: '2024-07-10', to: '2024-07-12' });

      const response = await request(app).get('/equipment/available').query(range);

      const tent = find(response.body, testEquipmentIds[0]!);
      expect(tent.availableQuantity).toBe(5);
      expect(tent.conflictingBookings).toBeUndefined();
    });

    it('ignores cancelled reservations', async () => {
      const booking = await reserve(testEquipmentIds[0]!, 4);
      await prisma.equipmentReservation.updateMany({ where: { bookingId: booking.id }, data: { status: 'CANCELLED' } });

      const response = await request(app).get('/equipment/available').query(range);

      expect(find(response.body, testEquipmentIds[0]!).availableQuantity).toBe(5);
    });

    it('leaves untouched equipment fully available', async () => {
      await reserve(testEquipmentIds[0]!, 3); // only the tent is reserved

      const response = await request(app).get('/equipment/available').query(range);

      const kayak = find(response.body, testEquipmentIds[1]!);
      expect(kayak.availableQuantity).toBe(3);
      expect(kayak.available).toBe(true);
      expect(kayak.conflictingBookings).toBeUndefined();
    });

    it('gives the same answer for every site, because equipment is one shared inventory', async () => {
      await reserve(testEquipmentIds[0]!, 2);

      const anySite = await request(app).get('/equipment/available').query(range);
      const oneSite = await request(app).get('/equipment/available').query({ ...range, siteId: testSiteIds[0] });
      const otherSite = await request(app).get('/equipment/available').query({ ...range, siteId: 'some-other-site' });

      for (const res of [oneSite, otherSite]) {
        expect(res.status).toBe(200);
        expect(find(res.body, testEquipmentIds[0]!).availableQuantity).toBe(3);
      }
      expect(find(anySite.body, testEquipmentIds[0]!).availableQuantity).toBe(3);
    });

    it('says whether the answer came from the cache', async () => {
      const first = await request(app).get('/equipment/available').query(range);
      const second = await request(app).get('/equipment/available').query(range);

      expect(first.status).toBe(200);
      expect(first.body.cached).toBeDefined();
      expect(second.status).toBe(200);
      expect(second.body.cached).toBeDefined();
    });
  });

  describe('unknown equipment categories', () => {
    it('are refused when listing equipment, instead of failing inside the database', async () => {
      const res = await request(app).get('/equipment').query({ category: 'NOT_A_CATEGORY' });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('NOT_A_CATEGORY');
    });

    it('are refused when any one of several is unknown', async () => {
      const res = await request(app).get('/equipment').query({ category: [EquipmentCategory.CAMPING_GEAR, 'BOGUS'] });

      expect(res.status).toBe(400);
    });

    it('are refused when checking availability', async () => {
      const res = await request(app).get('/equipment/available').query({ ...range, equipmentType: 'NOT_A_CATEGORY' });

      expect(res.status).toBe(400);
    });

    it('still list equipment for a real category', async () => {
      const res = await request(app).get('/equipment').query({ category: EquipmentCategory.CAMPING_GEAR });

      expect(res.status).toBe(200);
      expect(res.body.data.every((e: { category: string }) => e.category === EquipmentCategory.CAMPING_GEAR)).toBe(true);
    });
  });
});
