
import { Booking, BookingStatus, PaymentStatus } from '@prisma/client';

export const mockBookings: Booking[] = [
    {
        id: 'booking-001',
        bookingNumber: 'BK-2024-001',
        siteId: 'site-cabin-1',
        userId: 'user-customer',
        checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        checkOutDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        adultGuests: 2,
        childGuests: 2,
        petGuests: 0,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        totalAmount: 450.00,
        paidAmount: 450.00,
        depositAmount: 100.00,
        taxAmount: 36.00,
        discountAmount: 0,
        specialRequests: null,
        notes: null,
        checkInTime: null,
        checkOutTime: null,
        qrCode: null,
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01'),
    }
];

export const getMockBookings = (): Booking[] => mockBookings;
