// Equipment Routes Integration Tests

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { PrismaClient, EquipmentCategory, EquipmentStatus, BookingStatus } from '@prisma/client';
import request from 'supertest';
import express from 'express';
import equipmentRoutes from '@/routes/equipment.routes';
import { errorHandler } from '@/utils/errors';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use('/equipment', equipmentRoutes);
app.use(errorHandler);

describe('Equipment Routes - Availability Endpoint', () => {
  let testEquipmentIds: string[] = [];
  let testBookingIds: string[] = [];
  let testUserIds: string[] = [];
  let testSiteIds: string[] = [];

  beforeAll(async () => {
    // Ensure database connection
    await prisma.$connect();
  });

  beforeEach(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword',
        role: 'CUSTOMER',
      },
    });
    testUserIds.push(testUser.id);

    // Create test site
    const testSite = await prisma.site.create({
      data: {
        name: `Test Site ${Date.now()}`,
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
        longitude: -74.0060,
        mapPositionX: 100,
        mapPositionY: 100,
      },
    });
    testSiteIds.push(testSite.id);

    // Create test equipment
    const equipment1 = await prisma.equipment.create({
      data: {
        name: 'Test Tent',
        description: 'A test camping tent',
        category: EquipmentCategory.CAMPING_GEAR,
        status: EquipmentStatus.AVAILABLE,
        quantity: 5,
        availableQuantity: 5,
        dailyRate: 15,
        weeklyRate: 90,
        monthlyRate: 300,
        deposit: 50,
      },
    });
    testEquipmentIds.push(equipment1.id);

    const equipment2 = await prisma.equipment.create({
      data: {
        name: 'Test Kayak',
        description: 'A test kayak',
        category: EquipmentCategory.RECREATIONAL,
        status: EquipmentStatus.AVAILABLE,
        quantity: 3,
        availableQuantity: 3,
        dailyRate: 25,
        weeklyRate: 150,
        monthlyRate: 500,
        deposit: 100,
      },
    });
    testEquipmentIds.push(equipment2.id);
  });

  afterEach(async () => {
    // Clean up in reverse order of dependencies
    if (testBookingIds.length > 0) {
      await prisma.equipmentRental.deleteMany({
        where: { bookingId: { in: testBookingIds } },
      });
      await prisma.booking.deleteMany({
        where: { id: { in: testBookingIds } },
      });
    }

    if (testEquipmentIds.length > 0) {
      await prisma.equipment.deleteMany({
        where: { id: { in: testEquipmentIds } },
      });
    }

    if (testSiteIds.length > 0) {
      await prisma.site.deleteMany({
        where: { id: { in: testSiteIds } },
      });
    }

    if (testUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
    }

    testEquipmentIds = [];
    testBookingIds = [];
    testUserIds = [];
    testSiteIds = [];
  });

  describe('GET /equipment/available', () => {
    it('should return available equipment for valid date range', async () => {
      const response = await request(app)
        .get('/equipment/available')
        .query({
          startDate: '2024-06-01',
          endDate: '2024-06-07',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(2);
    });

    it('should return 400 when startDate is missing', async () => {
      const response = await request(app)
        .get('/equipment/available')
        .query({
          endDate: '2024-06-07',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when endDate is missing', async () => {
      const response = await request(app)
        .get('/equipment/available')
        .query({
          startDate: '2024-06-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/equipment/available')
        .query({
          startDate: 'invalid-date',
          endDate: '2024-06-07',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when startDate is after endDate', async () => {
      const response = await request(app)
        .get('/equipment/available')
        .query({
          startDate: '2024-06-07',
          endDate: '2024-06-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should filter by equipment type', async () => {
      const response = await request(app)
        .get('/equipment/available')
        .query({
          startDate: '2024-06-01',
          endDate: '2024-06-07',
          equipmentType: EquipmentCategory.CAMPING_GEAR,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const testEquipment = response.body.data.filter((e: any) => 
        testEquipmentIds.includes(e.id)
      );
      
      expect(testEquipment.length).toBe(1);
      expect(testEquipment[0].category).toBe(EquipmentCategory.CAMPING_GEAR);
    });

    it('should show reduced availability for conflicting bookings', async () => {
      // Create a booking with equipment rental
      const booking = await prisma.booking.create({
        data: {
          bookingNumber: `BK${Date.now()}`,
          userId: testUserIds[0],
          siteId: testSiteIds[0],
          checkInDate: new Date('2024-06-03'),
          checkOutDate: new Date('2024-06-05'),
          adultGuests: 2,
          childGuests: 0,
          petGuests: 0,
          status: BookingStatus.CONFIRMED,
          paymentStatus: 'PENDING',
          totalAmount: 100,
          paidAmount: 0,
          depositAmount: 25,
          taxAmount: 8,
          discountAmount: 0,
        },
      });
      testBookingIds.push(booking.id);

      // Create equipment rental
      await prisma.equipmentRental.create({
        data: {
          bookingId: booking.id,
          equipmentId: testEquipmentIds[0],
          quantity: 3,
          dailyRate: 15,
          totalAmount: 90,
          depositAmount: 50,
          startDate: new Date('2024-06-03'),
          endDate: new Date('2024-06-05'),
        },
      });

      const response = await request(app)
        .get('/equipment/available')
        .query({
          startDate: '2024-06-01',
          endDate: '2024-06-07',
        });

      expect(response.status).toBe(200);
      
      const conflictedEquipment = response.body.data.find(
        (e: any) => e.id === testEquipmentIds[0]
      );
      
      expect(conflictedEquipment).toBeDefined();
      expect(conflictedEquipment.availableQuantity).toBe(2); // 5 - 3 = 2
      expect(conflictedEquipment.available).toBe(true);
    });

    it('should indicate caching in response', async () => {
      // First request - not cached
      const response1 = await request(app)
        .get('/equipment/available')
        .query({
          startDate: '2024-06-01',
          endDate: '2024-06-07',
        });

      expect(response1.status).toBe(200);
      expect(response1.body.cached).toBeDefined();

      // Second request - should be cached (if Redis is available)
      const response2 = await request(app)
        .get('/equipment/available')
        .query({
          startDate: '2024-06-01',
          endDate: '2024-06-07',
        });

      expect(response2.status).toBe(200);
      expect(response2.body.cached).toBeDefined();
    });

    it('should handle equipment with no conflicts correctly', async () => {
      const response = await request(app)
        .get('/equipment/available')
        .query({
          startDate: '2024-06-01',
          endDate: '2024-06-07',
        });

      expect(response.status).toBe(200);
      
      const kayak = response.body.data.find(
        (e: any) => e.id === testEquipmentIds[1]
      );
      
      expect(kayak).toBeDefined();
      expect(kayak.availableQuantity).toBe(3);
      expect(kayak.available).toBe(true);
      expect(kayak.conflictingBookings).toBeUndefined();
    });
  });
});
