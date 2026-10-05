import Stripe from 'stripe';
import { config } from '@/config';
import logger from '@/utils/logger';
import { ApiError } from '@/utils/errors';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

import prisma from '@/database';

export const PAYMENT_CURRENCY = 'myr';

// Never expose the full User row (it contains the password hash) in payment responses.
const safeUserSelect = { id: true, email: true, firstName: true, lastName: true } as const;

const toCents = (amount: number) => Math.round(amount * 100);

class PaymentService {
    private stripe: Stripe;
    private stripeConfigured: boolean;

    constructor() {
        this.stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2023-10-16', // Use a fixed API version
        });
    }

    /**
     * Create a payment intent for a booking
     */
    async createPaymentIntent(
        amount: number,
        currency: string,
        bookingId: string,
        description?: string,
        userId?: string
    ) {
        try {
            if (!amount || amount <= 0) {
                throw new ApiError(400, 'Invalid payment amount');
            }

            if (!this.stripeConfigured) {
                throw new ApiError(503, 'Stripe not configured');
            }

            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: toCents(amount),
                currency: currency.toLowerCase(),
                description: description || `Payment for booking ${bookingId}`,
                metadata: {
                    bookingId,
                    userId: userId || '',
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            // Create a pending payment record in the database
            if (bookingId && userId) {
                await prisma.payment.create({
                    data: {
                        bookingId,
                        userId,
                        amount,
                        method: PaymentMethod.CREDIT_CARD, // Default for Stripe
                        status: PaymentStatus.PENDING,
                        stripePaymentId: paymentIntent.id,
                        description,
                    },
                });
            }

            logger.info('Payment intent created', {
                bookingId,
                paymentIntentId: paymentIntent.id,
                amount,
            });

            return {
                id: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
            };
        } catch (error) {
            logger.error('Failed to create payment intent', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Failed to initiate payment');
        }
    }

    /**
     * Confirm a payment against Stripe and update the payment + booking.
     *
     * Safe to call repeatedly (manual confirm, webhook, retries): the PENDING -> PAID
     * transition is claimed atomically, so the booking's paidAmount is only incremented once.
     * Returns null if the payment is unknown or Stripe has not reported success.
     */
    async confirmPayment(paymentIntentId: string) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status !== 'succeeded') {
                return null;
            }

            const payment = await prisma.payment.findFirst({
                where: { stripePaymentId: paymentIntentId },
            });
            if (!payment) {
                return null;
            }

            if (paymentIntent.amount_received !== toCents(payment.amount)) {
                logger.error('Payment amount mismatch between Stripe and database', {
                    paymentId: payment.id,
                    paymentIntentId,
                    expected: toCents(payment.amount),
                    received: paymentIntent.amount_received,
                });
                throw new ApiError(409, 'Payment amount mismatch');
            }

            return await prisma.$transaction(async (tx) => {
                const claimed = await tx.payment.updateMany({
                    where: { id: payment.id, status: PaymentStatus.PENDING },
                    data: {
                        status: PaymentStatus.PAID,
                        processedAt: new Date(),
                        transactionId: paymentIntent.id,
                    },
                });

                if (claimed.count === 1) {
                    const booking = await tx.booking.update({
                        where: { id: payment.bookingId },
                        data: { paidAmount: { increment: payment.amount } },
                    });
                    // Compare in cents to avoid floating point drift
                    const fullyPaid = toCents(booking.paidAmount) >= toCents(booking.totalAmount);
                    await tx.booking.update({
                        where: { id: payment.bookingId },
                        data: { paymentStatus: fullyPaid ? PaymentStatus.PAID : PaymentStatus.PARTIAL },
                    });
                }

                return tx.payment.findUniqueOrThrow({
                    where: { id: payment.id },
                    include: { user: { select: safeUserSelect }, booking: true },
                });
            });
        } catch (error) {
            logger.error('Failed to confirm payment', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Failed to confirm payment');
        }
    }

    /**
     * Look up a payment by its Stripe PaymentIntent id (used for ownership checks)
     */
    async getPaymentByIntentId(paymentIntentId: string) {
        return prisma.payment.findFirst({ where: { stripePaymentId: paymentIntentId } });
    }

    /**
     * Get payment details
     */
    async getPayment(paymentId: string) {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { user: { select: safeUserSelect }, booking: true },
        });

        if (!payment) {
            throw new ApiError(404, 'Payment not found');
        }

        return payment;
    }

    /**
     * Get payments for a booking
     */
    async getBookingPayments(bookingId: string) {
        return prisma.payment.findMany({
            where: { bookingId },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: safeUserSelect } },
        });
    }

    /**
     * Get user payment history
     */
    async getUserPaymentHistory(userId: string) {
        return prisma.payment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { booking: { include: { site: true } } },
        });
    }

    /**
     * Process a refund
     */
    async processRefund(paymentId: string, amount?: number, reason?: string) {
        try {
            const payment = await prisma.payment.findUnique({
                where: { id: paymentId },
            });

            if (!payment || !payment.stripePaymentId) {
                throw new ApiError(404, 'Payment not found or invalid');
            }

            if (payment.status !== PaymentStatus.PAID) {
                throw new ApiError(400, 'Cannot refund an unpaid payment');
            }

            if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0 || amount > payment.amount)) {
                throw new ApiError(400, 'Refund amount must be greater than 0 and at most the payment amount');
            }

            const refund = await this.stripe.refunds.create({
                payment_intent: payment.stripePaymentId,
                amount: amount ? Math.round(amount * 100) : undefined, // Full refund if undefined
                reason: (reason as any) || 'requested_by_customer',
            });

            const updatedPayment = await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: amount && amount < payment.amount ? PaymentStatus.PARTIAL : PaymentStatus.REFUNDED,
                    stripeRefundId: refund.id,
                    refundedAt: new Date(),
                },
            });

            return updatedPayment;
        } catch (error) {
            logger.error('Failed to process refund', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Failed to process refund');
        }
    }

    /**
     * Handle Stripe Webhook Events.
     * Signature failures throw 400 (Stripe should not retry); processing failures
     * propagate as 5xx so Stripe retries delivery.
     */
    async handleWebhook(signature: string, payload: Buffer) {
        const webhookSecret = config.stripe.webhookSecret;
        if (!webhookSecret) {
            logger.error('Stripe webhook received but STRIPE_WEBHOOK_SECRET is not configured');
            throw new ApiError(503, 'Webhook not configured');
        }

        let event: Stripe.Event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        } catch (error: any) {
            logger.warn(`Webhook signature verification failed: ${error.message}`);
            throw new ApiError(400, 'Invalid webhook signature');
        }

        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                logger.info('Webhook: Payment succeeded', { id: paymentIntent.id });
                await this.confirmPayment(paymentIntent.id);
                break;
            }
            case 'payment_intent.payment_failed': {
                const failedIntent = event.data.object as Stripe.PaymentIntent;
                logger.warn('Webhook: Payment failed', { id: failedIntent.id });
                // Only PENDING payments: a late/out-of-order failure must not undo a PAID one
                await prisma.payment.updateMany({
                    where: { stripePaymentId: failedIntent.id, status: PaymentStatus.PENDING },
                    data: { status: PaymentStatus.FAILED },
                });
                break;
            }
        }
    }
}

export default new PaymentService();
