/**
 * Mock Analytics Data
 * Provides realistic mock data for local development when API is unavailable
 * Data varies based on date range for realistic demo behavior
 */

import type {
    DashboardMetrics,
    RevenueMetrics,
    RevenueDataPoint,
    OccupancyMetrics,
    OccupancyDataPoint,
    CustomerInsights,
    SitePerformance,
} from './analytics';

// Seeded random number generator for consistent results per date range
const seededRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

// Get a consistent seed from a date string
const getDateSeed = (dateStr: string): number => {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        const char = dateStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

// Calculate number of days between two dates
const getDaysBetween = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
};

// Generate dates within a range
const generateDateRangeArray = (startDate: string, endDate: string): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    const current = new Date(start);
    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]!);
        current.setDate(current.getDate() + 1);
    }
    return dates;
};

// Generate revenue time series data for a specific date range
const generateRevenueTimeSeries = (startDate: string, endDate: string): RevenueDataPoint[] => {
    const dates = generateDateRangeArray(startDate, endDate);
    const baseSeed = getDateSeed(startDate + endDate);

    return dates.map((date, index) => {
        const dateSeed = getDateSeed(date);
        const combinedSeed = baseSeed + dateSeed + index;

        // Base revenue varies by day of week and season
        const dayOfWeek = new Date(date).getDay();
        const month = new Date(date).getMonth();

        // Seasonal multiplier (summer months are busier)
        const seasonalMultiplier = 0.7 + 0.6 * Math.sin((month - 3) * Math.PI / 6);

        // Weekend boost
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const weekendMultiplier = isWeekend ? 1.4 : 1.0;

        // Base daily revenue
        const baseRevenue = 2200 * seasonalMultiplier * weekendMultiplier;
        const variation = (seededRandom(combinedSeed) - 0.5) * 800;

        return {
            date,
            revenue: Math.round(Math.max(500, baseRevenue + variation)),
            bookings: Math.max(1, Math.floor(seededRandom(combinedSeed + 1000) * 10) + (isWeekend ? 3 : 1)),
        };
    });
};

// Generate occupancy time series data for a specific date range
const generateOccupancyTimeSeries = (startDate: string, endDate: string): OccupancyDataPoint[] => {
    const dates = generateDateRangeArray(startDate, endDate);
    const baseSeed = getDateSeed(startDate + endDate);

    return dates.map((date, index) => {
        const dateSeed = getDateSeed(date);
        const combinedSeed = baseSeed + dateSeed + index;

        const dayOfWeek = new Date(date).getDay();
        const month = new Date(date).getMonth();

        // Seasonal base occupancy
        const seasonalBase = 45 + 35 * Math.sin((month - 3) * Math.PI / 6);

        // Weekend boost
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const weekendBase = isWeekend ? 20 : 0;

        const variation = (seededRandom(combinedSeed) - 0.5) * 15;
        const occupancyRate = Math.min(100, Math.max(15, seasonalBase + weekendBase + variation));
        const totalSites = 45;
        const occupiedSites = Math.round((occupancyRate / 100) * totalSites);

        return {
            date,
            occupancyRate: Math.round(occupancyRate * 10) / 10,
            totalSites,
            occupiedSites,
        };
    });
};

/**
 * Generate Dashboard Metrics based on date range
 */
