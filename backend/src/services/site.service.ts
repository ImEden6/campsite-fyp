
import { PrismaClient, Site, SiteStatus, SiteType } from '@prisma/client';
import { ApiError } from '@/utils/errors';
import logger from '@/utils/logger';

const prisma = new PrismaClient();

export class SiteService {
    async getAllSites(filters?: {
        type?: SiteType;
        status?: SiteStatus;
        minPrice?: number;
        maxPrice?: number;
        minCapacity?: number;
    }): Promise<Site[]> {
        const { type, status, minPrice, maxPrice, minCapacity } = filters || {};

        return prisma.site.findMany({
            where: {
                ...(type && { type }),
                ...(status && { status }),
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
    }

    async getSiteById(id: string): Promise<Site | null> {
        return prisma.site.findUnique({
            where: { id },
        });
    }

    async createSite(data: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>): Promise<Site> {
        try {
            const site = await prisma.site.create({
                data,
            });
            logger.info(`Site created: ${site.id}`);
            return site;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ApiError(409, 'A site with this name already exists');
            }
            throw error;
        }
    }

    async updateSite(id: string, data: Partial<Site>): Promise<Site> {
        try {
            const site = await prisma.site.update({
                where: { id },
                data,
            });
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
}

export default new SiteService();
