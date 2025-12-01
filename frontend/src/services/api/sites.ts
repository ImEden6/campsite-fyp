/**
 * Sites API Service
 * Handles all site-related API calls
 */

import { get, post, put, del } from './client';
import type { Site, SiteType, SiteStatus, PaginatedResponse, ApiResponse } from '@/types';

export interface SiteFilters {
  type?: SiteType[];
  status?: SiteStatus[];
  amenities?: string[];
  priceRange?: { min: number; max: number };
  capacity?: { min: number; max: number };
  searchTerm?: string;
  isPetFriendly?: boolean;
  hasElectricity?: boolean;
  hasWater?: boolean;
  hasSewer?: boolean;
  hasWifi?: boolean;
}

export interface AvailabilityParams {
  startDate: string;
  endDate: string;
  siteType?: SiteType;
  guests?: number;
}

export interface SiteAvailability extends Site {
  isAvailable: boolean;
  unavailableDates?: string[];
  nextAvailableDate?: string;
}

/**
 * Get all sites with optional filters
 */
export const getSites = async (filters?: SiteFilters): Promise<Site[]> => {
  const response = await get<ApiResponse<Site[]>>('/sites', { params: filters });
  return response.data || [];
};

/**
 * Get paginated sites
 */
export const getSitesPaginated = async (
  page: number = 1,
  limit: number = 10,
  filters?: SiteFilters
): Promise<PaginatedResponse<Site>> => {
  const response = await get<PaginatedResponse<Site>>('/sites/paginated', {
    params: { page, limit, ...filters },
  });
  return response;
};

/**
 * Get site by ID
 */
export const getSiteById = async (id: string): Promise<Site> => {
  const response = await get<ApiResponse<Site>>(`/sites/${id}`);
  return response.data!;
};

/**
 * Get available sites for date range
 */
export const getAvailableSites = async (
  params: AvailabilityParams
): Promise<SiteAvailability[]> => {
  const response = await get<ApiResponse<SiteAvailability[]>>('/sites/availability', {
    params,
  });
  return response.data || [];
};

/**
 * Get site amenities list
 */
export const getSiteAmenities = async (): Promise<string[]> => {
  const response = await get<ApiResponse<string[]>>('/sites/amenities');
  return response.data || [];
};

/**
 * Create a new site (Admin only)
 */
export const createSite = async (siteData: Partial<Site>): Promise<Site> => {
  const response = await post<ApiResponse<Site>>('/sites', siteData);
  return response.data!;
};

/**
 * Update site (Admin only)
 */
export const updateSite = async (id: string, siteData: Partial<Site>): Promise<Site> => {
  const response = await put<ApiResponse<Site>>(`/sites/${id}`, siteData);
  return response.data!;
};

/**
 * Delete site (Admin only)
 */
export const deleteSite = async (id: string): Promise<void> => {
  await del(`/sites/${id}`);
};

/**
 * Upload site images
 */
export const uploadSiteImages = async (siteId: string, files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await post<ApiResponse<string[]>>(`/sites/${siteId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data || [];
};

/**
 * Delete site image
 */
export const deleteSiteImage = async (siteId: string, imageUrl: string): Promise<void> => {
  await del(`/sites/${siteId}/images`, { data: { imageUrl } });
};

/**
 * Check if a specific site is available for date range
 */
export const checkSiteAvailability = async (
  siteId: string,
  startDate: string,
  endDate: string,
  excludeBookingId?: string
): Promise<boolean> => {
  const response = await get<ApiResponse<{ available: boolean }>>(`/sites/${siteId}/check-availability`, {
    params: { startDate, endDate, excludeBookingId },
  });
  return response.data?.available || false;
};
