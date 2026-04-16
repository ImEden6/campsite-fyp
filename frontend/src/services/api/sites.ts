/**
 * Sites API Service
 * Handles all site-related API calls
 */

import { get, post, put, del } from './client';
import { shouldUseMockAuth } from './mock-auth';
import type {
  Site,
  SiteFilters,
  AvailabilityParams,
  SiteAvailability,
  PaginatedResponse,
  ApiResponse,
} from '@/types';
import { SiteType, SiteStatus, MeasurementUnit } from '@/types';

const MOCK_SITES: Site[] = [
  {
    id: 'tent-1',
    name: 'Pine Grove Tent Site',
    type: SiteType.TENT,
    status: SiteStatus.AVAILABLE,
    capacity: 6,
    description: 'A peaceful tent site surrounded by pine trees',
    amenities: ['campfire', 'picnic table', 'near bathroom'],
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4'],
    basePrice: 35,
    maxVehicles: 1,
    maxTents: 2,
    isPetFriendly: true,
    hasElectricity: false,
    hasWater: false,
    hasSewer: false,
    hasWifi: false,
    size: {
      length: 20,
      width: 20,
      unit: MeasurementUnit.FEET,
    },
    location: {
      latitude: 45.1234,
      longitude: -122.5678,
      mapPosition: { x: 100, y: 200 },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'tent-2',
    name: 'Riverside Camp Spot',
    type: SiteType.TENT,
    status: SiteStatus.AVAILABLE,
    capacity: 4,
    description: 'Camp right by the river with beautiful views',
    amenities: ['river access', 'campfire', 'fishing'],
    images: ['https://images.unsplash.com/photo-1537905569824-f89f14cceb68'],
    basePrice: 45,
    maxVehicles: 1,
    maxTents: 1,
    isPetFriendly: true,
    hasElectricity: false,
    hasWater: true,
    hasSewer: false,
    hasWifi: false,
    size: {
      length: 15,
      width: 15,
      unit: MeasurementUnit.FEET,
    },
    location: {
      latitude: 45.1245,
      longitude: -122.5689,
      mapPosition: { x: 150, y: 220 },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'rv-1',
    name: 'Premium RV Pad 1',
    type: SiteType.RV,
    status: SiteStatus.AVAILABLE,
    capacity: 6,
    description: 'Full hookup RV site with stunning mountain views',
    amenities: ['full hookup', 'wifi', 'dump station', 'laundry'],
    images: ['https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7'],
    basePrice: 75,
    maxVehicles: 2,
    maxTents: 0,
    isPetFriendly: true,
    hasElectricity: true,
    hasWater: true,
    hasSewer: true,
    hasWifi: true,
    size: {
      length: 45,
      width: 15,
      unit: MeasurementUnit.FEET,
    },
    location: {
      latitude: 45.1256,
      longitude: -122.5700,
      mapPosition: { x: 200, y: 240 },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'rv-2',
    name: 'Riverside RV Site',
    type: SiteType.RV,
    status: SiteStatus.OCCUPIED,
    capacity: 4,
    description: 'Spacious site by the river, perfect for larger RVs',
    amenities: ['river access', 'partial hookup', 'fire pit'],
    images: ['https://images.unsplash.com/photo-1510312305653-8ed496efae75'],
    basePrice: 65,
    maxVehicles: 2,
    maxTents: 0,
    isPetFriendly: false,
    hasElectricity: true,
    hasWater: true,
    hasSewer: false,
    hasWifi: false,
    size: {
      length: 50,
      width: 18,
      unit: MeasurementUnit.FEET,
    },
    location: {
      latitude: 45.1267,
      longitude: -122.5711,
      mapPosition: { x: 250, y: 260 },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cabin-1',
    name: 'Cozy Forest Cabin',
    type: SiteType.CABIN,
    status: SiteStatus.AVAILABLE,
    capacity: 4,
    description: 'Rustic cabin with modern amenities in the heart of the forest',
    amenities: ['beds', 'heating', 'kitchenette', 'porch', 'fire pit'],
    images: ['https://images.unsplash.com/photo-1476397463845-4c29e1a3087e'],
    basePrice: 125,
    maxVehicles: 2,
    maxTents: 0,
    isPetFriendly: false,
    hasElectricity: true,
    hasWater: true,
    hasSewer: true,
    hasWifi: true,
    size: {
      length: 25,
      width: 20,
      unit: MeasurementUnit.FEET,
    },
    location: {
      latitude: 45.1278,
      longitude: -122.5722,
      mapPosition: { x: 300, y: 280 },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cabin-2',
    name: 'Mountain View Lodge',
    type: SiteType.CABIN,
    status: SiteStatus.AVAILABLE,
    capacity: 8,
    description: 'Large cabin with panoramic mountain views and full kitchen',
    amenities: ['beds', 'heating', 'full kitchen', 'deck', 'hot tub'],
    images: ['https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8'],
    basePrice: 195,
    maxVehicles: 3,
    maxTents: 0,
    isPetFriendly: true,
    hasElectricity: true,
    hasWater: true,
    hasSewer: true,
    hasWifi: true,
    size: {
      length: 35,
      width: 25,
      unit: MeasurementUnit.FEET,
    },
    location: {
      latitude: 45.1289,
      longitude: -122.5733,
      mapPosition: { x: 350, y: 300 },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const filterMockSites = (sites: Site[], filters?: SiteFilters): Site[] => {
  if (!filters) return sites;

  return sites.filter(site => {
    if (filters.type?.length && !filters.type.includes(site.type)) return false;
    if (filters.status?.length && !filters.status.includes(site.status)) return false;
    if (filters.capacity?.min && site.capacity < filters.capacity.min) return false;
    if (filters.capacity?.max && site.capacity > filters.capacity.max) return false;
    if (filters.priceRange?.min && site.basePrice < filters.priceRange.min) return false;
    if (filters.priceRange?.max && site.basePrice > filters.priceRange.max) return false;
    return true;
  });
};

/**
 * Get all sites with optional filters
 */
export const getSites = async (filters?: SiteFilters | undefined): Promise<Site[]> => {
  if (shouldUseMockAuth()) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return filterMockSites(MOCK_SITES, filters);
  }

  const response = await get<ApiResponse<Site[]>>('/campsites', { params: filters });
  return response.data || [];
};

/**
 * Get paginated sites
 */
export const getSitesPaginated = async (
  page: number = 1,
  limit: number = 10,
  filters?: SiteFilters | undefined
): Promise<PaginatedResponse<Site>> => {
  if (shouldUseMockAuth()) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const filtered = filterMockSites(MOCK_SITES, filters);
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);
    return {
      items,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
      hasNext: start + limit < filtered.length,
      hasPrevious: page > 1,
    };
  }

  const response = await get<PaginatedResponse<Site>>('/campsites/paginated', {
    params: { page, limit, ...filters },
  });
  return response;
};

/**
 * Get site by ID
 */
export const getSiteById = async (id: string): Promise<Site> => {
  if (shouldUseMockAuth()) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const site = MOCK_SITES.find(s => s.id === id);
    if (!site) {
      throw new Error(`Site not found: ${id}`);
    }
    return site;
  }

  const response = await get<ApiResponse<Site>>(`/campsites/${id}`);
  if (!response.data) {
    throw new Error(`Site not found: ${id}`);
  }
  return response.data;
};

/**
 * Get available sites for date range
 */
export const getAvailableSites = async (
  params: AvailabilityParams
): Promise<SiteAvailability[]> => {
  const response = await get<ApiResponse<SiteAvailability[]>>('/campsites/availability', {
    params,
  });
  return response.data || [];
};

/**
 * Get site amenities list
 */
export const getSiteAmenities = async (): Promise<string[]> => {
  const response = await get<ApiResponse<string[]>>('/campsites/amenities');
  return response.data || [];
};

/**
 * Create a new site (Admin only)
 */
export const createSite = async (siteData: Partial<Site>): Promise<Site> => {
  const response = await post<ApiResponse<Site>>('/campsites', siteData);
  return response.data!;
};

/**
 * Update site (Admin only)
 */
export const updateSite = async (id: string, siteData: Partial<Site>): Promise<Site> => {
  const response = await put<ApiResponse<Site>>(`/campsites/${id}`, siteData);
  return response.data!;
};

/**
 * Delete site (Admin only)
 */
export const deleteSite = async (id: string): Promise<void> => {
  await del(`/campsites/${id}`);
};

/**
 * Upload site images
 */
export const uploadSiteImages = async (siteId: string, files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await post<ApiResponse<string[]>>(`/campsites/${siteId}/images`, formData, {
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
  await del(`/campsites/${siteId}/images`, { data: { imageUrl } });
};

/**
 * Check if a specific site is available for date range
 */
export const checkSiteAvailability = async (
  siteId: string,
  startDate: string,
  endDate: string,
  excludeBookingId?: string | undefined
): Promise<boolean> => {
  const response = await get<ApiResponse<{ available: boolean }>>(`/campsites/${siteId}/check-availability`, {
    params: { startDate, endDate, excludeBookingId },
  });
  return response.data?.available || false;
};
