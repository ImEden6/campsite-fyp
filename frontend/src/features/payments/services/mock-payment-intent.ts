import { Payment, PaymentIntent, PaymentStatus, PaymentMethod } from '../types/payment.types';

// In-memory store for mock payment intents (to preserve amount/currency for confirmation)
// Entries are cleaned up after retrieval to prevent memory leaks
const mockPaymentIntentStore = new Map<string, { amount: number; currency: string }>();
const MAX_STORE_SIZE = 100; // Safety limit for unclaimed intents

export const createMockPaymentIntent = (amount: number, currency: string): PaymentIntent => {
    const id = `pi_mock_${crypto.randomUUID()}`;
    
    // Cleanup: if store exceeds max size, remove oldest entries
    if (mockPaymentIntentStore.size >= MAX_STORE_SIZE) {
        const firstKey = mockPaymentIntentStore.keys().next().value;
        if (firstKey) mockPaymentIntentStore.delete(firstKey);
    }
    
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
 * Retrieve and consume stored mock payment intent data
 * Entry is deleted after retrieval since payment intents are only confirmed once
 */
export const getMockPaymentIntentData = (paymentIntentId: string): { amount: number; currency: string } | undefined => {
    const data = mockPaymentIntentStore.get(paymentIntentId);
    if (data) {
        mockPaymentIntentStore.delete(paymentIntentId); // Cleanup after use
    }
    return data;
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
