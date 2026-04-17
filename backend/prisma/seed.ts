import { PrismaClient, EquipmentCategory, EquipmentItemStatus, EquipmentCondition, ReservationStatus, MaintenanceStatus, MaintenanceType, SiteType, SiteStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting detailed database seed...');

  // 1. CLEANUP
  console.log('Cleaning up existing data...');
  const tablenames = [
    'maintenance_logs',
    'equipment_rentals',
    'equipment_reservations',
    'equipment_items',
    'equipment',
    'bookings',
    'sites',
    'users',
    'campsite_settings'
  ];

  for (const table of tablenames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (error) {
      console.log(`Could not truncate ${table}, likely due to foreign keys or it being empty. Skipping.`);
    }
  }

  // 2. USERS
  console.log('Seeding Users...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@campsite.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
    },
  });

  const staffPassword = await bcrypt.hash('staff123', 10);
  await prisma.user.create({
    data: {
      email: 'staff@campsite.com',
      password: staffPassword,
      firstName: 'Staff',
      lastName: 'Member',
      role: 'STAFF',
      isActive: true,
      isEmailVerified: true,
    },
  });

  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'user@campsite.com',
      password: userPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'CUSTOMER',
      isActive: true,
      isEmailVerified: true,
    },
  });

  // Additional guest users for realistic booking data
  const guestUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'sarah.chen@email.com',
        password: userPassword,
        firstName: 'Sarah',
        lastName: 'Chen',
        role: 'CUSTOMER',
        isActive: true,
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike.johnson@email.com',
        password: userPassword,
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'CUSTOMER',
        isActive: true,
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'emma.wilson@email.com',
        password: userPassword,
        firstName: 'Emma',
        lastName: 'Wilson',
        role: 'CUSTOMER',
        isActive: true,
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'david.brown@email.com',
        password: userPassword,
        firstName: 'David',
        lastName: 'Brown',
        role: 'CUSTOMER',
        isActive: true,
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'lisa.martinez@email.com',
        password: userPassword,
        firstName: 'Lisa',
        lastName: 'Martinez',
        role: 'CUSTOMER',
        isActive: true,
        isEmailVerified: true,
      },
    }),
  ]);

  // 3. SETTINGS
  console.log('Seeding Settings...');
  await prisma.campsiteSettings.create({
    data: {
      name: 'Pine Valley Asset Managed Camp',
      description: 'Advanced campsite with full equipment tracking.',
      addressStreet: '123 Campground Road',
      addressCity: 'Pine Valley',
      addressState: 'CA',
      addressZip: '12345',
      addressCountry: 'USA',
      contactPhone: '+1-555-123-4567',
      contactEmail: 'info@pinevalley.com',
      checkInTime: '14:00',
      checkOutTime: '11:00',
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      petPolicy: 'Pets allowed.',
      cancellationPolicy: 'Standard',
      refundPolicy: 'Standard',
    },
  });

  // 4. SITES (Migrated from frontend/src/services/api/mock-sites.ts)
  console.log('Seeding Sites...');
  const sitesData = [
    // Cabins (2)
    {
      name: 'Lakeside Cabin A',
      type: SiteType.CABIN,
      status: SiteStatus.AVAILABLE,
      capacity: 6,
      description: 'Charming lakeside cabin with stunning water views. Features a private dock, wraparound porch, and modern amenities. Perfect for families or small groups seeking a peaceful retreat.',
      amenities: ['WiFi', 'Kitchen', 'Fireplace', 'BBQ Grill', 'Private Dock', 'Air Conditioning', 'Heating', 'Hot Tub'],
      images: ['/images/sites/cabin-lakeside-1.jpg', '/images/sites/cabin-lakeside-1-interior.jpg'],
      basePrice: 185.00,
      maxVehicles: 2,
      maxTents: 0,
      isPetFriendly: true,
      hasElectricity: true,
      hasWater: true,
      hasSewer: true,
      hasWifi: true,
      sizeLength: 30, sizeWidth: 25, sizeUnit: 'feet',
      latitude: 34.0522, longitude: -118.2437, mapPositionX: 150, mapPositionY: 200,
    },
    {
      name: 'Mountain View Cabin',
      type: SiteType.CABIN,
      status: SiteStatus.OCCUPIED,
      capacity: 8,
      description: 'Spacious mountain cabin with panoramic views of the surrounding peaks. Features a large living area, fully equipped kitchen, and outdoor fire pit. Ideal for larger groups or extended family stays.',
      amenities: ['WiFi', 'Kitchen', 'Fireplace', 'BBQ Grill', 'Fire Pit', 'Air Conditioning', 'Heating', 'Game Room'],
      images: ['/images/sites/cabin-mountain-1.jpg', '/images/sites/cabin-mountain-1-view.jpg'],
      basePrice: 225.00,
      maxVehicles: 3,
      maxTents: 0,
      isPetFriendly: true,
      hasElectricity: true,
      hasWater: true,
      hasSewer: true,
      hasWifi: true,
      sizeLength: 40, sizeWidth: 30, sizeUnit: 'feet',
      latitude: 34.0612, longitude: -118.2537, mapPositionX: 300, mapPositionY: 150,
    },
    // RV Sites (3)
    {
      name: 'Premium RV Spot 1',
      type: SiteType.RV,
      status: SiteStatus.AVAILABLE,
      capacity: 6,
      description: 'Full hookup premium RV site with concrete pad and beautiful lake views. Features 50 amp electrical service, cable TV hookup, and picnic area.',
      amenities: ['Full Hookups', 'Cable TV', 'Picnic Table', 'Fire Ring', '50 Amp Service', 'Paved Pad'],
      images: ['/images/sites/rv-premium-1.jpg'],
      basePrice: 75.00,
      maxVehicles: 1,
      maxTents: 1,
      isPetFriendly: true,
      hasElectricity: true,
      hasWater: true,
      hasSewer: true,
      hasWifi: true,
      sizeLength: 60, sizeWidth: 30, sizeUnit: 'feet',
      latitude: 34.0480, longitude: -118.2550, mapPositionX: 200, mapPositionY: 450,
    },
    {
      name: 'Riverside RV Spot',
      type: SiteType.RV,
      status: SiteStatus.OCCUPIED,
      capacity: 4,
      description: 'Scenic RV site along the creek with partial hookups. Perfect for those who love the sound of running water. Shaded by mature oak trees.',
      amenities: ['Partial Hookups', 'Picnic Table', 'Fire Ring', '30 Amp Service', 'Shade Trees'],
      images: ['/images/sites/rv-riverside-1.jpg'],
      basePrice: 55.00,
      maxVehicles: 1,
      maxTents: 0,
      isPetFriendly: true,
      hasElectricity: true,
      hasWater: true,
      hasSewer: false,
      hasWifi: true,
      sizeLength: 50, sizeWidth: 25, sizeUnit: 'feet',
      latitude: 34.0510, longitude: -118.2480, mapPositionX: 350, mapPositionY: 500,
    },
    {
      name: 'Hilltop RV Spot',
      type: SiteType.RV,
      status: SiteStatus.AVAILABLE,
      capacity: 6,
      description: 'Elevated RV site with sweeping views of the valley below. Full hookups with extra-long pull-through design for larger rigs.',
      amenities: ['Full Hookups', 'Picnic Table', 'Fire Ring', '50 Amp Service', 'Pull-Through', 'Scenic Views'],
      images: ['/images/sites/rv-hilltop-1.jpg'],
      basePrice: 65.00,
      maxVehicles: 2,
      maxTents: 1,
      isPetFriendly: true,
      hasElectricity: true,
      hasWater: true,
      hasSewer: true,
      hasWifi: true,
      sizeLength: 75, sizeWidth: 30, sizeUnit: 'feet',
      latitude: 34.0580, longitude: -118.2620, mapPositionX: 480, mapPositionY: 250,
    },
    // Tent Sites (3)
    {
      name: 'Forest Tent Site A',
      type: SiteType.TENT,
      status: SiteStatus.AVAILABLE,
      capacity: 4,
      description: 'Shaded tent site beneath towering pines. Level ground with fire ring and picnic table. Nearby access to hiking trails.',
      amenities: ['Fire Ring', 'Picnic Table', 'Bear Box', 'Lantern Hook'],
      images: ['/images/sites/tent-forest-1.jpg'],
      basePrice: 35.00,
      maxVehicles: 1,
      maxTents: 2,
      isPetFriendly: true,
      hasElectricity: false,
      hasWater: false,
      hasSewer: false,
      hasWifi: false,
      sizeLength: 30, sizeWidth: 20, sizeUnit: 'feet',
      latitude: 34.0560, longitude: -118.2500, mapPositionX: 100, mapPositionY: 350,
    },
    {
      name: 'Creek Side Tent',
      type: SiteType.TENT,
      status: SiteStatus.OCCUPIED,
      capacity: 2,
      description: 'Intimate tent site right along the creek. Fall asleep to the soothing sounds of running water. Best for couples or solo campers.',
      amenities: ['Fire Ring', 'Picnic Table', 'Creek Access'],
      images: ['/images/sites/tent-creek-1.jpg'],
      basePrice: 30.00,
      maxVehicles: 1,
      maxTents: 1,
      isPetFriendly: false,
      hasElectricity: false,
      hasWater: false,
      hasSewer: false,
      hasWifi: false,
      sizeLength: 20, sizeWidth: 15, sizeUnit: 'feet',
      latitude: 34.0490, longitude: -118.2450, mapPositionX: 250, mapPositionY: 550,
    },
    {
      name: 'Meadow View Tent Site',
      type: SiteType.TENT,
      status: SiteStatus.AVAILABLE,
      capacity: 6,
      description: 'Large tent site overlooking the meadow. Perfect for families or groups with multiple tents. Electric hookup available for charging devices.',
      amenities: ['Fire Ring', 'Picnic Table', 'Bear Box', 'Electric Outlet', 'Meadow Views'],
      images: ['/images/sites/tent-meadow-1.jpg'],
      basePrice: 45.00,
      maxVehicles: 2,
      maxTents: 3,
      isPetFriendly: true,
      hasElectricity: true,
      hasWater: false,
      hasSewer: false,
      hasWifi: false,
      sizeLength: 40, sizeWidth: 30, sizeUnit: 'feet',
      latitude: 34.0570, longitude: -118.2350, mapPositionX: 650, mapPositionY: 200,
    },
  ];

  const siteMap = new Map();

  console.log(`Creating ${sitesData.length} sites...`);

  for (const siteDef of sitesData) {
    const site = await prisma.site.create({
      data: siteDef,
    });
    siteMap.set(site.name, site);
  }
  
  console.log(`Created ${siteMap.size} sites`);

  // 5. EQUIPMENT CATALOG & ITEMS (Migrated from frontend/src/services/api/mock-equipment.ts)
  console.log('Seeding Equipment & Assets...');

  const equipmentCatalog = [
    {
      name: 'Tent (4-person)',
      description: 'Spacious 4-person camping tent with waterproof fly and easy setup. Perfect for family camping.',
      category: EquipmentCategory.CAMPING_GEAR,
      isSerialized: true,
      quantity: 10,
      dailyRate: 15.00,
      weeklyRate: 75.00,
      monthlyRate: 250.00,
      deposit: 50.00,
      images: ['/images/equipment/tent-4p.jpg'],
      specifications: { personCapacity: 4, weightLbs: 8, dimensionsStr: '9x7 ft' },
      manufacturer: 'Coleman',
      modelNumber: 'Sundome-4',
    },
    {
      name: 'Tent (2-person)',
      description: 'Compact 2-person tent ideal for couples or solo campers. Lightweight and easy to carry.',
      category: EquipmentCategory.CAMPING_GEAR,
      isSerialized: true,
      quantity: 15,
      dailyRate: 10.00,
      weeklyRate: 50.00,
      monthlyRate: 150.00,
      deposit: 30.00,
      images: ['/images/equipment/tent-2p.jpg'],
      specifications: { personCapacity: 2, weightLbs: 4, dimensionsStr: '7x5 ft' },
    },
    {
      name: 'Sleeping Bag',
      description: 'Warm sleeping bag rated for 3 seasons. Includes compression sack for easy storage.',
      category: EquipmentCategory.CAMPING_GEAR,
      isSerialized: true,
      quantity: 25,
      dailyRate: 5.00,
      weeklyRate: 25.00,
      monthlyRate: 80.00,
      deposit: 20.00,
      images: ['/images/equipment/sleeping-bag.jpg'],
      specifications: { tempRating: '20F', weightLbs: 3 },
    },
    {
      name: 'Sleeping Pad',
      description: 'Self-inflating sleeping pad for extra comfort. R-value 3.5 for good insulation.',
      category: EquipmentCategory.CAMPING_GEAR,
      isSerialized: true,
      quantity: 20,
      dailyRate: 4.00,
      weeklyRate: 20.00,
      monthlyRate: 60.00,
      deposit: 15.00,
      images: ['/images/equipment/sleeping-pad.jpg'],
      specifications: { rValue: 3.5, thickness: '2.5 inches' },
    },
    {
      name: 'Kayak (Single)',
      description: 'Single-person recreational kayak with paddle included. Great for lake exploration.',
      category: EquipmentCategory.WATER_SPORTS,
      isSerialized: true,
      quantity: 6,
      dailyRate: 35.00,
      weeklyRate: 175.00,
      monthlyRate: 500.00,
      deposit: 150.00,
      images: ['/images/equipment/kayak-single.jpg'],
      specifications: { lengthStr: '10 ft', weightLbs: 45, maxLoad: '275 lbs' },
    },
    {
      name: 'Kayak (Tandem)',
      description: 'Two-person tandem kayak with paddles. Perfect for couples or parent-child adventures.',
      category: EquipmentCategory.WATER_SPORTS,
      isSerialized: true,
      quantity: 4,
      dailyRate: 50.00,
      weeklyRate: 250.00,
      monthlyRate: 700.00,
      deposit: 200.00,
      images: ['/images/equipment/kayak-tandem.jpg'],
      specifications: { lengthStr: '12 ft', weightLbs: 65, maxLoad: '500 lbs' },
    },
    {
      name: 'Canoe',
      description: 'Classic 16-foot canoe for 2-3 people. Includes paddles and life vests.',
      category: EquipmentCategory.WATER_SPORTS,
      isSerialized: true,
      quantity: 4,
      dailyRate: 45.00,
      weeklyRate: 225.00,
      monthlyRate: 650.00,
      deposit: 175.00,
      images: ['/images/equipment/canoe.jpg'],
      specifications: { lengthStr: '16 ft', maxLoad: '3 people / 600 lbs' },
    },
    {
      name: 'Camping Stove',
      description: 'Portable propane camping stove with 2 burners. Includes fuel canister.',
      category: EquipmentCategory.KITCHEN,
      isSerialized: true,
      quantity: 12,
      dailyRate: 10.00,
      weeklyRate: 50.00,
      monthlyRate: 150.00,
      deposit: 40.00,
      images: ['/images/equipment/camp-stove.jpg'],
      specifications: { burners: 2, btu: '20,000' },
    },
    {
      name: 'Cooler (48-quart)',
      description: 'Large cooler with ice retention up to 5 days. Perfect for extended camping trips.',
      category: EquipmentCategory.KITCHEN,
      isSerialized: true,
      quantity: 8,
      dailyRate: 8.00,
      weeklyRate: 40.00,
      monthlyRate: 120.00,
      deposit: 25.00,
      images: ['/images/equipment/cooler.jpg'],
      specifications: { volumeQuarts: 48, iceRetention: '5 days' },
    },
    {
      name: 'Camp Cooking Set',
      description: 'Complete cooking set including pots, pans, utensils, and plates for 4 people.',
      category: EquipmentCategory.KITCHEN,
      isSerialized: true,
      quantity: 10,
      dailyRate: 12.00,
      weeklyRate: 60.00,
      monthlyRate: 180.00,
      deposit: 35.00,
      images: ['/images/equipment/cooking-set.jpg'],
      specifications: { serves: 4, pieces: 15 },
    },
    {
      name: 'LED Lantern',
      description: 'Rechargeable LED lantern with 3 brightness levels. 40-hour battery life.',
      category: EquipmentCategory.CAMPING_GEAR,
      isSerialized: true,
      quantity: 20,
      dailyRate: 3.00,
      weeklyRate: 15.00,
      monthlyRate: 45.00,
      deposit: 10.00,
      images: ['/images/equipment/lantern.jpg'],
      specifications: { lumens: 500, batteryLife: '40 hours' },
    },
    {
      name: 'First Aid Kit',
      description: 'Comprehensive first aid kit suitable for groups up to 10 people. Includes emergency supplies.',
      category: EquipmentCategory.SAFETY,
      isSerialized: true,
      quantity: 15,
      dailyRate: 5.00,
      weeklyRate: 25.00,
      monthlyRate: 75.00,
      deposit: 15.00,
      images: ['/images/equipment/first-aid.jpg'],
      specifications: { items: 150, suitable: 'Up to 10 people' },
    },
    {
      name: 'Fire Extinguisher',
      description: 'Portable fire extinguisher for campfire safety. ABC rated.',
      category: EquipmentCategory.SAFETY,
      isSerialized: true,
      quantity: 10,
      dailyRate: 3.00,
      weeklyRate: 15.00,
      monthlyRate: 45.00,
      deposit: 20.00,
      images: ['/images/equipment/fire-extinguisher.jpg'],
      specifications: { rating: 'ABC', size: '2.5 lbs' },
    },
    {
      name: 'Mountain Bike',
      description: 'Adult mountain bike with 21 speeds. Helmet included. Great for trail riding.',
      category: EquipmentCategory.RECREATIONAL,
      isSerialized: true,
      quantity: 8,
      dailyRate: 25.00,
      weeklyRate: 125.00,
      monthlyRate: 350.00,
      deposit: 100.00,
      images: ['/images/equipment/mountain-bike.jpg'],
      specifications: { speeds: 21, wheelSize: '26 inch', sizes: 'M, L, XL' },
    },
  ];

  const equipmentMap = new Map();

  for (const itemDef of equipmentCatalog) {
    const equip = await prisma.equipment.create({
      data: {
        name: itemDef.name,
        description: itemDef.description,
        category: itemDef.category,
        isSerialized: itemDef.isSerialized,
        quantity: itemDef.quantity,
        dailyRate: itemDef.dailyRate,
        weeklyRate: itemDef.weeklyRate,
        monthlyRate: itemDef.monthlyRate,
        deposit: itemDef.deposit,
        images: itemDef.images,
        specifications: itemDef.specifications as any, // Cast to avoid JSON strict type issues
        manufacturer: itemDef.manufacturer,
        modelNumber: itemDef.modelNumber,
      }
    });

    equipmentMap.set(equip.name, equip);

    // Create Physical Items
    if (itemDef.isSerialized) {
      for (let i = 1; i <= itemDef.quantity; i++) {
        const pDate = new Date(2024, Math.floor(Math.random() * 11), Math.floor(Math.random() * 28) + 1);

        await prisma.equipmentItem.create({
          data: {
            equipmentId: equip.id,
            internalId: `EQ-${equip.id.replace(/-/g, '').substring(0, 12).toUpperCase()}-${String(i).padStart(3, '0')}`,
            status: EquipmentItemStatus.AVAILABLE,
            condition: EquipmentCondition.GOOD,
            purchaseDate: pDate,
            notes: `Initial stock ${i}`,
          }
        });
      }
    }
  }

  // 6. CURRENT MONTH & FUTURE RESERVATIONS
  console.log('Seeding Reservations...');

  const sites = [
    siteMap.get('Lakeside Cabin A'),
    siteMap.get('Mountain View Cabin'),
    siteMap.get('Premium RV Spot 1'),
    siteMap.get('Riverside RV Spot'),
    siteMap.get('Hilltop RV Spot'),
    siteMap.get('Forest Tent Site A'),
    siteMap.get('Creek Side Tent'),
    siteMap.get('Meadow View Tent Site'),
  ];

  const bookingsData = [
    [0, 2026, 3, 10, 14, 'CHECKED_IN', 2],
    [2, 2026, 3, 8, 12, 'CHECKED_IN', 3],
    [1, 2026, 3, 2, 5, 'CHECKED_OUT', 4],
    [3, 2026, 3, 5, 7, 'CHECKED_OUT', 2],
    [0, 2026, 4, 2, 5, 'CONFIRMED', 2],
    [5, 2026, 4, 3, 6, 'CONFIRMED', 3],
    [4, 2026, 4, 4, 7, 'CONFIRMED', 2],
    [6, 2026, 4, 5, 9, 'CONFIRMED', 2],
    [7, 2026, 4, 6, 9, 'CONFIRMED', 4],
    [3, 2026, 4, 8, 11, 'CONFIRMED', 3],
    // June 2026 - Day 10: 4 bookings
    [0, 2026, 5, 8, 12, 'CONFIRMED', 2],
    [2, 2026, 5, 9, 13, 'CONFIRMED', 4],
    [5, 2026, 5, 10, 12, 'PENDING', 3],
    [4, 2026, 5, 10, 14, 'CONFIRMED', 2],
    // June 2026 - Day 15: 5 bookings
    [0, 2026, 5, 14, 17, 'CONFIRMED', 2],
    [1, 2026, 5, 15, 18, 'PENDING', 6],
    [3, 2026, 5, 15, 16, 'CONFIRMED', 3],
    [6, 2026, 5, 13, 17, 'CONFIRMED', 2],
    [7, 2026, 5, 15, 19, 'PENDING', 4],
    // June 2026 - Day 22: 4 bookings
    [2, 2026, 5, 20, 24, 'CONFIRMED', 3],
    [5, 2026, 5, 21, 23, 'PENDING', 2],
    [4, 2026, 5, 22, 25, 'CONFIRMED', 4],
    [6, 2026, 5, 22, 26, 'CONFIRMED', 2],
  ];

  for (let i = 0; i < bookingsData.length; i++) {
    const [siteIdx, year, month, checkInDay, checkOutDay, status, guests] = bookingsData[i] as [number, number, number, number, number, string, number];
    const checkInDate = new Date(year, month, checkInDay);
    const checkOutDate = new Date(year, month, checkOutDay);
    const site = sites[siteIdx];

    // Distribute bookings across different users for realism
    // First 10 bookings use the original user, June bookings use guest users
    const userIndex = i < 10 ? 0 : (i - 10) % guestUsers.length;
    const bookingUser = i < 10 ? user : guestUsers[userIndex]!;

    const totalAmount = 150.00 + Math.random() * 300;
    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `BK-2026-${String(i + 1).padStart(3, '0')}`,
        userId: bookingUser.id,
        siteId: site?.id,
        checkInDate,
        checkOutDate,
        adultGuests: guests,
        childGuests: 0,
        status: status as any,
        paymentStatus: 'PAID',
        totalAmount,
        paidAmount: totalAmount,
        depositAmount: totalAmount * 0.2,
        taxAmount: totalAmount * 0.1,
        discountAmount: 0,
      }
    });

    // Create real guest records for each booking
    const additionalGuestNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda'];
    
    // 1. Add Primary Guest (the User)
    await prisma.guest.create({
      data: {
        bookingId: booking.id,
        firstName: bookingUser.firstName,
        lastName: bookingUser.lastName,
        email: bookingUser.email,
        type: 'ADULT',
        isPrimary: true,
      }
    });

    // 2. Add Additional Guests
    for (let g = 1; g < guests; g++) {
      const gName = additionalGuestNames[(i + g) % additionalGuestNames.length];
      await prisma.guest.create({
        data: {
          bookingId: booking.id,
          firstName: gName!,
          lastName: bookingUser.lastName,
          type: 'ADULT',
          isPrimary: false,
        }
      });
    }
  }

  console.log(`Created ${bookingsData.length} bookings`);

  const kayak = equipmentMap.get('Kayak (Single)');
  const firstBooking = await prisma.booking.findFirst({ where: { bookingNumber: 'BK-2026-001' } });
  if (kayak && firstBooking) {
    await prisma.equipmentReservation.create({
      data: {
        bookingId: firstBooking.id,
        equipmentId: kayak.id,
        quantity: 2,
        startDate: firstBooking.checkInDate,
        endDate: firstBooking.checkOutDate,
        status: ReservationStatus.CONFIRMED,
        dailyRate: kayak.dailyRate,
        totalAmount: kayak.dailyRate * 2 * 3,
      }
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
