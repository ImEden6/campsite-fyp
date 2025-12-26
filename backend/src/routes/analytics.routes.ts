/**
 * Analytics Routes
 * Endpoints for analytics and reporting data
 */

import { Router, Request, Response, NextFunction } from 'express';
import analyticsService from '@/services/analytics.service';
import { authenticate } from '@/middleware/auth';
import logger from '@/utils/logger';

const router = Router();

/**
 * GET /analytics/dashboard
 * Get dashboard metrics
 */
router.get('/dashboard', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query;

        const dateRange = startDate && endDate
            ? { startDate: startDate as string, endDate: endDate as string }
            : undefined;

        const metrics = await analyticsService.getDashboardMetrics(dateRange);

        res.json({
            success: true,
            data: metrics,
        });
    } catch (error) {
        logger.error('Error fetching dashboard metrics', { error });
        next(error);
    }
});

/**
 * GET /analytics/revenue
 * Get revenue metrics with time series
 */
router.get('/revenue', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query;

        const dateRange = startDate && endDate
            ? { startDate: startDate as string, endDate: endDate as string }
            : undefined;

        const metrics = await analyticsService.getRevenueMetrics(dateRange);

        res.json({
            success: true,
            data: metrics,
        });
    } catch (error) {
        logger.error('Error fetching revenue metrics', { error });
        next(error);
    }
});

/**
 * GET /analytics/occupancy
 * Get occupancy metrics with time series
 */
router.get('/occupancy', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query;

        const dateRange = startDate && endDate
            ? { startDate: startDate as string, endDate: endDate as string }
            : undefined;

        const metrics = await analyticsService.getOccupancyMetrics(dateRange);

        res.json({
            success: true,
            data: metrics,
        });
    } catch (error) {
        logger.error('Error fetching occupancy metrics', { error });
        next(error);
    }
});

/**
 * GET /analytics/customers
 * Get customer insights
 */
router.get('/customers', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query;

        const dateRange = startDate && endDate
            ? { startDate: startDate as string, endDate: endDate as string }
            : undefined;

        const insights = await analyticsService.getCustomerInsights(dateRange);

        res.json({
            success: true,
            data: insights,
        });
    } catch (error) {
        logger.error('Error fetching customer insights', { error });
        next(error);
    }
});

/**
 * GET /analytics/sites
 * Get site performance metrics
 */
router.get('/sites', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query;

        const dateRange = startDate && endDate
            ? { startDate: startDate as string, endDate: endDate as string }
            : undefined;

        const performance = await analyticsService.getSitePerformance(dateRange);

        res.json({
            success: true,
            data: performance,
        });
    } catch (error) {
        logger.error('Error fetching site performance', { error });
        next(error);
    }
});

export default router;
