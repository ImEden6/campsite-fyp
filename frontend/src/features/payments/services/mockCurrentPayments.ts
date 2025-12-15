import { Payment, PaymentStatus, PaymentMethod } from '../types/payment.types';

export const mockPayments: Payment[] = [
    {
        id: 'pay_001',
        bookingId: 'booking-001',
        amount: 10000,
        currency: 'MYR',
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: 'Deposit for booking BK-2024-001',
        createdAt: '2024-12-01T10:00:00Z',
        updatedAt: '2024-12-01T10:00:00Z',
        stripePaymentIntentId: 'pi_mock_001'
    },
    {
        id: 'pay_002',
        bookingId: 'booking-001',
        amount: 35000,
        currency: 'MYR',
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: 'Balance for booking BK-2024-001',
        createdAt: '2024-12-05T12:00:00Z',
        updatedAt: '2024-12-05T12:00:00Z',
        stripePaymentIntentId: 'pi_mock_002'
    },
    {
        id: 'pay_003',
        bookingId: 'booking-002',
        amount: 5000,
        currency: 'MYR',
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: 'Deposit for booking BK-2024-002',
        createdAt: '2024-12-05T14:30:00Z',
        updatedAt: '2024-12-05T14:30:00Z',
        stripePaymentIntentId: 'pi_mock_003'
    },
    {
        id: 'pay_004',
        bookingId: 'booking-002',
        amount: 6250,
        currency: 'MYR',
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: 'Partial payment for booking BK-2024-002',
        createdAt: '2024-12-06T09:15:00Z',
        updatedAt: '2024-12-06T09:15:00Z',
        stripePaymentIntentId: 'pi_mock_004'
    },
    {
        id: 'pay_005',
        bookingId: 'booking-003',
        amount: 10500,
        currency: 'MYR',
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: 'Full payment for booking BK-2024-003',
        createdAt: '2024-11-01T08:00:00Z',
        updatedAt: '2024-11-01T08:00:00Z',
        stripePaymentIntentId: 'pi_mock_005'
    }
];

export const getMockBookingPayments = (bookingId: string): Payment[] => {
    return mockPayments.filter(p => p.bookingId === bookingId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getMockPaymentHistory = (): Payment[] => {
    return [...mockPayments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
