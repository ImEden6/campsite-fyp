import { PrismaClient, EquipmentCategory, EquipmentItemStatus, EquipmentCondition, ReservationStatus, MaintenanceStatus, MaintenanceType, SiteType, SiteStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
console.log('Database URL available:', !!connectionString);

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
    // Cabins
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
    {
      name: 'Sunset Cabin',
      type: SiteType.CABIN,
      status: SiteStatus.AVAILABLE,
      capacity: 4,
      description: 'Cozy cabin perfect for couples or small families. West-facing windows offer spectacular sunset views. Features a queen bed loft and pull-out sofa.',
      amenities: ['WiFi', 'Kitchenette', 'Fireplace', 'BBQ Grill', 'Patio', 'Heating'],
      images: ['/images/sites/cabin-sunset-1.jpg'],
      basePrice: 145.00,
      maxVehicles: 1,
      maxTents: 0,
      isPetFriendly: false,
      hasElectricity: true,
      hasWater: true,
      hasSewer: true,
      hasWifi: true,
      sizeLength: 24, sizeWidth: 20, sizeUnit: 'feet',
      latitude: 34.0502, longitude: -118.2600, mapPositionX: 450, mapPositionY: 300,
    },
    {
      name: 'Forest Retreat Cabin',
      type: SiteType.CABIN,
      status: SiteStatus.MAINTENANCE,
      capacity: 6,
      description: 'Secluded cabin nestled deep in the forest. Offers complete privacy and connection with nature. Recently renovated with modern fixtures while maintaining rustic charm.',
      amenities: ['WiFi', 'Kitchen', 'Fireplace', 'Outdoor Shower', 'Hammocks', 'Heating'],
      images: ['/images/sites/cabin-forest-1.jpg'],
      basePrice: 175.00,
      maxVehicles: 2,
      maxTents: 0,
      isPetFriendly: true,
      hasElectricity: true,
      hasWater: true,
      hasSewer: true,
      hasWifi: true,
      sizeLength: 28, sizeWidth: 22, sizeUnit: 'feet',
      latitude: 34.0650, longitude: -118.2400, mapPositionX: 550, mapPositionY: 400,
    },
    // RV Sites
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
    {
      name: 'Meadow RV Site',
      type: SiteType.RV,
      status: SiteStatus.AVAILABLE,
      capacity: 4,
      description: 'Open meadow RV site surrounded by wildflowers in season. Basic hookups with water and electric. Great for stargazing.',
      amenities: ['Water Hookup', 'Electric Hookup', 'Picnic Table', 'Fire Ring', '30 Amp Service'],
      images: ['/images/sites/rv-meadow-1.jpg'],
      basePrice: 45.00,
      maxVehicles: 1,
      maxTents: 1,
      isPetFriendly: true,
      hasElectricity: true,
      hasWater: true,
      hasSewer: false,
      hasWifi: false,
      sizeLength: 55, sizeWidth: 25, sizeUnit: 'feet',
      latitude: 34.0545, longitude: -118.2380, mapPositionX: 600, mapPositionY: 350,
    },
    // Tent Sites
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
    {
      name: 'Wilderness Tent Site',
      type: SiteType.TENT,
      status: SiteStatus.AVAILABLE,
      capacity: 4,
      description: 'Remote back-country style tent site for adventurous campers. Minimal amenities for a truly unplugged experience. Short hike from parking area.',
      amenities: ['Fire Ring', 'Bear Box'],
      images: ['/images/sites/tent-wilderness-1.jpg'],
      basePrice: 25.00,
      maxVehicles: 1,
      maxTents: 2,
      isPetFriendly: false,
      hasElectricity: false,
      hasWater: false,
      hasSewer: false,
      hasWifi: false,
      sizeLength: 25, sizeWidth: 20, sizeUnit: 'feet',
      latitude: 34.0620, longitude: -118.2300, mapPositionX: 700, mapPositionY: 100,
    },
    {
      name: 'Family Tent Site',
      type: SiteType.TENT,
      status: SiteStatus.AVAILABLE,
      capacity: 8,
      description: 'Extra-large tent site designed for family camping. Close to restrooms and playground. Multiple tent pads with shared fire pit area.',
      amenities: ['Fire Ring', 'Picnic Table', 'Bear Box', 'Near Restrooms', 'Near Playground'],
      images: ['/images/sites/tent-family-1.jpg'],
      basePrice: 50.00,
      maxVehicles: 2,
      maxTents: 4,
      isPetFriendly: true,
      hasElectricity: false,
      hasWater: true,
      hasSewer: false,
      hasWifi: false,
      sizeLength: 50, sizeWidth: 40, sizeUnit: 'feet',
      latitude: 34.0530, longitude: -118.2420, mapPositionX: 180, mapPositionY: 300,
    },
  ];

  const siteMap = new Map();

  for (const siteDef of sitesData) {
    const site = await prisma.site.create({
      data: siteDef,
    });
    siteMap.set(site.name, site);
  }

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

  // 6. FUTURE RESERVATIONS & RENTALS
  console.log('Seeding Reservations...');
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 1);
  const futureEnd = new Date(futureDate);
  futureEnd.setDate(futureEnd.getDate() + 3);

  const booking1 = await prisma.booking.create({
    data: {
      bookingNumber: 'BK-2026-FUTURE-01',
      userId: user.id,
      siteId: siteMap.get('Lakeside Cabin A')?.id || (await prisma.site.findFirst())?.id,
      checkInDate: futureDate,
      checkOutDate: futureEnd,
      adultGuests: 2, childGuests: 0,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      totalAmount: 500.00,
    }
  });

  const kayak = equipmentMap.get('Kayak (Single)');
  if (kayak) {
    await prisma.equipmentReservation.create({
      data: {
        bookingId: booking1.id,
        equipmentId: kayak.id,
        quantity: 2,
        startDate: futureDate,
        endDate: futureEnd,
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
