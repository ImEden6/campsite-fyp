/**
 * Mock Equipment Data
 * Provides realistic mock equipment data for local development when API is unavailable
 */

import { Equipment, EquipmentCategory, EquipmentStatus } from '@/types';
import type { EquipmentWithAvailability } from './equipment';

/**
 * Mock Equipment Collection
 * Contains various rental equipment items
 */
export const mockEquipment: Equipment[] = [
    {
        id: 'equip-tent-4p',
        name: 'Tent (4-person)',
        description: 'Spacious 4-person camping tent with waterproof fly and easy setup. Perfect for family camping.',
        category: EquipmentCategory.CAMPING_GEAR,
        status: EquipmentStatus.AVAILABLE,
        quantity: 10,
        availableQuantity: 8,
        dailyRate: 15.00,
        weeklyRate: 75.00,
        monthlyRate: 250.00,
        deposit: 50.00,
        images: ['/images/equipment/tent-4p.jpg'],
        specifications: { personCapacity: 4, weightLbs: 8, dimensionsStr: '9x7 ft' },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-11-20'),
    },
    {
        id: 'equip-tent-2p',
        name: 'Tent (2-person)',
        description: 'Compact 2-person tent ideal for couples or solo campers. Lightweight and easy to carry.',
        category: EquipmentCategory.CAMPING_GEAR,
        status: EquipmentStatus.AVAILABLE,
        quantity: 15,
        availableQuantity: 12,
        dailyRate: 10.00,
        weeklyRate: 50.00,
        monthlyRate: 150.00,
        deposit: 30.00,
        images: ['/images/equipment/tent-2p.jpg'],
        specifications: { personCapacity: 2, weightLbs: 4, dimensionsStr: '7x5 ft' },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-11-20'),
    },
    {
        id: 'equip-sleeping-bag',
        name: 'Sleeping Bag',
        description: 'Warm sleeping bag rated for 3 seasons. Includes compression sack for easy storage.',
        category: EquipmentCategory.CAMPING_GEAR,
        status: EquipmentStatus.AVAILABLE,
        quantity: 25,
        availableQuantity: 20,
        dailyRate: 5.00,
        weeklyRate: 25.00,
        monthlyRate: 80.00,
        deposit: 20.00,
        images: ['/images/equipment/sleeping-bag.jpg'],
        specifications: { tempRating: '20F', weightLbs: 3 },
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-10-15'),
    },
    {
        id: 'equip-sleeping-pad',
        name: 'Sleeping Pad',
        description: 'Self-inflating sleeping pad for extra comfort. R-value 3.5 for good insulation.',
        category: EquipmentCategory.CAMPING_GEAR,
        status: EquipmentStatus.AVAILABLE,
        quantity: 20,
        availableQuantity: 18,
        dailyRate: 4.00,
        weeklyRate: 20.00,
        monthlyRate: 60.00,
        deposit: 15.00,
        images: ['/images/equipment/sleeping-pad.jpg'],
        specifications: { rValue: 3.5, thickness: '2.5 inches' },
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-11-10'),
    },
    {
        id: 'equip-kayak',
        name: 'Kayak (Single)',
        description: 'Single-person recreational kayak with paddle included. Great for lake exploration.',
        category: EquipmentCategory.RECREATIONAL,
        status: EquipmentStatus.AVAILABLE,
        quantity: 6,
        availableQuantity: 4,
        dailyRate: 35.00,
        weeklyRate: 175.00,
        monthlyRate: 500.00,
        deposit: 150.00,
        images: ['/images/equipment/kayak-single.jpg'],
        specifications: { lengthStr: '10 ft', weightLbs: 45, maxLoad: '275 lbs' },
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-12-01'),
    },
    {
        id: 'equip-kayak-tandem',
        name: 'Kayak (Tandem)',
        description: 'Two-person tandem kayak with paddles. Perfect for couples or parent-child adventures.',
        category: EquipmentCategory.RECREATIONAL,
        status: EquipmentStatus.AVAILABLE,
        quantity: 4,
        availableQuantity: 3,
        dailyRate: 50.00,
        weeklyRate: 250.00,
        monthlyRate: 700.00,
        deposit: 200.00,
        images: ['/images/equipment/kayak-tandem.jpg'],
        specifications: { lengthStr: '12 ft', weightLbs: 65, maxLoad: '500 lbs' },
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-11-25'),
    },
    {
        id: 'equip-canoe',
        name: 'Canoe',
        description: 'Classic 16-foot canoe for 2-3 people. Includes paddles and life vests.',
        category: EquipmentCategory.RECREATIONAL,
        status: EquipmentStatus.AVAILABLE,
        quantity: 4,
        availableQuantity: 3,
        dailyRate: 45.00,
        weeklyRate: 225.00,
        monthlyRate: 650.00,
        deposit: 175.00,
        images: ['/images/equipment/canoe.jpg'],
        specifications: { lengthStr: '16 ft', maxLoad: '3 people / 600 lbs' },
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-10-20'),
    },
    {
        id: 'equip-camp-stove',
        name: 'Camping Stove',
        description: 'Portable propane camping stove with 2 burners. Includes fuel canister.',
        category: EquipmentCategory.KITCHEN,
        status: EquipmentStatus.AVAILABLE,
        quantity: 12,
        availableQuantity: 10,
        dailyRate: 10.00,
        weeklyRate: 50.00,
        monthlyRate: 150.00,
        deposit: 40.00,
        images: ['/images/equipment/camp-stove.jpg'],
        specifications: { burners: 2, btu: '20,000' },
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-11-05'),
    },
    {
        id: 'equip-cooler',
        name: 'Cooler (48-quart)',
        description: 'Large cooler with ice retention up to 5 days. Perfect for extended camping trips.',
        category: EquipmentCategory.KITCHEN,
        status: EquipmentStatus.AVAILABLE,
        quantity: 8,
        availableQuantity: 6,
        dailyRate: 8.00,
        weeklyRate: 40.00,
        monthlyRate: 120.00,
        deposit: 25.00,
        images: ['/images/equipment/cooler.jpg'],
        specifications: { volumeQuarts: 48, iceRetention: '5 days' },
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-10-30'),
    },
    {
        id: 'equip-cooking-set',
        name: 'Camp Cooking Set',
        description: 'Complete cooking set including pots, pans, utensils, and plates for 4 people.',
        category: EquipmentCategory.KITCHEN,
        status: EquipmentStatus.AVAILABLE,
        quantity: 10,
        availableQuantity: 8,
        dailyRate: 12.00,
        weeklyRate: 60.00,
        monthlyRate: 180.00,
        deposit: 35.00,
        images: ['/images/equipment/cooking-set.jpg'],
        specifications: { serves: 4, pieces: 15 },
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-11-15'),
    },
    {
        id: 'equip-lantern',
        name: 'LED Lantern',
        description: 'Rechargeable LED lantern with 3 brightness levels. 40-hour battery life.',
        category: EquipmentCategory.CAMPING_GEAR,
        status: EquipmentStatus.AVAILABLE,
        quantity: 20,
        availableQuantity: 18,
        dailyRate: 3.00,
        weeklyRate: 15.00,
        monthlyRate: 45.00,
        deposit: 10.00,
        images: ['/images/equipment/lantern.jpg'],
        specifications: { lumens: 500, batteryLife: '40 hours' },
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-11-01'),
    },
    {
        id: 'equip-first-aid',
        name: 'First Aid Kit',
        description: 'Comprehensive first aid kit suitable for groups up to 10 people. Includes emergency supplies.',
        category: EquipmentCategory.SAFETY,
        status: EquipmentStatus.AVAILABLE,
        quantity: 15,
        availableQuantity: 14,
        dailyRate: 5.00,
        weeklyRate: 25.00,
        monthlyRate: 75.00,
        deposit: 15.00,
        images: ['/images/equipment/first-aid.jpg'],
        specifications: { items: 150, suitable: 'Up to 10 people' },
        createdAt: new Date('2024-01-30'),
        updatedAt: new Date('2024-10-25'),
    },
    {
        id: 'equip-fire-extinguisher',
        name: 'Fire Extinguisher',
        description: 'Portable fire extinguisher for campfire safety. ABC rated.',
        category: EquipmentCategory.SAFETY,
        status: EquipmentStatus.AVAILABLE,
        quantity: 10,
        availableQuantity: 10,
        dailyRate: 3.00,
        weeklyRate: 15.00,
        monthlyRate: 45.00,
        deposit: 20.00,
        images: ['/images/equipment/fire-extinguisher.jpg'],
        specifications: { rating: 'ABC', size: '2.5 lbs' },
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-09-15'),
    },
    {
        id: 'equip-bike',
        name: 'Mountain Bike',
        description: 'Adult mountain bike with 21 speeds. Helmet included. Great for trail riding.',
        category: EquipmentCategory.RECREATIONAL,
        status: EquipmentStatus.AVAILABLE,
        quantity: 8,
        availableQuantity: 5,
        dailyRate: 25.00,
        weeklyRate: 125.00,
        monthlyRate: 350.00,
        deposit: 100.00,
        images: ['/images/equipment/mountain-bike.jpg'],
        specifications: { speeds: 21, wheelSize: '26 inch', sizes: 'M, L, XL' },
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-12-05'),
    },
];

