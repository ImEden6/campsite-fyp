/**
 * Mock Sites Data
 * Provides realistic mock site data for local development when API is unavailable
 */

import { Site, SiteType, SiteStatus, MeasurementUnit } from '@/types';

/**
 * Mock Sites Collection
 * Contains a variety of site types (Cabins, RV, Tent) with realistic data
 */
export const mockSites: Site[] = [
    // ============================================================================
    // Cabins
    // ============================================================================
    {
        id: 'site-cabin-1',
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
        size: { length: 30, width: 25, unit: MeasurementUnit.FEET },
        location: { latitude: 34.0522, longitude: -118.2437, mapPosition: { x: 150, y: 200 } },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-11-20'),
    },
    {
        id: 'site-cabin-2',
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
        size: { length: 40, width: 30, unit: MeasurementUnit.FEET },
        location: { latitude: 34.0612, longitude: -118.2537, mapPosition: { x: 300, y: 150 } },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-12-05'),
    },
    {
        id: 'site-cabin-3',
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
        size: { length: 24, width: 20, unit: MeasurementUnit.FEET },
        location: { latitude: 34.0502, longitude: -118.2600, mapPosition: { x: 450, y: 300 } },
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-10-15'),
    },
    {
        id: 'site-cabin-4',
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
        size: { length: 28, width: 22, unit: MeasurementUnit.FEET },
        location: { latitude: 34.0650, longitude: -118.2400, mapPosition: { x: 550, y: 400 } },
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-12-08'),
    },

    // ============================================================================
    // RV Sites
    // ============================================================================
    {
        id: 'site-rv-1',
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
        size: { length: 60, width: 30, unit: MeasurementUnit.FEET },
        location: { latitude: 34.0480, longitude: -118.2550, mapPosition: { x: 200, y: 450 } },
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-11-10'),
    },
    {
        id: 'site-rv-2',
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
        size: { length: 50, width: 25, unit: MeasurementUnit.FEET },
        location: { latitude: 34.0510, longitude: -118.2480, mapPosition: { x: 350, y: 500 } },
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-12-01'),
    },
    {
        id: 'site-rv-3',
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
        size: { length: 75, width: 30, unit: MeasurementUnit.FEET },
        location: { latitude: 34.0580, longitude: -118.2620, mapPosition: { x: 480, y: 250 } },
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-11-25'),
    },
    {
        id: 'site-rv-4',
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
        size: { length: 55, width: 25, unit: MeasurementUnit.FEET },
        location: { latitude: 34.0545, longitude: -118.2380, mapPosition: { x: 600, y: 350 } },
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-10-20'),
    },

    // ============================================================================
    // Tent Sites
    // ============================================================================
    {
        id: 'site-tent-1',
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
        size: { length: 30, width: 20, unit: MeasurementUnit.FEET },
        location: { latitude: 34.0560, longitude: -118.2500, mapPosition: { x: 100, y: 350 } },
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-11-30'),
    },
    {
        id: 'site-tent-2',
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
        size: { length: 20, width: 15, unit: MeasurementUnit.FEET },
        location: { latitude: 34.0490, longitude: -118.2450, mapPosition: { x: 250, y: 550 } },
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-12-03'),
    },
    {
        id: 'site-tent-3',
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
        size: { length: 40, width: 30, unit: MeasurementUnit.FEET },
        location: { latitude: 34.0570, longitude: -118.2350, mapPosition: { x: 650, y: 200 } },
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-11-15'),
    },
    {
        id: 'site-tent-4',
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
        size: { length: 25, width: 20, unit: MeasurementUnit.FEET },
        location: { latitude: 34.0620, longitude: -118.2300, mapPosition: { x: 700, y: 100 } },
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-10-30'),
    },
    {
        id: 'site-tent-5',
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
        size: { length: 50, width: 40, unit: MeasurementUnit.FEET },
        location: { latitude: 34.0530, longitude: -118.2420, mapPosition: { x: 180, y: 300 } },
        createdAt: new Date('2024-04-01'),
        updatedAt: new Date('2024-11-05'),
    },
];

/**
 * Get all mock sites
 */
export const getMockSites = (): Site[] => mockSites;

/**
 * Get mock site by ID
 */
export const getMockSiteById = (id: string): Site | undefined => {
    return mockSites.find(site => site.id === id);
};

/**
 * Get mock sites by type
 */
export const getMockSitesByType = (type: SiteType): Site[] => {
    return mockSites.filter(site => site.type === type);
};

/**
 * Get mock sites by status
 */
export const getMockSitesByStatus = (status: SiteStatus): Site[] => {
    return mockSites.filter(site => site.status === status);
};

/**
 * Get available mock sites
 */
export const getAvailableMockSites = (): Site[] => {
    return mockSites.filter(site => site.status === SiteStatus.AVAILABLE);
};

/**
 * Get mock site statistics
 */
export const getMockSiteStats = () => {
    const total = mockSites.length;
    const available = mockSites.filter(s => s.status === SiteStatus.AVAILABLE).length;
    const occupied = mockSites.filter(s => s.status === SiteStatus.OCCUPIED).length;
    const maintenance = mockSites.filter(s => s.status === SiteStatus.MAINTENANCE).length;
    const outOfService = mockSites.filter(s => s.status === SiteStatus.OUT_OF_SERVICE).length;

    const cabins = mockSites.filter(s => s.type === SiteType.CABIN).length;
    const rvSites = mockSites.filter(s => s.type === SiteType.RV).length;
    const tentSites = mockSites.filter(s => s.type === SiteType.TENT).length;

    return {
        total,
        byStatus: { available, occupied, maintenance, outOfService },
        byType: { cabins, rvSites, tentSites },
        occupancyRate: total > 0 ? (occupied / total) * 100 : 0,
    };
};
