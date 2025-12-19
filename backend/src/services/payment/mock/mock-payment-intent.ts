
import { Payment, PaymentStatus, PaymentMethod } from '@prisma/client';
import { addMockPayment } from './mockCurrentPayments';
import * as crypto from 'crypto';

export interface PaymentIntent {
    id: string;
    clientSecret: string;
    amount: number;
    currency: string;
    status: string;
    created: number;
}

// In-memory store for mock payment intents
const mockPaymentIntentStore = new Map<string, { amount: number; currency: string; bookingId?: string; description?: string }>();
const MAX_STORE_SIZE = 100;

export const createMockPaymentIntent = (
    amount: number,
    currency: string,
    bookingId?: string,
    description?: string
): PaymentIntent => {
    const id = `pi_mock_${crypto.randomUUID()}`;

    // Cleanup
    if (mockPaymentIntentStore.size >= MAX_STORE_SIZE) {
        const firstKey = mockPaymentIntentStore.keys().next().value;
        if (firstKey) mockPaymentIntentStore.delete(firstKey);
    }

    // Store data
    mockPaymentIntentStore.set(id, { amount, currency, bookingId, description });
    return {
        id,
        amount,
        currency,
        clientSecret: `${id}_secret_${crypto.randomUUID()}`,
        status: 'requires_payment_method',
        created: Date.now(),
    };
};

/**
 * Retrieve stored mock payment intent data
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
        mockPaymentIntentStore.delete(paymentIntentId);
    }
    return data;
};

export const createMockConfirmedPayment = (
    paymentIntentId: string,
    bookingId: string | undefined,
    amount: number,
    currency: string
): Payment => {
    const intentData = consumeMockPaymentIntentData(paymentIntentId);
    const finalBookingId = bookingId || intentData?.bookingId || 'unknown';

    const payment: Payment = {
        id: `pay_mock_${crypto.randomUUID()}`,
        bookingId: finalBookingId,
        userId: 'demo-user', // Required by Prisma model
        amount: amount, // Assuming amount is already in correct units for backend
        // Note: Stripe intent amount is usually cents. If Backend uses units, we assume input 'amount' here is Units, or we need to divide.
        // In frontend, Stripe uses cents. Backend createPaymentIntent uses round(amount * 100).
        // If this mock is called by Backend Service, it receives 'amount' which might be the one passed to createPaymentIntent (User input Units).
        // Let's assume 'amount' passed here is consistent with what we need in DB.
        // In 'payment.service.ts' we passed 'amount' from user input (Units) to stripe.create.
        // In confirmPayment, we read from intent.

        method: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PAID,
        stripePaymentId: paymentIntentId,
        stripeRefundId: null,
        transactionId: null,
        description: intentData?.description || 'Booking Payment',
        receiptUrl: null,
        processedAt: new Date(),
        refundedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    addMockPayment(payment);

    return payment;
};
