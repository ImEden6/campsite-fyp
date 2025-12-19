import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import paymentService from '@/services/payment.service';
import logger from '@/utils/logger';

const router = Router();

/**
 * POST /payments/intent
 * Create a payment intent
 */
router.post('/intent', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { amount, currency, bookingId, description } = req.body;
        const userId = req.user!.id;

        const result = await paymentService.createPaymentIntent(
            amount,
            currency || 'myr',
            bookingId,
            description,
            userId
        );

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
