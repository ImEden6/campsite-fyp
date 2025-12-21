// seeded data


import { getPrismaClient } from '../src/database';
import bcrypt from 'bcryptjs';

const prisma = getPrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@campsite.com' },
    update: {},
    create: {
      email: 'admin@campsite.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
    },
  });

  // Create test customer user
  const userPassword = await bcrypt.hash('user123', 10);
  await prisma.user.upsert({
    where: { email: 'user@campsite.com' },
    update: {},
    create: {
      email: 'user@campsite.com',
      password: userPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'CUSTOMER',
      isActive: true,
      isEmailVerified: true,
    },
  });

  // Create tent sites
  for (let i = 1; i <= 10; i++) {
    await prisma.site.upsert({
      where: { name: `Tent Site ${i}` },
      update: {},
      create: {
        name: `Tent Site ${i}`,
        type: 'TENT',
        status: 'AVAILABLE',
        capacity: 4,
        description: `Basic tent camping site ${i} with beautiful views`,
        amenities: ['Fire Pit', 'Picnic Table'],
        basePrice: 25.00,
        maxVehicles: 1,
        maxTents: 2,
        isPetFriendly: true,
        hasElectricity: false,
        hasWater: false,
        hasSewer: false,
        hasWifi: false,
        sizeLength: 20,
        sizeWidth: 20,
        latitude: 40.7128 + (i * 0.001),
        longitude: -74.0060 + (i * 0.001),
        mapPositionX: 100 + (i * 50),
        mapPositionY: 100 + (i % 2 * 30),
      },
    });
  }

  // Create RV sites
  for (let i = 1; i <= 5; i++) {
    await prisma.site.upsert({
      where: { name: `RV Site ${i}` },
      update: {},
      create: {
        name: `RV Site ${i}`,
        type: 'RV',
        status: 'AVAILABLE',
        capacity: 6,
        description: `RV camping site ${i} with full hookups`,
        amenities: ['Water Hookup', 'Electric Hookup', 'Sewer Hookup', 'WiFi', 'Fire Pit'],
        basePrice: 45.00,
        maxVehicles: 2,
        maxTents: 0,
        isPetFriendly: true,
        hasElectricity: true,
        hasWater: true,
        hasSewer: true,
        hasWifi: true,
        sizeLength: 40,
        sizeWidth: 25,
        latitude: 40.7128 + (i * 0.002),
        longitude: -74.0060 + (i * 0.002),
        mapPositionX: 200 + (i * 60),
        mapPositionY: 200,
      },
    });
  }

  // Create cabin sites
  for (let i = 1; i <= 3; i++) {
    await prisma.site.upsert({
      where: { name: `Cabin ${i}` },
      update: {},
      create: {
        name: `Cabin ${i}`,
        type: 'CABIN',
        status: 'AVAILABLE',
        capacity: 8,
        description: `Rustic cabin ${i} with modern amenities`,
        amenities: ['Electricity', 'Water', 'WiFi', 'Kitchen', 'Bathroom', 'Heating'],
        basePrice: 120.00,
        maxVehicles: 2,
        maxTents: 0,
        isPetFriendly: false,
        hasElectricity: true,
        hasWater: true,
        hasSewer: true,
        hasWifi: true,
        sizeLength: 30,
        sizeWidth: 20,
        latitude: 40.7128 + (i * 0.003),
        longitude: -74.0060 + (i * 0.003),
        mapPositionX: 300 + (i * 70),
        mapPositionY: 150,
      },
    });
  }

  // Create sample equipment
  const equipmentItems = [
    {
      name: 'Tent (4-person)',
      description: 'Spacious 4-person camping tent',
      category: 'CAMPING_GEAR' as const,
      quantity: 10,
      availableQuantity: 10,
      dailyRate: 15.00,
      weeklyRate: 75.00,
      monthlyRate: 200.00,
      deposit: 50.00,
    },
    {
      name: 'Sleeping Bag',
      description: 'Warm sleeping bag for all seasons',
      category: 'CAMPING_GEAR' as const,
      quantity: 20,
      availableQuantity: 20,
      dailyRate: 5.00,
      weeklyRate: 25.00,
      monthlyRate: 60.00,
      deposit: 20.00,
    },
    {
      name: 'Kayak',
      description: 'Single-person kayak with paddle',
      category: 'RECREATIONAL' as const,
      quantity: 5,
      availableQuantity: 5,
      dailyRate: 25.00,
      weeklyRate: 125.00,
      monthlyRate: 350.00,
      deposit: 100.00,
    },
    {
      name: 'Camping Stove',
      description: 'Portable propane camping stove',
      category: 'KITCHEN' as const,
      quantity: 8,
      availableQuantity: 8,
      dailyRate: 10.00,
      weeklyRate: 50.00,
      monthlyRate: 120.00,
      deposit: 30.00,
    },
  ];

  for (const item of equipmentItems) {
    const existing = await prisma.equipment.findFirst({
      where: { name: item.name },
    });

    if (!existing) {
      await prisma.equipment.create({
        data: item,
      });
    }
  }

  // Create campsite settings
  await prisma.campsiteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Pine Valley Campground',
      description: 'A beautiful campground nestled in the pine valley',
      addressStreet: '123 Campground Road',
      addressCity: 'Pine Valley',
      addressState: 'CA',
      addressZip: '12345',
      addressCountry: 'USA',
      contactPhone: '+1-555-123-4567',
      contactEmail: 'info@pinevalleycampground.com',
      contactWebsite: 'https://pinevalleycampground.com',
      checkInTime: '14:00',
      checkOutTime: '11:00',
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      petPolicy: 'Pets allowed on leash. Maximum 2 pets per site.',
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in.',
      refundPolicy: 'Full refund for cancellations made 48+ hours in advance.',
      hasPool: true,
      hasPlayground: true,
      hasRestrooms: true,
      hasShowers: true,
      hasLaundry: true,
      hasStore: true,
      hasWifi: true,
      allowsPets: true,
      allowsFires: true,
    },
  });

  // sample bookings for 2026
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@campsite.com' } });
  const testUser = await prisma.user.findUnique({ where: { email: 'user@campsite.com' } });
  const tentSite1 = await prisma.site.findFirst({ where: { name: 'Tent Site 1' } });
  const rvSite1 = await prisma.site.findFirst({ where: { name: 'RV Site 1' } });
  const cabin1 = await prisma.site.findFirst({ where: { name: 'Cabin 1' } });

  if (adminUser && testUser && tentSite1 && rvSite1 && cabin1) {
    // Delete existing bookings first
    await prisma.booking.deleteMany({});

    // Booking 1: Confirmed tent booking in January 2026
    await prisma.booking.create({
      data: {
        bookingNumber: 'BK-2026-001',
        userId: testUser.id,
        siteId: tentSite1.id,
        checkInDate: new Date('2026-01-15'),
        checkOutDate: new Date('2026-01-18'),
        adultGuests: 2,
        childGuests: 1,
        petGuests: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalAmount: 75.00,
        paidAmount: 75.00,
        depositAmount: 25.00,
        taxAmount: 5.00,
        discountAmount: 0,
      },
    });

    // Booking 2: Confirmed RV booking in February 2026
    await prisma.booking.create({
      data: {
        bookingNumber: 'BK-2026-002',
        userId: adminUser.id,
        siteId: rvSite1.id,
        checkInDate: new Date('2026-02-10'),
        checkOutDate: new Date('2026-02-15'),
        adultGuests: 4,
        childGuests: 2,
        petGuests: 1,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalAmount: 225.00,
        paidAmount: 225.00,
        depositAmount: 75.00,
        taxAmount: 15.00,
        discountAmount: 0,
      },
    });

    // Booking 3: Pending cabin booking in March 2026
    await prisma.booking.create({
      data: {
        bookingNumber: 'BK-2026-003',
        userId: testUser.id,
        siteId: cabin1.id,
        checkInDate: new Date('2026-03-20'),
        checkOutDate: new Date('2026-03-25'),
        adultGuests: 6,
        childGuests: 2,
        petGuests: 0,
        status: 'PENDING',
        paymentStatus: 'PARTIAL',
        totalAmount: 600.00,
        paidAmount: 200.00,
        depositAmount: 200.00,
        taxAmount: 40.00,
        discountAmount: 0,
      },
    });

    // Booking 4: Confirmed tent booking in April 2026
    await prisma.booking.create({
      data: {
        bookingNumber: 'BK-2026-004',
        userId: testUser.id,
        siteId: tentSite1.id,
        checkInDate: new Date('2026-04-05'),
        checkOutDate: new Date('2026-04-07'),
        adultGuests: 2,
        childGuests: 0,
        petGuests: 1,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalAmount: 50.00,
        paidAmount: 50.00,
        depositAmount: 25.00,
        taxAmount: 3.50,
        discountAmount: 0,
      },
    });

    // Booking 5: Checked in RV booking (current)
    await prisma.booking.create({
      data: {
        bookingNumber: 'BK-2026-005',
        userId: adminUser.id,
        siteId: rvSite1.id,
        checkInDate: new Date('2026-05-01'),
        checkOutDate: new Date('2026-05-05'),
        adultGuests: 3,
        childGuests: 1,
        petGuests: 0,
        status: 'CHECKED_IN',
        paymentStatus: 'PAID',
        totalAmount: 180.00,
        paidAmount: 180.00,
        depositAmount: 60.00,
        taxAmount: 12.00,
        discountAmount: 0,
        checkInTime: new Date('2026-05-01T14:00:00'),
      },
    });

    // Booking 6: Summer cabin booking in July 2026
    await prisma.booking.create({
      data: {
        bookingNumber: 'BK-2026-006',
        userId: testUser.id,
        siteId: cabin1.id,
        checkInDate: new Date('2026-07-15'),
        checkOutDate: new Date('2026-07-22'),
        adultGuests: 8,
        childGuests: 0,
        petGuests: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalAmount: 840.00,
        paidAmount: 840.00,
        depositAmount: 280.00,
        taxAmount: 56.00,
        discountAmount: 0,
      },
    });

    // Get more sites for additional bookings
    const tentSite2 = await prisma.site.findFirst({ where: { name: 'Tent Site 2' } });
    const tentSite3 = await prisma.site.findFirst({ where: { name: 'Tent Site 3' } });
    const rvSite2 = await prisma.site.findFirst({ where: { name: 'RV Site 2' } });
    const rvSite3 = await prisma.site.findFirst({ where: { name: 'RV Site 3' } });
    const cabin2 = await prisma.site.findFirst({ where: { name: 'Cabin 2' } });

    if (tentSite2 && tentSite3 && rvSite2 && rvSite3 && cabin2) {
      // Booking 7: Cancelled tent booking
      await prisma.booking.create({
        data: {
          bookingNumber: 'BK-2026-007',
          userId: testUser.id,
          siteId: tentSite2.id,
          checkInDate: new Date('2026-06-01'),
          checkOutDate: new Date('2026-06-03'),
          adultGuests: 2,
          childGuests: 1,
          petGuests: 0,
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
          totalAmount: 50.00,
          paidAmount: 0,
          depositAmount: 25.00,
          taxAmount: 3.50,
          discountAmount: 0,
          notes: 'Cancelled due to weather concerns',
        },
      });

      // Booking 8: Checked out RV booking (completed)
      await prisma.booking.create({
        data: {
          bookingNumber: 'BK-2026-008',
          userId: adminUser.id,
          siteId: rvSite2.id,
          checkInDate: new Date('2026-04-20'),
          checkOutDate: new Date('2026-04-25'),
          adultGuests: 4,
          childGuests: 2,
          petGuests: 1,
          status: 'CHECKED_OUT',
          paymentStatus: 'PAID',
          totalAmount: 225.00,
          paidAmount: 225.00,
          depositAmount: 75.00,
          taxAmount: 15.00,
          discountAmount: 0,
          checkInTime: new Date('2026-04-20T14:30:00'),
          checkOutTime: new Date('2026-04-25T10:45:00'),
        },
      });

      // Booking 9: Pending tent booking (awaiting payment)
      await prisma.booking.create({
        data: {
          bookingNumber: 'BK-2026-009',
          userId: testUser.id,
          siteId: tentSite3.id,
          checkInDate: new Date('2026-08-10'),
          checkOutDate: new Date('2026-08-15'),
          adultGuests: 3,
          childGuests: 2,
          petGuests: 1,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          totalAmount: 125.00,
          paidAmount: 0,
          depositAmount: 0,
          taxAmount: 8.75,
          discountAmount: 0,
        },
      });

      // Booking 10: Confirmed RV booking for next month
      await prisma.booking.create({
        data: {
          bookingNumber: 'BK-2026-010',
          userId: adminUser.id,
          siteId: rvSite3.id,
          checkInDate: new Date('2026-06-15'),
          checkOutDate: new Date('2026-06-20'),
          adultGuests: 2,
          childGuests: 0,
          petGuests: 0,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          totalAmount: 225.00,
          paidAmount: 225.00,
          depositAmount: 75.00,
          taxAmount: 15.00,
          discountAmount: 25.00,
        },
      });

      // Booking 11: Confirmed cabin booking with partial payment
      await prisma.booking.create({
        data: {
          bookingNumber: 'BK-2026-011',
          userId: testUser.id,
          siteId: cabin2.id,
          checkInDate: new Date('2026-09-01'),
          checkOutDate: new Date('2026-09-07'),
          adultGuests: 6,
          childGuests: 2,
          petGuests: 0,
          status: 'CONFIRMED',
          paymentStatus: 'PARTIAL',
          totalAmount: 720.00,
          paidAmount: 240.00,
          depositAmount: 240.00,
          taxAmount: 48.00,
          discountAmount: 0,
        },
      });

      // Booking 12: Overdue tent booking (payment issue)
      await prisma.booking.create({
        data: {
          bookingNumber: 'BK-2026-012',
          userId: testUser.id,
          siteId: tentSite2.id,
          checkInDate: new Date('2026-05-25'),
          checkOutDate: new Date('2026-05-28'),
          adultGuests: 2,
          childGuests: 0,
          petGuests: 0,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          totalAmount: 75.00,
          paidAmount: 0,
          depositAmount: 25.00,
          taxAmount: 5.25,
          discountAmount: 0,
          notes: 'Payment overdue',
        },
      });

      // Booking 13: Long-term RV booking (2 weeks)
      await prisma.booking.create({
        data: {
          bookingNumber: 'BK-2026-013',
          userId: adminUser.id,
          siteId: rvSite2.id,
          checkInDate: new Date('2026-10-01'),
          checkOutDate: new Date('2026-10-15'),
          adultGuests: 2,
          childGuests: 0,
          petGuests: 1,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          totalAmount: 630.00,
          paidAmount: 630.00,
          depositAmount: 210.00,
          taxAmount: 42.00,
          discountAmount: 50.00,
        },
      });

      // Booking 14: Weekend tent booking
      await prisma.booking.create({
        data: {
          bookingNumber: 'BK-2026-014',
          userId: testUser.id,
          siteId: tentSite3.id,
          checkInDate: new Date('2026-11-20'),
          checkOutDate: new Date('2026-11-22'),
          adultGuests: 4,
          childGuests: 1,
          petGuests: 0,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          totalAmount: 50.00,
          paidAmount: 50.00,
          depositAmount: 25.00,
          taxAmount: 3.50,
          discountAmount: 0,
        },
      });

      // Booking 15: Holiday cabin booking (Christmas)
      await prisma.booking.create({
        data: {
          bookingNumber: 'BK-2026-015',
          userId: adminUser.id,
          siteId: cabin2.id,
          checkInDate: new Date('2026-12-23'),
          checkOutDate: new Date('2026-12-28'),
          adultGuests: 8,
          childGuests: 3,
          petGuests: 0,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          totalAmount: 600.00,
          paidAmount: 600.00,
          depositAmount: 200.00,
          taxAmount: 40.00,
          discountAmount: 0,
        },
      });
    }
  }

  console.log('Database seed completed successfully!');
  console.log('Created:');
  console.log('- Admin user: admin@campsite.com (password: admin123)');
  console.log('- Test user: user@campsite.com (password: user123)');
  console.log('- 18 sites (10 tent, 5 RV, 3 cabin)');
  console.log('- 4 equipment items');
  console.log('- 15 bookings for 2026 (various statuses)');
  console.log('- Campsite settings');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
