
import { Site, SiteStatus, SiteType, Prisma } from '@prisma/client';
import { ApiError } from '@/utils/errors';
import logger from '@/utils/logger';
import { getPrismaClient } from '@/database';
import cacheService from '@/services/cache.service';
import crypto from 'crypto';

const prisma = getPrismaClient();

// Cache TTL constants
const SITE_CACHE_TTL = 3600; // 1 hour for static site data

// Generate stable cache key from filters (sorted keys for consistency)
function generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
        .filter(key => params[key] !== undefined)
        .sort()
        .reduce((acc, key) => ({ ...acc, [key]: params[key] }), {});

    const hash = crypto.createHash('md5').update(JSON.stringify(sortedParams)).digest('hex');
    return `${prefix}:${hash}`;
}

export class SiteService {
    async getAllSites(filters?: {
        type?: SiteType;
        status?: SiteStatus;
        minPrice?: number;
        maxPrice?: number;
        minCapacity?: number;
    }): Promise<Site[]> {
        const cacheKey = generateCacheKey('sites:list', filters || {});

        return cacheService.remember(cacheKey, async () => {
            const { type, status, minPrice, maxPrice, minCapacity } = filters || {};

            const sites = await prisma.site.findMany({
                where: {
                    onMap: true,
                    status: {
                        not: SiteStatus.OUT_OF_SERVICE,
                        ...(status ? { equals: status } : {}),
                    },
                    ...(type && { type }),
                    ...(minCapacity && { capacity: { gte: minCapacity } }),
                    ...(minPrice || maxPrice
                        ? {
                            basePrice: {
                                ...(minPrice && { gte: minPrice }),
                                ...(maxPrice && { lte: maxPrice }),
                            },
                        }
                        : {}),
                },
                orderBy: { name: 'asc' },
            });

            logger.info('Sites fetched from database (cache miss)', {
                count: sites.length,
                filters
            });

            return sites;
        }, SITE_CACHE_TTL);
    }

    async getSiteById(id: string): Promise<Site | null> {
        const cacheKey = `site:${id}`;

        return cacheService.remember(cacheKey, async () => {
            const site = await prisma.site.findUnique({
                where: { id },
            });

            if (site) {
                logger.info('Site fetched from database (cache miss)', { siteId: id });
            }

            return site;
        }, SITE_CACHE_TTL);
    }

    async createSite(data: Prisma.SiteUncheckedCreateInput): Promise<Site> {
        try {
            const site = await prisma.site.create({
                data,
            });

            // Invalidate cache after successful creation
            await this.invalidateSiteCache();

            logger.info(`Site created: ${site.id}`);
            return site;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ApiError(409, 'A site with this name already exists');
            }
            throw error;
        }
    }

    async updateSite(id: string, data: Prisma.SiteUpdateInput): Promise<Site> {
        try {
            const site = await prisma.site.update({
                where: { id },
                data,
            });

            // Invalidate cache after successful update
            await this.invalidateSiteCache(id);

            logger.info(`Site updated: ${site.id}`);
            return site;
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new ApiError(404, 'Site not found');
            }
            if (error.code === 'P2002') {
                throw new ApiError(409, 'A site with this name already exists');
            }
            throw error;
        }
    }

    async deleteSite(id: string): Promise<void> {
        try {
            await prisma.site.delete({
                where: { id },
            });

            // Invalidate cache after successful deletion
            await this.invalidateSiteCache(id);

            logger.info(`Site deleted: ${id}`);
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new ApiError(404, 'Site not found');
            }
            // Check for foreign key constraints (e.g. existing bookings)
            if (error.code === 'P2003') {
                throw new ApiError(400, 'Cannot delete site with existing bookings');
            }
            throw error;
        }
    }

    // Invalidate site-related caches
    private async invalidateSiteCache(siteId?: string): Promise<void> {
        // Always clear list caches
        await cacheService.flushPattern('sites:list:*');

        // Clear specific site cache if provided
        if (siteId) {
            await cacheService.delete(`site:${siteId}`);
        }

        logger.info('Site cache invalidated', { siteId });
    }
}

export default new SiteService();
