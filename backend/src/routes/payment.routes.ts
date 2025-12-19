import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { paymentRateLimit } from '@/middleware/security';
import { validateBody, createPaymentIntentSchema, CreatePaymentIntentInput } from '@/middleware/validate';
import paymentService from '@/services/payment.service';
import cacheService from '@/services/cache.service';
import { getPrismaClient } from '@/database';
import { ApiError } from '@/utils/errors';
import logger from '@/utils/logger';

const router = Router();
const prisma = getPrismaClient();

// Idempotency key TTL (1 hour)
const IDEMPOTENCY_TTL = 3600;

/**
 * POST /payments/intent
 * Create a payment intent
 * Middleware order: rate limiter -> validation -> controller
 */
router.post('/intent', authenticate, paymentRateLimit, validateBody(createPaymentIntentSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookingId, amount, idempotencyKey } = req.body as CreatePaymentIntentInput;
        const userId = req.user!.id;

        // Security: Verify booking exists and belongs to user
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking) {
            throw new ApiError(404, 'Booking not found');
        }

        if (booking.userId !== userId && req.user!.role === 'CUSTOMER') {
            throw new ApiError(403, 'Not authorized to pay for this booking');
        }

        // Security: Re-check amount bounds server-side
        if (amount < 0.50 || amount > 999999.99) {
            throw new ApiError(400, 'Amount must be between $0.50 and $999,999.99');
        }

        // Idempotency: Return cached result if key provided
        if (idempotencyKey) {
            const idempotencyResource = `payment:idempotency:${idempotencyKey}`;
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
            'myr',
            bookingId,
            `Payment for booking ${booking.bookingNumber}`,
            userId
        );

        // Cache result with idempotency key
        if (idempotencyKey) {
            await cacheService.safeSet(`payment:idempotency:${idempotencyKey}`, result, IDEMPOTENCY_TTL);
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
        const { id } = req.params;
        const payment = await paymentService.confirmPayment(id as string);

        if (!payment) {
            // If payment is not found or not succeeded, try to sync with Stripe again inside service? 
            // Current implementation just checks database or stripe status. 
            // For now, return 404 or pending.
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
