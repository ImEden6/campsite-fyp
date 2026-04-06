export interface DateRange {
    startDate?: string;
    endDate?: string;
}

export interface DashboardMetrics {
    totalRevenue: number;
    revenueChange: number;
    occupancyRate: number;
    occupancyChange: number;
    activeBookings: number;
    bookingsChange: number;
    totalCustomers: number;
    customersChange: number;
    averageBookingValue: number;
    averageStayDuration: number;
}

export interface RevenueDataPoint {
    date: string;
    revenue: number;
    bookings: number;
    siteType?: string;
}

export interface RevenueMetrics {
    total: number;
    byType: {
        siteType: string;
        revenue: number;
        percentage: number;
    }[];
    timeSeries: RevenueDataPoint[];
    growth: number;
}

export interface OccupancyDataPoint {
    date: string;
    occupancyRate: number;
    totalSites: number;
    occupiedSites: number;
    siteType?: string;
}

export interface OccupancyMetrics {
    overall: number;
    byType: {
        siteType: string;
        occupancyRate: number;
        totalSites: number;
        occupiedSites: number;
    }[];
    timeSeries: OccupancyDataPoint[];
    peakDays: {
        date: string;
        occupancyRate: number;
    }[];
}

export interface CustomerInsights {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    retentionRate: number;
    averageLifetimeValue: number;
    demographics: {
        ageGroups: { range: string; count: number; percentage: number }[];
        locations: { state: string; count: number; percentage: number }[];
    };
    bookingPatterns: {
        averageStayDuration: number;
        preferredSiteTypes: { type: string; count: number; percentage: number }[];
        seasonalTrends: { month: string; bookings: number }[];
    };
}

export interface SitePerformance {
    siteId: string;
    siteName: string;
    siteType: string;
    revenue: number;
    bookings: number;
    occupancyRate: number;
    averageRating: number;
    averageStayDuration: number;
}
