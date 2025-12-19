import { Payment, PaymentStatus, PaymentMethod } from '../types/payment.types';

// Helper to get relative dates for demo (called dynamically, not at module load)
const getDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
};

// Demo payment templates with relative day offsets (dates computed dynamically)
interface DemoPaymentTemplate {
    id: string;
    bookingId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    method: PaymentMethod;
    description: string;
    createdDaysAgo: number;
    updatedDaysAgo: number;
    stripePaymentIntentId: string;
}

const demoPaymentTemplates: DemoPaymentTemplate[] = [
    {
        id: 'pay_demo_001',
        bookingId: 'demo-booking-001',
        amount: 37000, // RM370
        currency: 'MYR',
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: 'Lakeside Cabin A - Weekend Stay',
        createdDaysAgo: 3,
        updatedDaysAgo: 3,
        stripePaymentIntentId: 'pi_demo_001'
    },
    {
        id: 'pay_demo_002',
        bookingId: 'demo-booking-002',
        amount: 15000, // RM150
        currency: 'MYR',
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: 'Premium RV Spot 1 - 2 Nights',
        createdDaysAgo: 5,
        updatedDaysAgo: 5,
        stripePaymentIntentId: 'pi_demo_002'
    },
    {
        id: 'pay_demo_003',
        bookingId: 'demo-booking-003',
        amount: 7000, // RM70
        currency: 'MYR',
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: 'Forest Tent Site A - 2 Nights',
        createdDaysAgo: 8,
        updatedDaysAgo: 8,
        stripePaymentIntentId: 'pi_demo_003'
    },
    {
        id: 'pay_demo_004',
        bookingId: 'demo-booking-004',
        amount: 45000, // RM450
        currency: 'MYR',
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: 'Mountain View Cabin - 2 Nights',
        createdDaysAgo: 13,
        updatedDaysAgo: 13,
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
        createdDaysAgo: 20,
        updatedDaysAgo: 18,
        stripePaymentIntentId: 'pi_demo_005'
    }
];

/**
 * Generate demo payment history with fresh dates (computed on each call)
 */
const getDemoPaymentHistory = (): Payment[] => {
    return demoPaymentTemplates.map(template => ({
        id: template.id,
        bookingId: template.bookingId,
        amount: template.amount,
        currency: template.currency,
        status: template.status,
        method: template.method,
        description: template.description,
        createdAt: getDaysAgo(template.createdDaysAgo),
        updatedAt: getDaysAgo(template.updatedDaysAgo),
        stripePaymentIntentId: template.stripePaymentIntentId
    }));
};

// In-memory store for payments made during demo session
const sessionPayments: Payment[] = [];

// Storage key for persisting demo payments
const DEMO_PAYMENTS_KEY = 'campsite_demo_payments';

// Load any persisted demo payments from localStorage
const loadPersistedPayments = (): Payment[] => {
    try {
        const stored = localStorage.getItem(DEMO_PAYMENTS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Validate parsed data is actually an array
            if (!Array.isArray(parsed)) {
                console.warn('[MockPayments] Invalid stored payments data (not an array), clearing');
                localStorage.removeItem(DEMO_PAYMENTS_KEY);
                return [];
            }
            return parsed;
        }
    } catch (e) {
        console.warn('[MockPayments] Failed to load persisted payments:', e);
        // Clear corrupted data
        localStorage.removeItem(DEMO_PAYMENTS_KEY);
    }
    return [];
};

// Initialize session payments from localStorage
sessionPayments.push(...loadPersistedPayments());

/**
 * Add a new payment to the mock payment store (called when mock payment is confirmed)
 */
export const addMockPayment = (payment: Payment): void => {
    console.warn('[MockPayments] Adding payment:', payment);
    sessionPayments.unshift(payment); // Add to beginning (most recent)

    // Persist to localStorage
    try {
        localStorage.setItem(DEMO_PAYMENTS_KEY, JSON.stringify(sessionPayments));
        console.warn('[MockPayments] Persisted to localStorage:', sessionPayments.length);
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
    const allPayments = [...sessionPayments, ...getDemoPaymentHistory()];

    console.warn(`[MockPayments] Querying payments for booking: ${bookingId}`);
    console.warn(`[MockPayments] Total payments in store: ${allPayments.length}`);
    console.warn(`[MockPayments] Session payments (in-memory):`, sessionPayments);

    const matched = allPayments.filter(p => p.bookingId === bookingId);
    console.warn(`[MockPayments] Found ${matched.length} matches for ${bookingId}`);

    if (matched.length === 0) {
        // Log potential orphans or mismatches
        const orphans = sessionPayments.filter(p => p.bookingId === 'unknown' || !p.bookingId);
        if (orphans.length > 0) {
            console.warn('[MockPayments] Found potential orphan payments with unknown bookingId:', orphans);
        }
    }

    return matched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get full payment history (session payments + demo history)
 */
export const getMockPaymentHistory = (): Payment[] => {
    const allPayments = [...sessionPayments, ...getDemoPaymentHistory()];
    return allPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Debug helper: get info about mock payment store (for on-screen debugging)
 */
export const getMockPaymentDebugInfo = () => {
    return {
        sessionPaymentsCount: sessionPayments.length,
        sessionPayments: sessionPayments.map(p => ({ id: p.id.slice(0, 12), bookingId: p.bookingId?.slice(0, 12) })),
        localStorageKey: DEMO_PAYMENTS_KEY,
        hasLocalStorage: !!localStorage.getItem(DEMO_PAYMENTS_KEY),
    };
};
