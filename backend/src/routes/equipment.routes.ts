// Equipment Routes

import { Router, Request, Response, NextFunction } from 'express';
import bookingService from '@/services/booking.service';
import { CacheService } from '@/services/cache.service';
import { ApiError } from '@/utils/errors';
import logger from '@/utils/logger';
import { getPrismaClient } from '@/database';
import { EquipmentItemStatus } from '@prisma/client';
import { EquipmentStatus } from '@campsite-management/shared';

const router = Router();
const cacheService = new CacheService();
const prisma = getPrismaClient();

const toArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return [String(value)];
};

/**
 * GET /equipment
 * List equipment inventory with basic filtering + pagination
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 200);
    const skip = (page - 1) * limit;

    const categories = toArray(req.query.category);
    const statuses = toArray(req.query.status);
    const search = req.query.search ? String(req.query.search).trim() : '';
    const minPrice = req.query.minPrice ? parseFloat(String(req.query.minPrice)) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(String(req.query.maxPrice)) : undefined;
    const availableOnly = String(req.query.availableOnly || '').toLowerCase() === 'true';

    const where = {
      ...(categories.length > 0 ? { category: { in: categories as any[] } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            dailyRate: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    };

    const needsPostFilter = statuses.length > 0 || availableOnly;
    const [totalRaw, rows] = await Promise.all([
      prisma.equipment.count({ where }),
      prisma.equipment.findMany({
        where,
        ...(needsPostFilter ? {} : { skip, take: limit }),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            select: { status: true },
          },
        },
      }),
    ]);

    const mapped = rows.map((item) => {
      const availableFromItems = item.items.filter((it) => it.status === EquipmentItemStatus.AVAILABLE).length;
      const availableQuantity = item.items.length > 0 ? availableFromItems : item.quantity;
      const status =
        availableQuantity > 0 ? EquipmentStatus.AVAILABLE : EquipmentStatus.RENTED;
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        status,
        quantity: item.quantity,
        availableQuantity,
        dailyRate: item.dailyRate,
        weeklyRate: item.weeklyRate,
        monthlyRate: item.monthlyRate,
        deposit: item.deposit,
        images: item.images || [],
        specifications: item.specifications ?? undefined,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    const filtered = mapped.filter((item) => {
      if (availableOnly && item.availableQuantity <= 0) return false;
      if (statuses.length > 0 && !statuses.includes(item.status)) return false;
      return true;
    });

    const total = needsPostFilter ? filtered.length : totalRaw;
    const data = needsPostFilter ? filtered.slice(skip, skip + limit) : filtered;

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    next(error);
  }
});

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