/**
 * Get all mock equipment
 */
export const getMockEquipment = (): Equipment[] => mockEquipment;

/**
 * Get mock equipment by ID
 */
export const getMockEquipmentById = (id: string): Equipment | undefined => {
    return mockEquipment.find(eq => eq.id === id);
};

/**
 * Get mock equipment by category
 */
export const getMockEquipmentByCategory = (category: EquipmentCategory): Equipment[] => {
    return mockEquipment.filter(eq => eq.category === category);
};

/**
 * Get mock equipment with availability (for EquipmentSelector)
 */
export const getMockEquipmentWithAvailability = (): EquipmentWithAvailability[] => {
    return mockEquipment.map(eq => ({
        ...eq,
        available: eq.availableQuantity > 0,
        conflictingBookings: [],
    }));
};

/**
 * Get available mock equipment
 */
export const getAvailableMockEquipment = (): Equipment[] => {
    return mockEquipment.filter(eq => eq.status === EquipmentStatus.AVAILABLE && eq.availableQuantity > 0);
};

/**
 * Get mock equipment statistics
 */
export const getMockEquipmentStats = () => {
    const total = mockEquipment.reduce((sum, eq) => sum + eq.quantity, 0);
    const available = mockEquipment.reduce((sum, eq) => sum + eq.availableQuantity, 0);
    const rented = total - available;

    const byCategory = {
        campingGear: mockEquipment.filter(eq => eq.category === EquipmentCategory.CAMPING_GEAR).length,
        kitchen: mockEquipment.filter(eq => eq.category === EquipmentCategory.KITCHEN).length,
        recreational: mockEquipment.filter(eq => eq.category === EquipmentCategory.RECREATIONAL).length,
        safety: mockEquipment.filter(eq => eq.category === EquipmentCategory.SAFETY).length,
    };

    return {
        totalItems: mockEquipment.length,
        totalQuantity: total,
        available,
        rented,
        utilizationRate: total > 0 ? ((rented / total) * 100).toFixed(1) : '0',
        byCategory,
    };
};
