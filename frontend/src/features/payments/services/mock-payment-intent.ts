import { Payment, PaymentIntent, PaymentStatus, PaymentMethod } from '../types/payment.types';

// In-memory store for mock payment intents (to preserve amount/currency for confirmation)
const mockPaymentIntentStore = new Map<string, { amount: number; currency: string }>();

export const createMockPaymentIntent = (amount: number, currency: string): PaymentIntent => {
    const id = `pi_mock_${crypto.randomUUID()}`;
    // Store the payment intent data for later retrieval during confirmation
    mockPaymentIntentStore.set(id, { amount, currency });
    return {
        id,
        amount,
        currency,
        // Use the same id in clientSecret so it can be extracted correctly
        // Format: {payment_intent_id}_secret_{random} (matches Stripe's format)
        clientSecret: `${id}_secret_${crypto.randomUUID()}`,
        status: 'requires_payment_method',
        created: Date.now(),
    };
};

/**
 * Retrieve stored mock payment intent data
 */
export const getMockPaymentIntentData = (paymentIntentId: string): { amount: number; currency: string } | undefined => {
    return mockPaymentIntentStore.get(paymentIntentId);
};

export const createMockConfirmedPayment = (
    paymentIntentId: string,
    bookingId: string | undefined,
    amount: number,
    currency: string
): Payment => {
    return {
        id: `pay_mock_${crypto.randomUUID()}`,
        bookingId: bookingId || 'unknown',
        amount: amount,
        currency: currency,
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: 'Mock Payment Confirmation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stripePaymentIntentId: paymentIntentId,
    };
};
