import { Payment, PaymentStatus, PaymentMethod } from '../types/payment.types';

// Helper to get relative dates for demo
const getDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
};

// Static demo payment history - shows recent payment activity
const demoPaymentHistory: Payment[] = [
    {
        id: 'pay_demo_001',
        bookingId: 'demo-booking-001',
        amount: 37000, // RM370
        currency: 'MYR',
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: 'Lakeside Cabin A - Weekend Stay (Dec 20-22)',
        createdAt: getDaysAgo(3),
        updatedAt: getDaysAgo(3),
        stripePaymentIntentId: 'pi_demo_001'
    },
    {
        id: 'pay_demo_002',
        bookingId: 'demo-booking-002',
        amount: 15000, // RM150
        currency: 'MYR',
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: 'Premium RV Spot 1 - 2 Nights (Dec 18-20)',
        createdAt: getDaysAgo(5),
        updatedAt: getDaysAgo(5),
        stripePaymentIntentId: 'pi_demo_002'
    },
    {
        id: 'pay_demo_003',
        bookingId: 'demo-booking-003',
        amount: 7000, // RM70
        currency: 'MYR',
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: 'Forest Tent Site A - 2 Nights (Dec 15-17)',
        createdAt: getDaysAgo(8),
        updatedAt: getDaysAgo(8),
        stripePaymentIntentId: 'pi_demo_003'
    },
    {
        id: 'pay_demo_004',
        bookingId: 'demo-booking-004',
        amount: 45000, // RM450
        currency: 'MYR',
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: 'Mountain View Cabin - 2 Nights (Dec 10-12)',
        createdAt: getDaysAgo(13),
        updatedAt: getDaysAgo(13),
        stripePaymentIntentId: 'pi_demo_004'
    },
    {
        id: 'pay_demo_005',
        bookingId: 'demo-booking-005',
        amount: 5000, // RM50
        currency: 'MYR',
        status: PaymentStatus.REFUNDED,
        method: PaymentMethod.CARD,
        description: 'Cancelled - Meadow Tent Site (Refunded)',
        createdAt: getDaysAgo(20),
        updatedAt: getDaysAgo(18),
        stripePaymentIntentId: 'pi_demo_005'
    }
];

// In-memory store for payments made during demo session
const sessionPayments: Payment[] = [];

// Storage key for persisting demo payments
const DEMO_PAYMENTS_KEY = 'campsite_demo_payments';

// Load any persisted demo payments from localStorage
const loadPersistedPayments = (): Payment[] => {
    try {
        const stored = localStorage.getItem(DEMO_PAYMENTS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('[MockPayments] Failed to load persisted payments:', e);
    }
    return [];
};

// Initialize session payments from localStorage
sessionPayments.push(...loadPersistedPayments());

/**
 * Add a new payment to the mock payment store (called when mock payment is confirmed)
 */
export const addMockPayment = (payment: Payment): void => {
    sessionPayments.unshift(payment); // Add to beginning (most recent)
    
    // Persist to localStorage
    try {
        localStorage.setItem(DEMO_PAYMENTS_KEY, JSON.stringify(sessionPayments));
    } catch (e) {
        console.warn('[MockPayments] Failed to persist payment:', e);
    }
};

/**
 * Clear all session payments (useful for resetting demo)
 */
export const clearSessionPayments = (): void => {
    sessionPayments.length = 0;
    localStorage.removeItem(DEMO_PAYMENTS_KEY);
};

/**
 * Get payments for a specific booking
 */
export const getMockBookingPayments = (bookingId: string): Payment[] => {
    const allPayments = [...sessionPayments, ...demoPaymentHistory];
    return allPayments
        .filter(p => p.bookingId === bookingId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get full payment history (session payments + demo history)
 */
export const getMockPaymentHistory = (): Payment[] => {
    const allPayments = [...sessionPayments, ...demoPaymentHistory];
    return allPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
