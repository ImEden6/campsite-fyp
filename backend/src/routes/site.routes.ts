
import { Router, Request, Response, NextFunction } from 'express';
import siteService from '@/services/site.service';
import cacheService, { CacheService } from '@/services/cache.service';
import { authenticate, authorize } from '@/middleware/auth';
import { ApiError } from '@/utils/errors';
import { SiteType, SiteStatus, Site as PrismaSite } from '@prisma/client';
import logger from '@/utils/logger';

const router = Router();

/**
 * Transform raw Prisma Site to frontend-compatible format
 * Converts flat fields (sizeLength, latitude, etc.) to nested objects (size, location)
 */
const transformSite = (site: PrismaSite) => ({
  id: site.id,
  name: site.name,
  type: site.type,
  status: site.status,
  capacity: site.capacity,
  description: site.description,
  amenities: site.amenities || [],
  images: site.images || [],
  basePrice: site.basePrice,
  maxVehicles: site.maxVehicles,
  maxTents: site.maxTents,
  isPetFriendly: site.isPetFriendly,
  hasElectricity: site.hasElectricity,
  hasWater: site.hasWater,
  hasSewer: site.hasSewer,
  hasWifi: site.hasWifi,
  size: {
    length: site.sizeLength,
    width: site.sizeWidth,
    unit: site.sizeUnit as 'feet' | 'meters',
  },
  location: {
    latitude: site.latitude,
    longitude: site.longitude,
    mapPosition: {
      x: site.mapPositionX,
      y: site.mapPositionY,
    },
  },
  createdAt: site.createdAt,
  updatedAt: site.updatedAt,
});

// Cache TTL constants (in seconds)
const LIST_SOFT_TTL = 300;   // 5 min soft TTL
const LIST_HARD_TTL = 600;   // 10 min hard TTL
const DETAIL_SOFT_TTL = 900; // 15 min soft TTL
const DETAIL_HARD_TTL = 1800; // 30 min hard TTL

/**
 * GET /campsites
 * List all campsites with optional filters
 * Uses cache with query hash for filtered results
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, status, minPrice, maxPrice, minCapacity } = req.query;

        const filters = {
            type: type ? (type as string).toUpperCase() as SiteType : undefined,
            status: status ? (status as string).toUpperCase() as SiteStatus : undefined,
            minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
            minCapacity: minCapacity ? parseInt(minCapacity as string, 10) : undefined,
        };

        // Cache key includes query hash for filtered variants
        const queryHash = CacheService.hashQuery(filters);
        const cacheResource = `sites:list:${queryHash}`;

        const sites = await cacheService.getWithSoftTtl(
            cacheResource,
            () => siteService.getAllSites(filters),
            LIST_SOFT_TTL,
            LIST_HARD_TTL,
        );

        res.json({
            success: true,
            data: sites.map(transformSite),
            count: sites.length,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /campsites/:id
 * Get details of a specific campsite
 * Uses longer cache TTL for detail endpoints
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const cacheResource = `sites:detail:${id}`;

        const site = await cacheService.getWithSoftTtl(
            cacheResource,
            async () => {
                const result = await siteService.getSiteById(id as string);
                if (!result) {
                    throw new ApiError(404, 'Campsite not found');
                }
                return result;
            },
            DETAIL_SOFT_TTL,
            DETAIL_HARD_TTL,
        );

        res.json({
            success: true,
            data: transformSite(site),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /campsites
 * Create a new campsite (Admin/Manager only)
 * Invalidates list cache on mutation
 */
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const site = await siteService.createSite(req.body);

        // Invalidate list cache
        await cacheService.safeFlushPattern('sites:list:*');
        logger.info('Site cache invalidated after create', { siteId: site.id });

        res.status(201).json({
            success: true,
            data: transformSite(site),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /campsites/:id
 * Update a campsite (Admin/Manager only)
 * Invalidates both list and detail cache
 */
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const site = await siteService.updateSite(id as string, req.body);

        // Invalidate list and detail cache
        await Promise.all([
            cacheService.safeFlushPattern('sites:list:*'),
            cacheService.safeDelete(`sites:detail:${id}`),
        ]);
        logger.info('Site cache invalidated after update', { siteId: id });

        res.json({
            success: true,
            data: transformSite(site),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /campsites/:id
 * Delete a campsite (Admin only)
 * Invalidates both list and detail cache
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await siteService.deleteSite(id as string);

        // Invalidate list and detail cache
        await Promise.all([
            cacheService.safeFlushPattern('sites:list:*'),
            cacheService.safeDelete(`sites:detail:${id}`),
        ]);
        logger.info('Site cache invalidated after delete', { siteId: id });

        res.json({
            success: true,
            message: 'Campsite deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