export const generateMockDashboardMetrics = (dateRange?: { startDate: string; endDate: string }): DashboardMetrics => {
    const start = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
    const end = dateRange?.endDate || new Date().toISOString().split('T')[0]!;
    const days = getDaysBetween(start, end);
    const seed = getDateSeed(start + end);

    // Scale metrics based on date range length
    const dayMultiplier = days / 30; // Normalize to 30-day period

    // Generate consistent but varied metrics
    const baseRevenue = 65000 + seededRandom(seed) * 40000;
    const totalRevenue = Math.round(baseRevenue * dayMultiplier);
    const revenueChange = (seededRandom(seed + 1) * 30) - 10; // -10% to +20%

    const baseOccupancy = 55 + seededRandom(seed + 2) * 30;
    const occupancyRate = Math.min(95, Math.max(35, baseOccupancy));
    const occupancyChange = (seededRandom(seed + 3) * 20) - 8;

    const baseBookings = 25 + seededRandom(seed + 4) * 20;
    const activeBookings = Math.round(baseBookings * Math.sqrt(dayMultiplier));
    const bookingsChange = (seededRandom(seed + 5) * 25) - 10;

    const baseCustomers = 800 + seededRandom(seed + 6) * 800;
    const totalCustomers = Math.round(baseCustomers * dayMultiplier);
    const customersChange = (seededRandom(seed + 7) * 20) - 5;

    return {
        totalRevenue: Math.round(totalRevenue),
        revenueChange: Math.round(revenueChange * 10) / 10,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        occupancyChange: Math.round(occupancyChange * 10) / 10,
        activeBookings,
        bookingsChange: Math.round(bookingsChange * 10) / 10,
        totalCustomers,
        customersChange: Math.round(customersChange * 10) / 10,
        averageBookingValue: Math.round(150 + seededRandom(seed + 8) * 80),
        averageStayDuration: Math.round((2.5 + seededRandom(seed + 9) * 2) * 10) / 10,
    };
};

/**
 * Generate Revenue Metrics based on date range
 */
export const generateMockRevenueMetrics = (dateRange?: { startDate: string; endDate: string }): RevenueMetrics => {
    const start = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
    const end = dateRange?.endDate || new Date().toISOString().split('T')[0]!;
    const seed = getDateSeed(start + end);
    const timeSeries = generateRevenueTimeSeries(start, end);

    const total = timeSeries.reduce((sum, d) => sum + d.revenue, 0);

    // Distribute revenue by type with some variation
    const cabinPct = 40 + seededRandom(seed) * 15;
    const rvPct = 25 + seededRandom(seed + 1) * 15;
    const tentPct = 100 - cabinPct - rvPct;

    return {
        total,
        byType: [
            { siteType: 'Cabins', revenue: Math.round(total * cabinPct / 100), percentage: Math.round(cabinPct * 10) / 10 },
            { siteType: 'RV Sites', revenue: Math.round(total * rvPct / 100), percentage: Math.round(rvPct * 10) / 10 },
            { siteType: 'Tent Sites', revenue: Math.round(total * tentPct / 100), percentage: Math.round(tentPct * 10) / 10 },
        ],
        timeSeries,
        growth: Math.round((seededRandom(seed + 2) * 25 - 5) * 10) / 10,
    };
};

/**
 * Generate Occupancy Metrics based on date range
 */
export const generateMockOccupancyMetrics = (dateRange?: { startDate: string; endDate: string }): OccupancyMetrics => {
    const start = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
    const end = dateRange?.endDate || new Date().toISOString().split('T')[0]!;
    const seed = getDateSeed(start + end);
    const timeSeries = generateOccupancyTimeSeries(start, end);

    const overall = timeSeries.reduce((sum, d) => sum + d.occupancyRate, 0) / timeSeries.length;

    // Find peak days (top 3 occupancy days)
    const sortedByOccupancy = [...timeSeries].sort((a, b) => b.occupancyRate - a.occupancyRate);
    const peakDays = sortedByOccupancy.slice(0, 3).map(d => ({
        date: d.date,
        occupancyRate: d.occupancyRate,
    }));

    return {
        overall: Math.round(overall * 10) / 10,
        byType: [
            { siteType: 'Cabins', occupancyRate: Math.round((75 + seededRandom(seed) * 20) * 10) / 10, totalSites: 12, occupiedSites: Math.round(12 * (0.7 + seededRandom(seed + 1) * 0.25)) },
            { siteType: 'RV Sites', occupancyRate: Math.round((55 + seededRandom(seed + 2) * 25) * 10) / 10, totalSites: 20, occupiedSites: Math.round(20 * (0.5 + seededRandom(seed + 3) * 0.3)) },
            { siteType: 'Tent Sites', occupancyRate: Math.round((40 + seededRandom(seed + 4) * 30) * 10) / 10, totalSites: 13, occupiedSites: Math.round(13 * (0.35 + seededRandom(seed + 5) * 0.35)) },
        ],
        timeSeries,
        peakDays,
    };
};

