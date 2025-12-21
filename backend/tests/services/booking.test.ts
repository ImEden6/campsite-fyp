// Booking Service Tests

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, EquipmentCategory, EquipmentStatus, BookingStatus } from '@prisma/client';
import bookingService from '@/services/booking.service';

import prisma from '@/database';

describe('Booking Service - Equipment Availability', () => {
  let testEquipmentIds: string[] = [];
  let testBookingIds: string[] = [];
  let testUserIds: string[] = [];
  let testSiteIds: string[] = [];

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

  describe('getAvailableEquipment', () => {
    it('should return all equipment when no conflicts exist', async () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-07');

      const equipment = await bookingService.getAvailableEquipment({
        startDate,
        endDate,
      });

      expect(equipment).toBeDefined();
      expect(equipment.length).toBeGreaterThanOrEqual(2);

      const testEquipment = equipment.filter(e => testEquipmentIds.includes(e.id));
      expect(testEquipment.length).toBe(2);

      testEquipment.forEach(item => {
        expect(item.available).toBe(true);
        expect(item.availableQuantity).toBeGreaterThan(0);
      });
    });

    it('should detect conflicting bookings', async () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-07');

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

      // Create equipment rental that conflicts
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

      const equipment = await bookingService.getAvailableEquipment({
        startDate,
        endDate,
      });

      const conflictedEquipment = equipment.find(e => e.id === testEquipmentIds[0]);
      expect(conflictedEquipment).toBeDefined();
      expect(conflictedEquipment!.availableQuantity).toBe(2); // 5 - 3 = 2
      expect(conflictedEquipment!.available).toBe(true); // Still available, just reduced quantity
    });

    it('should mark equipment as unavailable when fully booked', async () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-07');

      // Create a booking that uses all equipment
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

      // Rent all available quantity
      await prisma.equipmentRental.create({
        data: {
          bookingId: booking.id,
          equipmentId: testEquipmentIds[0],
          quantity: 5, // All 5 tents
          dailyRate: 15,
          totalAmount: 150,
          depositAmount: 50,
          startDate: new Date('2024-06-03'),
          endDate: new Date('2024-06-05'),
        },
      });

      const equipment = await bookingService.getAvailableEquipment({
        startDate,
        endDate,
      });

      const unavailableEquipment = equipment.find(e => e.id === testEquipmentIds[0]);
      expect(unavailableEquipment).toBeDefined();
      expect(unavailableEquipment!.availableQuantity).toBe(0);
      expect(unavailableEquipment!.available).toBe(false);
    });

    it('should filter by equipment type', async () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-07');

      const equipment = await bookingService.getAvailableEquipment({
        startDate,
        endDate,
        equipmentType: EquipmentCategory.CAMPING_GEAR,
      });

      const testEquipment = equipment.filter(e => testEquipmentIds.includes(e.id));
      expect(testEquipment.length).toBe(1);
      expect(testEquipment[0].category).toBe(EquipmentCategory.CAMPING_GEAR);
    });

    it('should handle timezone conversion correctly', async () => {
      // Test with dates in different timezones
      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-07T23:59:59Z');

      const equipment = await bookingService.getAvailableEquipment({
        startDate,
        endDate,
      });

      expect(equipment).toBeDefined();
      expect(equipment.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid date range', async () => {
      const startDate = new Date('2024-06-07');
      const endDate = new Date('2024-06-01'); // End before start

      await expect(
        bookingService.getAvailableEquipment({
          startDate,
          endDate,
        })
      ).rejects.toThrow('Start date must be before end date');
    });

    it('should not count returned rentals as conflicts', async () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-07');

      // Create a booking with returned equipment
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
          status: BookingStatus.CHECKED_OUT,
          paymentStatus: 'PAID',
          totalAmount: 100,
          paidAmount: 100,
          depositAmount: 25,
          taxAmount: 8,
          discountAmount: 0,
        },
      });
      testBookingIds.push(booking.id);

      // Create equipment rental that's been returned
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
          returnedAt: new Date('2024-06-05'),
        },
      });

      const equipment = await bookingService.getAvailableEquipment({
        startDate,
        endDate,
      });

      const testEquipment = equipment.find(e => e.id === testEquipmentIds[0]);
      expect(testEquipment).toBeDefined();
      expect(testEquipment!.availableQuantity).toBe(5); // All available since returned
      expect(testEquipment!.available).toBe(true);
    });
  });
});
