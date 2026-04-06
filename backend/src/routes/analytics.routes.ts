/**
 * Analytics Routes
 * Endpoints for analytics and reporting data
 */

import { Router } from 'express';
import analyticsService from '@/services/analytics.service';
import { authenticate } from '@/middleware/auth';
import { createAnalyticsHandler } from '@/utils/route-helpers';

const router = Router();

/**
 * GET /analytics/dashboard
 * Get dashboard metrics
 */
router.get('/dashboard', authenticate, createAnalyticsHandler(
    (dateRange) => analyticsService.getDashboardMetrics(dateRange),
    'Error fetching dashboard metrics'
));

/**
 * GET /analytics/revenue
 * Get revenue metrics with time series
 */
router.get('/revenue', authenticate, createAnalyticsHandler(
    (dateRange) => analyticsService.getRevenueMetrics(dateRange),
    'Error fetching revenue metrics'
));

/**
 * GET /analytics/occupancy
 * Get occupancy metrics with time series
 */
router.get('/occupancy', authenticate, createAnalyticsHandler(
    (dateRange) => analyticsService.getOccupancyMetrics(dateRange),
    'Error fetching occupancy metrics'
));

/**
 * GET /analytics/customers
 * Get customer insights
 */
router.get('/customers', authenticate, createAnalyticsHandler(
    (dateRange) => analyticsService.getCustomerInsights(dateRange),
    'Error fetching customer insights'
));

/**
 * GET /analytics/sites
 * Get site performance metrics
 */
router.get('/sites', authenticate, createAnalyticsHandler(
    (dateRange) => analyticsService.getSitePerformance(dateRange),
    'Error fetching site performance'
));

export default router;