/**
 * Generate Customer Insights based on date range
 */
export const generateMockCustomerInsights = (dateRange?: { startDate: string; endDate: string }): CustomerInsights => {
    const start = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
    const end = dateRange?.endDate || new Date().toISOString().split('T')[0]!;
    const days = getDaysBetween(start, end);
    const seed = getDateSeed(start + end);
    const dayMultiplier = days / 30;

    const baseCustomers = Math.round((900 + seededRandom(seed) * 500) * dayMultiplier);
    const newCustomerRate = 0.12 + seededRandom(seed + 1) * 0.1;
    const newCustomers = Math.round(baseCustomers * newCustomerRate);
    const returningCustomers = baseCustomers - newCustomers;

    return {
        totalCustomers: baseCustomers,
        newCustomers,
        returningCustomers,
        retentionRate: Math.round((65 + seededRandom(seed + 2) * 20) * 10) / 10,
        averageLifetimeValue: Math.round(350 + seededRandom(seed + 3) * 250),
        demographics: {
            ageGroups: [
                { range: '18-24', count: Math.round(baseCustomers * 0.08), percentage: 8 + seededRandom(seed + 10) * 4 },
                { range: '25-34', count: Math.round(baseCustomers * 0.24), percentage: 22 + seededRandom(seed + 11) * 6 },
                { range: '35-44', count: Math.round(baseCustomers * 0.28), percentage: 26 + seededRandom(seed + 12) * 6 },
                { range: '45-54', count: Math.round(baseCustomers * 0.22), percentage: 20 + seededRandom(seed + 13) * 5 },
                { range: '55-64', count: Math.round(baseCustomers * 0.12), percentage: 10 + seededRandom(seed + 14) * 4 },
                { range: '65+', count: Math.round(baseCustomers * 0.06), percentage: 5 + seededRandom(seed + 15) * 3 },
            ],
            locations: [
                { state: 'Local (Within 50mi)', count: Math.round(baseCustomers * 0.35), percentage: 33 + seededRandom(seed + 20) * 5 },
                { state: 'Regional (50-150mi)', count: Math.round(baseCustomers * 0.28), percentage: 26 + seededRandom(seed + 21) * 4 },
                { state: 'State-wide', count: Math.round(baseCustomers * 0.20), percentage: 18 + seededRandom(seed + 22) * 4 },
                { state: 'Neighboring States', count: Math.round(baseCustomers * 0.12), percentage: 10 + seededRandom(seed + 23) * 4 },
                { state: 'Out of State', count: Math.round(baseCustomers * 0.05), percentage: 5 + seededRandom(seed + 24) * 3 },
            ],
        },
        bookingPatterns: {
            averageStayDuration: Math.round((2.5 + seededRandom(seed + 4) * 2) * 10) / 10,
            preferredSiteTypes: [
                { type: 'Cabins', count: Math.round(baseCustomers * 0.38), percentage: 36 + seededRandom(seed + 30) * 6 },
                { type: 'RV Sites', count: Math.round(baseCustomers * 0.35), percentage: 32 + seededRandom(seed + 31) * 6 },
                { type: 'Tent Sites', count: Math.round(baseCustomers * 0.27), percentage: 25 + seededRandom(seed + 32) * 6 },
            ],
            seasonalTrends: [
                { month: 'Jan', bookings: Math.round(40 + seededRandom(seed + 40) * 20) },
                { month: 'Feb', bookings: Math.round(45 + seededRandom(seed + 41) * 20) },
                { month: 'Mar', bookings: Math.round(70 + seededRandom(seed + 42) * 25) },
                { month: 'Apr', bookings: Math.round(95 + seededRandom(seed + 43) * 25) },
                { month: 'May', bookings: Math.round(130 + seededRandom(seed + 44) * 30) },
                { month: 'Jun', bookings: Math.round(165 + seededRandom(seed + 45) * 35) },
                { month: 'Jul', bookings: Math.round(185 + seededRandom(seed + 46) * 30) },
                { month: 'Aug', bookings: Math.round(175 + seededRandom(seed + 47) * 30) },
                { month: 'Sep', bookings: Math.round(115 + seededRandom(seed + 48) * 30) },
                { month: 'Oct', bookings: Math.round(90 + seededRandom(seed + 49) * 25) },
                { month: 'Nov', bookings: Math.round(55 + seededRandom(seed + 50) * 20) },
                { month: 'Dec', bookings: Math.round(50 + seededRandom(seed + 51) * 20) },
            ],
        },
    };
};

