import { Payment, PaymentIntent, PaymentStatus, PaymentMethod } from '../types/payment.types';
import { addMockPayment } from './mockCurrentPayments';
import { updateMockBookingPayment } from '@/services/api/mockBookingStore';

// In-memory store for mock payment intents (to preserve amount/currency for confirmation)
// Entries are cleaned up after retrieval to prevent memory leaks
const mockPaymentIntentStore = new Map<string, { amount: number; currency: string; bookingId?: string; description?: string }>();
const MAX_STORE_SIZE = 100; // Safety limit for unclaimed intents

export const createMockPaymentIntent = (
    amount: number,
    currency: string,
    bookingId?: string,
    description?: string
): PaymentIntent => {
    const id = `pi_mock_${crypto.randomUUID()}`;

    // Cleanup: if store exceeds max size, remove oldest entries
    if (mockPaymentIntentStore.size >= MAX_STORE_SIZE) {
        const firstKey = mockPaymentIntentStore.keys().next().value;
        if (firstKey) mockPaymentIntentStore.delete(firstKey);
    }

    // Store the payment intent data for later retrieval during confirmation
    mockPaymentIntentStore.set(id, { amount, currency, bookingId, description });
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
 * Retrieve stored mock payment intent data (without consuming it)
 */
export const getMockPaymentIntentData = (paymentIntentId: string): { amount: number; currency: string; bookingId?: string; description?: string } | undefined => {
    return mockPaymentIntentStore.get(paymentIntentId);
};

/**
 * Consume and delete mock payment intent data after confirmation
 */
const consumeMockPaymentIntentData = (paymentIntentId: string): { amount: number; currency: string; bookingId?: string; description?: string } | undefined => {
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
    // Get stored intent data for description
    const intentData = consumeMockPaymentIntentData(paymentIntentId);
    const finalBookingId = bookingId || intentData?.bookingId || 'unknown';

    const payment: Payment = {
        id: `pay_mock_${crypto.randomUUID()}`,
        bookingId: finalBookingId,
        amount: amount,
        currency: currency,
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.CARD,
        description: intentData?.description || 'Booking Payment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stripePaymentIntentId: paymentIntentId,
    };

    // Add to mock payment history so it shows up in payment history view
    addMockPayment(payment);

    // Update the mock booking's paid amount so balance due updates
    if (finalBookingId !== 'unknown') {
        // Amount is in cents, convert to dollars for booking store
        updateMockBookingPayment(finalBookingId, amount / 100);
    }

    return payment;
};

