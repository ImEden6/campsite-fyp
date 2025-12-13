/**
 * Mock Bookings Data
 * Provides realistic mock booking data for local development when API is unavailable
 */

import { Booking, BookingStatus, PaymentStatus, SiteType, SiteStatus, MeasurementUnit, VehicleType } from '@/types';

/**
 * Mock Bookings Collection
 * Contains sample customer bookings for testing
 */
export const mockBookings: Booking[] = [
    {
        id: 'booking-001',
        bookingNumber: 'BK-2024-001',
        siteId: 'site-001',
        userId: 'customer-001',
        site: {
            id: 'site-001',
            name: 'Lakeside Retreat',
            type: SiteType.CABIN,
            status: SiteStatus.AVAILABLE,
            basePrice: 150,
            capacity: 6,
            description: 'Beautiful cabin with lake view',
            size: { length: 30, width: 20, unit: MeasurementUnit.FEET },
            amenities: ['WiFi', 'Kitchen', 'Hot Tub'],
            hasElectricity: true,
            hasWater: true,
            hasSewer: true,
            hasWifi: true,
            isPetFriendly: true,
            maxVehicles: 2,
            maxTents: 0,
            images: ['/images/cabin-lakeside.jpg'],
            location: { latitude: 0, longitude: 0, mapPosition: { x: 100, y: 100 } },
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-12-01'),
        },
        checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        checkOutDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        guests: { adults: 2, children: 2, pets: 1 },
        vehicles: [{ id: 'v1', type: VehicleType.CAR, licensePlate: 'ABC-1234', make: 'Toyota', model: 'Camry', year: 2020, state: 'CA', color: 'Silver' }],
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        totalAmount: 450,
        paidAmount: 450,
        depositAmount: 100,
        taxAmount: 36,
        discountAmount: 0,
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01'),
    },
    {
        id: 'booking-002',
        bookingNumber: 'BK-2024-002',
        siteId: 'site-002',
        userId: 'customer-001',
        site: {
            id: 'site-002',
            name: 'Mountain View RV Spot',
            type: SiteType.RV,
            status: SiteStatus.AVAILABLE,
            basePrice: 75,
            capacity: 4,
            description: 'Full hookup RV site with mountain views',
            size: { length: 40, width: 15, unit: MeasurementUnit.FEET },
            amenities: ['Full Hookups', 'Fire Pit', 'Picnic Table'],
            hasElectricity: true,
            hasWater: true,
            hasSewer: true,
            hasWifi: true,
            isPetFriendly: true,
            maxVehicles: 1,
            maxTents: 0,
            images: ['/images/rv-mountain.jpg'],
            location: { latitude: 0, longitude: 0, mapPosition: { x: 200, y: 150 } },
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-12-01'),
        },
        checkInDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        checkOutDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000), // 17 days from now
        guests: { adults: 2, children: 0, pets: 0 },
        vehicles: [{ id: 'v2', type: VehicleType.RV, licensePlate: 'RV-5678', make: 'Winnebago', model: 'Vista', year: 2021, state: 'OR', color: 'White' }],
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PARTIAL,
        totalAmount: 225,
        paidAmount: 112.50,
        depositAmount: 50,
        taxAmount: 18,
        discountAmount: 0,
        createdAt: new Date('2024-12-05'),
        updatedAt: new Date('2024-12-05'),
    },
    {
        id: 'booking-003',
        bookingNumber: 'BK-2024-003',
        siteId: 'site-003',
        userId: 'customer-001',
        site: {
            id: 'site-003',
            name: 'Forest Tent Site A',
            type: SiteType.TENT,
            status: SiteStatus.AVAILABLE,
            basePrice: 35,
            capacity: 4,
            description: 'Secluded tent site surrounded by pine trees',
            size: { length: 20, width: 20, unit: MeasurementUnit.FEET },
            amenities: ['Fire Ring', 'Picnic Table', 'Bear Box'],
            hasElectricity: false,
            hasWater: false,
            hasSewer: false,
            hasWifi: false,
            isPetFriendly: true,
            maxVehicles: 1,
            maxTents: 2,
            images: ['/images/tent-forest.jpg'],
            location: { latitude: 0, longitude: 0, mapPosition: { x: 300, y: 200 } },
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-12-01'),
        },
        checkInDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        checkOutDate: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000), // 27 days ago
        guests: { adults: 2, children: 1, pets: 0 },
        vehicles: [{ id: 'v3', type: VehicleType.CAR, licensePlate: 'XYZ-9012', make: 'Honda', model: 'CR-V', year: 2019, state: 'WA', color: 'Blue' }],
        status: BookingStatus.CHECKED_OUT,
        paymentStatus: PaymentStatus.PAID,
        totalAmount: 105,
        paidAmount: 105,
        depositAmount: 25,
        taxAmount: 8,
        discountAmount: 0,
        createdAt: new Date('2024-11-01'),
        updatedAt: new Date('2024-11-28'),
    },
];

/**
 * Get all mock bookings for a customer
 */
export const getMockMyBookings = (): Booking[] => mockBookings;

/**
 * Get upcoming mock bookings (future check-in dates)
 */
export const getMockUpcomingBookings = (): Booking[] => {
    const now = new Date();
    return mockBookings.filter(
        (b) => new Date(b.checkInDate) > now && b.status !== BookingStatus.CANCELLED
    );
};

/**
 * Get booking history (past bookings)
 */
export const getMockBookingHistory = (): Booking[] => {
    const now = new Date();
    return mockBookings.filter(
        (b) => new Date(b.checkOutDate) < now || b.status === BookingStatus.CHECKED_OUT
    );
};
