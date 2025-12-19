import Stripe from 'stripe';
import { config } from '@/config';
import logger from '@/utils/logger';
import { ApiError } from '@/utils/errors';
import { PrismaClient, PaymentStatus, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

class PaymentService {
    private stripe: Stripe;

    constructor() {
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

            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
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
            throw new ApiError(500, 'Failed to initiate payment');
        }
    }

    /**
     * Confirm a payment manually (if needed) and update status
     */
    async confirmPayment(paymentIntentId: string) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

            if (paymentIntent.status === 'succeeded') {
                const payment = await prisma.payment.findFirst({
                    where: { stripePaymentId: paymentIntentId },
                });

                if (payment) {
                    const updatedPayment = await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: PaymentStatus.PAID,
                            processedAt: new Date(),
                            transactionId: paymentIntent.id, // Or use balance_transaction if available
                        },
                        include: { user: true, booking: true },
                    });

                    // Also update booking status
                    await prisma.booking.update({
                        where: { id: payment.bookingId },
                        data: {
                            paymentStatus: PaymentStatus.PAID,
                            paidAmount: { increment: payment.amount }
                        }
                    });

                    return updatedPayment;
                }
            }

            return null;
        } catch (error) {
            logger.error('Failed to confirm payment', error);
            throw new ApiError(500, 'Failed to confirm payment');
        }
    }

    /**
     * Get payment details
     */
    async getPayment(paymentId: string) {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { user: true, booking: true },
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
            include: { user: true },
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
            throw new ApiError(500, 'Failed to process refund');
        }
    }

    /**
     * Handle Stripe Webhook Events
     */
    async handleWebhook(signature: string, payload: Buffer) {
        try {
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET || ''
            );

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
                    await prisma.payment.updateMany({
                        where: { stripePaymentId: failedIntent.id },
                        data: { status: PaymentStatus.FAILED },
                    });
                    break;
                }
            }
        } catch (error: any) {
            logger.error(`Webhook Error: ${error.message}`);
            throw new ApiError(400, `Webhook Error: ${error.message}`);
        }
    }
}

export default new PaymentService();
