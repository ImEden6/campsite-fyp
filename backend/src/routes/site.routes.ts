
import { Router, Request, Response, NextFunction } from 'express';
import siteService from '@/services/site.service';
import { authenticate, authorize } from '@/middleware/auth';
import { ApiError } from '@/utils/errors';
import { SiteType, SiteStatus } from '@prisma/client';

const router = Router();

/**
 * GET /campsites
 * List all campsites with optional filters
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

        const sites = await siteService.getAllSites(filters);

        res.json({
            success: true,
            data: sites,
            count: sites.length,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /campsites/:id
 * Get details of a specific campsite
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const site = await siteService.getSiteById(id as string);

        if (!site) {
            throw new ApiError(404, 'Campsite not found');
        }

        res.json({
            success: true,
            data: site,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /campsites
 * Create a new campsite (Admin/Manager only)
 */
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const site = await siteService.createSite(req.body);

        res.status(201).json({
            success: true,
            data: site,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /campsites/:id
 * Update a campsite (Admin/Manager only)
 */
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const site = await siteService.updateSite(id as string, req.body);

        res.json({
            success: true,
            data: site,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /campsites/:id
 * Delete a campsite (Admin only)
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await siteService.deleteSite(id as string);

        res.json({
            success: true,
            message: 'Campsite deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
