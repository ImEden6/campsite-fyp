// Equipment Routes

import { Router, Request, Response, NextFunction } from 'express';
import bookingService from '@/services/booking.service';
import { CacheService } from '@/services/cache.service';
import { ApiError } from '@/utils/errors';
import logger from '@/utils/logger';

const router = Router();
const cacheService = new CacheService();

/**
 * GET /equipment/available
 * Get available equipment for a date range
 * Query params: startDate, endDate, siteId (optional), equipmentType (optional)
 */
router.get('/available', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, siteId, equipmentType } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      throw new ApiError(400, 'startDate and endDate are required');
    }

    // Parse and validate dates
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError(400, 'Invalid date format');
    }

    if (start >= end) {
      throw new ApiError(400, 'startDate must be before endDate');
    }

    // Create cache key
    const cacheKey = `equipment:availability:${startDate}:${endDate}:${siteId || 'all'}:${equipmentType || 'all'}`;

    // Check cache first
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      logger.info('Equipment availability served from cache', { cacheKey });
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    // Get available equipment
    const equipment = await bookingService.getAvailableEquipment({
      startDate: start,
      endDate: end,
      siteId: siteId as string | undefined,
      equipmentType: equipmentType as string | undefined,
    });

    // Cache the result for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, equipment, 300);

    logger.info('Equipment availability retrieved', {
      startDate,
      endDate,
      siteId,
      equipmentType,
      count: equipment.length,
    });

    res.json({
      success: true,
      data: equipment,
      count: equipment.length,
      cached: false,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