/**
 * Generate Site Performance based on date range
 */
export const generateMockSitePerformance = (dateRange?: { startDate: string; endDate: string }): SitePerformance[] => {
    const start = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
    const end = dateRange?.endDate || new Date().toISOString().split('T')[0]!;
    const days = getDaysBetween(start, end);
    const seed = getDateSeed(start + end);
    const dayMultiplier = Math.sqrt(days / 30); // Sublinear scaling for bookings

    const sites = [
        { id: '1', name: 'Lakeside Cabin A', type: 'Cabin', baseRevenue: 8000, baseBookings: 25 },
        { id: '2', name: 'Mountain View Cabin', type: 'Cabin', baseRevenue: 7500, baseBookings: 22 },
        { id: '3', name: 'Premium RV Spot 1', type: 'RV', baseRevenue: 5500, baseBookings: 38 },
        { id: '4', name: 'Riverside RV Spot', type: 'RV', baseRevenue: 5000, baseBookings: 35 },
        { id: '5', name: 'Forest Tent Site A', type: 'Tent', baseRevenue: 2800, baseBookings: 48 },
        { id: '6', name: 'Sunset Cabin', type: 'Cabin', baseRevenue: 6500, baseBookings: 20 },
        { id: '7', name: 'Creek Side Tent', type: 'Tent', baseRevenue: 2400, baseBookings: 42 },
        { id: '8', name: 'Hilltop RV Spot', type: 'RV', baseRevenue: 4800, baseBookings: 32 },
    ];

    return sites.map((site, index) => {
        const siteSeed = seed + index * 100;
        const variation = 0.7 + seededRandom(siteSeed) * 0.6; // 70% to 130% variation

        return {
            siteId: site.id,
            siteName: site.name,
            siteType: site.type,
            revenue: Math.round(site.baseRevenue * dayMultiplier * variation),
            bookings: Math.round(site.baseBookings * dayMultiplier * variation),
            occupancyRate: Math.round((50 + seededRandom(siteSeed + 1) * 45) * 10) / 10,
            averageRating: Math.round((4.0 + seededRandom(siteSeed + 2) * 0.9) * 10) / 10,
            averageStayDuration: Math.round((1.5 + seededRandom(siteSeed + 3) * 3) * 10) / 10,
        };
    });
};

// Static exports for backward compatibility (uses 30-day default range)
export const mockDashboardMetrics = generateMockDashboardMetrics();
export const mockRevenueMetrics = generateMockRevenueMetrics();
export const mockOccupancyMetrics = generateMockOccupancyMetrics();
export const mockCustomerInsights = generateMockCustomerInsights();
export const mockSitePerformance = generateMockSitePerformance();

/**
 * Helper to get all mock analytics data for a specific date range
 */
export const getMockAnalyticsData = (dateRange?: { startDate: string; endDate: string }) => ({
    dashboardMetrics: generateMockDashboardMetrics(dateRange),
    revenueMetrics: generateMockRevenueMetrics(dateRange),
    occupancyMetrics: generateMockOccupancyMetrics(dateRange),
    customerInsights: generateMockCustomerInsights(dateRange),
    sitePerformance: generateMockSitePerformance(dateRange),
});
