
import { Payment, PaymentStatus, PaymentMethod } from '@prisma/client';
import logger from '@/utils/logger';

// Helper to get relative dates for demo
const getDaysAgo = (days: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};

// Demo payment templates
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
    stripePaymentId: string;
}

const demoPaymentTemplates: DemoPaymentTemplate[] = [
    {
        id: 'pay_demo_001',
        bookingId: 'demo-booking-001',
        amount: 370.00,
        currency: 'MYR',
        status: PaymentStatus.PAID,
        method: PaymentMethod.CREDIT_CARD,
        description: 'Lakeside Cabin A - Weekend Stay',
        createdDaysAgo: 3,
        updatedDaysAgo: 3,
        stripePaymentId: 'pi_demo_001'
    },
    {
        id: 'pay_demo_002',
        bookingId: 'demo-booking-002',
        amount: 150.00,
        currency: 'MYR',
        status: PaymentStatus.PAID,
        method: PaymentMethod.CREDIT_CARD,
        description: 'Premium RV Spot 1 - 2 Nights',
        createdDaysAgo: 5,
        updatedDaysAgo: 5,
        stripePaymentId: 'pi_demo_002'
    },
    {
        id: 'pay_demo_003',
        bookingId: 'demo-booking-003',
        amount: 70.00,
        currency: 'MYR',
        status: PaymentStatus.PAID,
        method: PaymentMethod.CREDIT_CARD,
        description: 'Forest Tent Site A - 2 Nights',
        createdDaysAgo: 8,
        updatedDaysAgo: 8,
        stripePaymentId: 'pi_demo_003'
    },
    {
        id: 'pay_demo_004',
        bookingId: 'demo-booking-004',
        amount: 450.00,
        currency: 'MYR',
        status: PaymentStatus.PAID,
        method: PaymentMethod.CREDIT_CARD,
        description: 'Mountain View Cabin - 2 Nights',
        createdDaysAgo: 13,
        updatedDaysAgo: 13,
        stripePaymentId: 'pi_demo_004'
    },
    {
        id: 'pay_demo_005',
        bookingId: 'demo-booking-005',
        amount: 50.00,
        currency: 'MYR',
        status: PaymentStatus.REFUNDED,
        method: PaymentMethod.CREDIT_CARD,
        description: 'Cancelled - Meadow Tent Site (Refunded)',
        createdDaysAgo: 20,
        updatedDaysAgo: 18,
        stripePaymentId: 'pi_demo_005'
    }
];

/**
 * Generate demo payment history
 */
const getDemoPaymentHistory = (): Payment[] => {
    return demoPaymentTemplates.map(template => ({
        id: template.id,
        bookingId: template.bookingId,
        userId: 'demo-user',
        amount: template.amount,
        method: template.method,
        status: template.status,
        stripePaymentId: template.stripePaymentId,
        stripeRefundId: null,
        transactionId: null,
        description: template.description,
        receiptUrl: null,
        processedAt: getDaysAgo(template.updatedDaysAgo),
        refundedAt: template.status === 'REFUNDED' ? getDaysAgo(template.updatedDaysAgo) : null,
        createdAt: getDaysAgo(template.createdDaysAgo),
        updatedAt: getDaysAgo(template.updatedDaysAgo),
    }));
};

// In-memory store for payments made during demo session
const sessionPayments: Payment[] = [];

/**
 * Add a new payment to the mock payment store
 */
export const addMockPayment = (payment: Payment): void => {
    logger.info('[MockPayments Backend] Adding payment:', { id: payment.id });
    sessionPayments.unshift(payment);
};

/**
 * Clear all session payments
 */
export const clearSessionPayments = (): void => {
    sessionPayments.length = 0;
};

/**
 * Get payments for a specific booking
 */
export const getMockBookingPayments = (bookingId: string): Payment[] => {
    const allPayments = [...sessionPayments, ...getDemoPaymentHistory()];
    const matched = allPayments.filter(p => p.bookingId === bookingId);
    return matched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get full payment history
 */
export const getMockPaymentHistory = (): Payment[] => {
    const allPayments = [...sessionPayments, ...getDemoPaymentHistory()];
    return allPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
