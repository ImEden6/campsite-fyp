import { Router, Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '@/database';

const router = Router();

const useMockData = (): boolean => {
    return process.env.USE_MOCK_DATA === 'true' || process.env.NODE_ENV === 'development';
};

/**
 * GET /public/stats
 * Public stats endpoint for homepage - no authentication required
 * Returns real-time counts from the database
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
    console.log('=== PUBLIC STATS DEBUG ===');
    console.log('USE_MOCK_DATA:', process.env.USE_MOCK_DATA);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('useMockData():', useMockData());
    
    try {
        // Return mock data in mock mode
        if (useMockData()) {
            console.log('Using mock data');
            return res.json({
                data: {
                    siteCount: 8,
                    sitesByType: { cabins: 2, rv: 3, tents: 3 },
                    activeBookings: 12,
                    totalCustomers: 4,
                },
            });
        }

        console.log('Getting Prisma client from database module...');
        
        const prisma = getPrismaClient();
        
        // Use raw SQL for everything to avoid Prisma enum issues
        console.log('Fetching data with raw SQL...');
        
        // Get total sites
        const siteCountResult = await prisma.$queryRaw<Array<{count: bigint}>>`SELECT COUNT(*) as count FROM sites`;
        const totalSites = Number(siteCountResult[0]?.count || 0);
        
        // Get sites by type
        const sitesByTypeResult = await prisma.$queryRaw<Array<{type: string, count: bigint}>>`
            SELECT type, COUNT(*) as count FROM sites GROUP BY type
        `;
        
        const sitesByTypeObj = {
            cabins: Number(sitesByTypeResult.find(s => s.type === 'CABIN')?.count || 0),
            rv: Number(sitesByTypeResult.find(s => s.type === 'RV')?.count || 0),
            tents: Number(sitesByTypeResult.find(s => s.type === 'TENT')?.count || 0),
        };
        
        // Get bookings this month (using raw SQL for status too)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const bookingsResult = await prisma.$queryRaw<Array<{count: bigint}>>`
            SELECT COUNT(*) as count FROM bookings 
            WHERE "checkInDate" >= ${startOfMonth} 
            AND "checkInDate" <= ${endOfMonth}
            AND status IN ('CONFIRMED', 'CHECKED_IN')
        `;
        const activeBookingsThisMonth = Number(bookingsResult[0]?.count || 0);
        
        // Get total customers
        const customersResult = await prisma.$queryRaw<Array<{count: bigint}>>`
            SELECT COUNT(*) as count FROM users WHERE role = 'CUSTOMER'
        `;
        const totalCustomers = Number(customersResult[0]?.count || 0);

        console.log('Data fetched:', { totalSites, activeBookingsThisMonth, totalCustomers });

        res.json({
            data: {
                siteCount: totalSites,
                sitesByType: sitesByTypeObj,
                activeBookings: activeBookingsThisMonth,
                totalCustomers,
            },
        });
    } catch (error: any) {
        console.error('ERROR:', error.message);
        console.error('STACK:', error.stack);
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                code: 'INTERNAL_ERROR',
                statusCode: 500,
            },
            timestamp: new Date().toISOString(),
        });
    }
});

export default router;