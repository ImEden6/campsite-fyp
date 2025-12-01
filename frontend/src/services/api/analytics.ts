/**
 * Analytics API Service
 * Handles all analytics and reporting related API calls
 */

import { get } from './client';
import type { ApiResponse } from './types';
import type { DateRange } from '../../types/common';

/**
 * Analytics Types
 */
export interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number; // percentage change from previous period
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
  growth: number; // percentage
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
    ageGroups: {
      range: string;
      count: number;
      percentage: number;
    }[];
    locations: {
      state: string;
      count: number;
      percentage: number;
    }[];
  };
  bookingPatterns: {
    averageStayDuration: number;
    preferredSiteTypes: {
      type: string;
      count: number;
      percentage: number;
    }[];
    seasonalTrends: {
      month: string;
      bookings: number;
    }[];
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

export interface RevenueParams extends DateRange {
  groupBy?: 'day' | 'week' | 'month';
  siteType?: string;
}

export interface OccupancyParams extends DateRange {
  siteType?: string;
}

export interface ReportType {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'customer' | 'inventory';
  parameters: ReportParameter[];
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'number' | 'text';
  required: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: unknown;
}

export interface ReportConfig {
  reportTypeId: string;
  parameters: Record<string, unknown>;
  format: 'csv' | 'pdf' | 'excel';
}

export interface GeneratedReport {
  id: string;
  reportTypeId: string;
  reportName: string;
  parameters: Record<string, unknown>;
  format: string;
  fileUrl: string;
  generatedAt: string;
  expiresAt: string;
}

/**
 * Get dashboard metrics
 */
export const getDashboardMetrics = async (
  dateRange?: DateRange
): Promise<DashboardMetrics> => {
  const params = dateRange ? {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  } : {};

  const response = await get<ApiResponse<DashboardMetrics>>(
    '/analytics/dashboard',
    { params }
  );
  return response.data;
};

/**
 * Get revenue metrics
 */
export const getRevenueMetrics = async (
  params: RevenueParams
): Promise<RevenueMetrics> => {
  const response = await get<ApiResponse<RevenueMetrics>>(
    '/analytics/revenue',
    { params }
  );
  return response.data;
};

/**
 * Get occupancy metrics
 */
export const getOccupancyMetrics = async (
  params: OccupancyParams
): Promise<OccupancyMetrics> => {
  const response = await get<ApiResponse<OccupancyMetrics>>(
    '/analytics/occupancy',
    { params }
  );
  return response.data;
};

/**
 * Get customer insights
 */
export const getCustomerInsights = async (
  dateRange?: DateRange
): Promise<CustomerInsights> => {
  const params = dateRange ? {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  } : {};

  const response = await get<ApiResponse<CustomerInsights>>(
    '/analytics/customers',
    { params }
  );
  return response.data;
};

/**
 * Get site performance metrics
 */
export const getSitePerformance = async (
  dateRange?: DateRange
): Promise<SitePerformance[]> => {
  const params = dateRange ? {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  } : {};

  const response = await get<ApiResponse<SitePerformance[]>>(
    '/analytics/sites',
    { params }
  );
  return response.data;
};

/**
 * Get available report types
 */
export const getReportTypes = async (): Promise<ReportType[]> => {
  const response = await get<ApiResponse<ReportType[]>>('/analytics/reports/types');
  return response.data;
};

/**
 * Generate a report
 */
export const generateReport = async (
  config: ReportConfig
): Promise<GeneratedReport> => {
  const response = await get<ApiResponse<GeneratedReport>>(
    '/analytics/reports/generate',
    { params: config }
  );
  return response.data;
};

/**
 * Get report history
 */
export const getReportHistory = async (): Promise<GeneratedReport[]> => {
  const response = await get<ApiResponse<GeneratedReport[]>>('/analytics/reports/history');
  return response.data;
};

/**
 * Download report file
 */
export const downloadReport = async (reportId: string): Promise<Blob> => {
  const response = await get<Blob>(
    `/analytics/reports/${reportId}/download`,
    { responseType: 'blob' }
  );
  return response;
};
