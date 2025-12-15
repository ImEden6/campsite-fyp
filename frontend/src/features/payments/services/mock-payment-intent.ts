import { Payment, PaymentIntent, PaymentStatus, PaymentMethod } from '../types/payment.types';

export const createMockPaymentIntent = (amount: number, currency: string): PaymentIntent => {
    return {
        id: `pi_mock_${crypto.randomUUID()}`,
        amount,
        currency,
        clientSecret: `seti_mock_${crypto.randomUUID()}_secret_${crypto.randomUUID()}`,
        status: 'requires_payment_method',
        created: Date.now(),
    };
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
