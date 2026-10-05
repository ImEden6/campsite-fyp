import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { paymentRateLimit } from '@/middleware/security';
import { validateBody, createPaymentIntentSchema, CreatePaymentIntentInput } from '@/middleware/validate';
import paymentService, { PAYMENT_CURRENCY } from '@/services/payment.service';
import cacheService from '@/services/cache.service';
import { getPrismaClient } from '@/database';
import { ApiError } from '@/utils/errors';
import logger from '@/utils/logger';

const router = Router();
const prisma = getPrismaClient();

// Idempotency key TTL (1 hour)
const IDEMPOTENCY_TTL = 3600;

/**
 * POST /payments/webhook
 * Stripe webhook. Unauthenticated by design: authenticity comes from the Stripe signature,
 * verified against the raw request body captured in index.ts.
 */
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const signature = req.headers['stripe-signature'];
        const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

        if (typeof signature !== 'string' || !rawBody) {
            throw new ApiError(400, 'Missing Stripe signature or body');
        }

        await paymentService.handleWebhook(signature, rawBody);
        res.json({ received: true });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /payments/intent
 * Create a payment intent for a booking.
 * The amount is derived from the booking's outstanding balance on the server; a client-supplied
 * amount can only request a partial payment of that balance.
 * Middleware order: authenticate -> rate limiter -> validation -> controller
 */
router.post('/intent', authenticate, paymentRateLimit, validateBody(createPaymentIntentSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookingId, amount: requestedAmount, idempotencyKey } = req.body as CreatePaymentIntentInput;
        const userId = req.user!.id;

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        // Same response for "missing" and "not yours" so booking ids can't be probed
        if (!booking || (booking.userId !== userId && req.user!.role === 'CUSTOMER')) {
            throw new ApiError(404, 'Booking not found');
        }

        if (booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') {
            throw new ApiError(409, 'This booking can no longer be paid');
        }

        const outstanding = Math.round((booking.totalAmount - booking.paidAmount) * 100) / 100;
        if (outstanding <= 0) {
            throw new ApiError(409, 'This booking has no outstanding balance');
        }

        let amount = outstanding;
        if (requestedAmount !== undefined) {
            if (requestedAmount > outstanding) {
                throw new ApiError(400, `Amount exceeds the outstanding balance of ${outstanding.toFixed(2)}`);
            }
            amount = requestedAmount;
        }

        // Idempotency: scoped per user and booking so one user's key can never return
        // another user's payment intent (and its clientSecret)
        const idempotencyResource = idempotencyKey
            ? `payment:idempotency:${userId}:${bookingId}:${idempotencyKey}`
            : null;

        if (idempotencyResource) {
            const existing = await cacheService.safeGet<object>(idempotencyResource);
            if (existing) {
                logger.info('Returning idempotent payment intent', { idempotencyKey });
                return res.json({
                    success: true,
                    data: existing,
                    idempotent: true,
                });
            }
        }

        const result = await paymentService.createPaymentIntent(
            amount,
            PAYMENT_CURRENCY,
            bookingId,
            `Payment for booking ${booking.bookingNumber}`,
            userId
        );

        if (idempotencyResource) {
            await cacheService.safeSet(idempotencyResource, result, IDEMPOTENCY_TTL);
        }

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /payments/history
 * Get current user's payment history
 */
router.get('/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const payments = await paymentService.getUserPaymentHistory(userId);

        res.json({
            success: true,
            data: payments,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /payments/confirm/:id
 * Confirm payment status manually (if webhook is delayed/missed)
 */
router.post('/confirm/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;

        // Only the payer or staff may trigger a confirm; unknown and foreign ids look identical
        const existing = await paymentService.getPaymentByIntentId(id);
        const isStaff = ['STAFF', 'MANAGER', 'ADMIN'].includes(req.user!.role);
        if (!existing || (existing.userId !== req.user!.id && !isStaff)) {
            res.status(404).json({ success: false, message: 'Payment not found or not successful' });
            return;
        }

        const payment = await paymentService.confirmPayment(id);

        if (!payment) {
            res.status(404).json({ success: false, message: 'Payment not found or not successful' });
            return;
        }

        res.json({
            success: true,
            data: payment,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /payments/:id
 * Get payment details
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const payment = await paymentService.getPayment(id as string);

        // Ensure user owns the payment or is admin
        if (payment.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
            res.status(403).json({ success: false, message: 'Unauthorized' });
            return;
        }

        res.json({
            success: true,
            data: payment,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /payments/:id/refund
 * Refund a payment (Admin/Manager only)
 */
router.post('/:id/refund', authenticate, authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { amount, reason } = req.body;
        if (amount !== undefined && typeof amount !== 'number') {
            throw new ApiError(400, 'Refund amount must be a number');
        }
        if (reason !== undefined && typeof reason !== 'string') {
            throw new ApiError(400, 'Refund reason must be text');
        }

        const refund = await paymentService.processRefund(id as string, amount, reason);

        res.json({
            success: true,
            data: refund,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
