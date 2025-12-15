/**
 * Mock Booking Store
 * Persists mock bookings to localStorage for MVP functionality
 * Note: localStorage quota is typically 5MB, sufficient for 100+ bookings
 */
import type { Booking, Vehicle } from '@/types';
import { BookingStatus, PaymentStatus, VehicleType } from '@/types';
import { mockSites } from './mock-sites';
import { mockEquipment } from './mock-equipment';

// Types - imported dynamically to avoid circular dependency
export interface BookingPricing {
    basePrice: number;
    nights: number;
    subtotal: number;
    taxAmount: number;
    depositAmount: number;
    equipmentTotal: number;
    discountAmount: number;
    totalAmount: number;
    breakdown: {
        date: string;
        rate: number;
        description: string;
    }[];
}

export interface CreateBookingData {
    siteId: string;
    checkInDate: string;
    checkOutDate: string;
    guests: {
        adults: number;
        children: number;
        pets: number;
    };
    vehicles: Array<{
        type: string;
        licensePlate: string;
        make: string;
        model: string;
        year: number;
        state: string;
        color: string;
    }>;
    specialRequests?: string;
    equipmentRentals?: {
        equipmentId: string;
        quantity: number;
    }[];
}

const STORAGE_KEY = 'campsite_mock_bookings';
const DATE_FIELDS = ['checkInDate', 'checkOutDate', 'createdAt', 'updatedAt'];

// Utility: JSON date reviver for parsing stored bookings
const dateReviver = (key: string, value: unknown): unknown =>
    DATE_FIELDS.includes(key) && typeof value === 'string' ? new Date(value) : value;

// In-memory cache
const bookingCache: Map<string, Booking> = new Map();

// Load from localStorage on init
const loadFromStorage = (): void => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const bookings: Booking[] = JSON.parse(stored, dateReviver);
            bookings.forEach(b => bookingCache.set(b.id, b));
        }
    } catch (e) {
        console.warn('[MockStore] Failed to load from localStorage:', e);
    }
};

const saveToStorage = (): void => {
    try {
        const bookings = Array.from(bookingCache.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch (e) {
        console.warn('[MockStore] Failed to save to localStorage:', e);
    }
};

// Initialize on module load
loadFromStorage();

/**
 * Calculate mock booking price using actual mock data
 */
export const calculateMockPrice = (
    siteId: string,
    checkInDate: string,
    checkOutDate: string,
    equipmentRentals?: { equipmentId: string; quantity: number }[]
): BookingPricing => {
    const site = mockSites.find(s => s.id === siteId) ?? mockSites[0];
    if (!site) {
        throw new Error('No mock sites available');
    }

    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const nights = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    const basePrice = site.basePrice;
    const subtotal = basePrice * nights;

    // Calculate equipment total using actual mock equipment prices
    let equipmentTotal = 0;
    if (equipmentRentals?.length) {
        equipmentRentals.forEach(rental => {
            const equip = mockEquipment.find(e => e.id === rental.equipmentId);
            if (equip) {
                equipmentTotal += equip.dailyRate * rental.quantity * nights;
            }
        });
    }

    const taxRate = 0.08;
    const taxAmount = Math.round((subtotal + equipmentTotal) * taxRate * 100) / 100;
    const depositAmount = Math.round(subtotal * 0.2 * 100) / 100;

    return {
        basePrice,
        nights,
        subtotal,
        taxAmount,
        depositAmount,
        equipmentTotal,
        discountAmount: 0,
        totalAmount: subtotal + taxAmount + equipmentTotal,
        breakdown: Array.from({ length: nights }, (_, i) => {
            const dateStr = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            return {
                date: dateStr ?? '',
                rate: basePrice,
                description: `Night ${i + 1}`,
            };
        }),
    };
};

/**
 * Create and persist a mock booking
 */
export const createMockBooking = (bookingData: CreateBookingData): Booking => {
    const site = mockSites.find(s => s.id === bookingData.siteId) ?? mockSites[0];
    if (!site) {
        throw new Error('No mock sites available');
    }
    const pricing = calculateMockPrice(
        bookingData.siteId,
        bookingData.checkInDate,
        bookingData.checkOutDate,
        bookingData.equipmentRentals
    );

    // Use crypto.randomUUID for collision-free IDs
    const bookingId = crypto.randomUUID();
    const bookingNumber = `BK-${new Date().getFullYear()}-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

    const booking: Booking = {
        id: bookingId,
        bookingNumber,
        siteId: bookingData.siteId,
        userId: 'mock-user',
        site,
        checkInDate: new Date(bookingData.checkInDate),
        checkOutDate: new Date(bookingData.checkOutDate),
        guests: bookingData.guests,
        vehicles: bookingData.vehicles.map((v, i): Vehicle => ({
            id: `v-${i}`,
            type: v.type as VehicleType,
            licensePlate: v.licensePlate,
            make: v.make,
            model: v.model,
            year: v.year,
            state: v.state,
            color: v.color,
        })),
        status: BookingStatus.CONFIRMED,
        // MVP: Mark as PAID to provide complete confirmation flow without payment integration
        // In production, this would be PENDING until actual payment is processed
        paymentStatus: PaymentStatus.PAID,
        totalAmount: pricing.totalAmount,
        paidAmount: pricing.totalAmount,
        depositAmount: pricing.depositAmount,
        taxAmount: pricing.taxAmount,
        discountAmount: 0,
        specialRequests: bookingData.specialRequests,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    bookingCache.set(bookingId, booking);
    saveToStorage();

    return booking;
};

/**
 * Get a mock booking by ID
 */
export const getMockBooking = (id: string): Booking | undefined => {
    return bookingCache.get(id);
};

/**
 * Get all mock bookings
 */
export const getAllMockBookings = (): Booking[] => {
    return Array.from(bookingCache.values());
};

/**
 * Check if we're using mock data (for UI indicator)
 */
let usingMockData = false;
export const setUsingMockData = (value: boolean) => {
    usingMockData = value;
};
export const isUsingMockData = () => usingMockData;
