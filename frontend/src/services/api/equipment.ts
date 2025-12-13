/**
 * Equipment API Service
 * Handles all equipment-related API calls
 */

import { get, post, put, del } from './client';
import type { Equipment, EquipmentRental, EquipmentCategory, EquipmentStatus, EquipmentFilters } from '@/types';
import type { PaginatedResponse, ApiResponse } from './types';
import { getMockEquipmentWithAvailability, getMockEquipment } from './mock-equipment';

export interface EquipmentAvailability {
  equipmentId: string;
  availableQuantity: number;
  startDate: Date;
  endDate: Date;
}

export interface EquipmentWithAvailability extends Equipment {
  available: boolean;
  conflictingBookings?: Array<{
    bookingId: string;
    startDate: Date;
    endDate: Date;
  }>;
}

export interface CreateEquipmentRequest {
  name: string;
  description?: string;
  category: EquipmentCategory;
  quantity: number;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  deposit: number;
  images?: string[];
  specifications?: Record<string, unknown>;
}

export interface UpdateEquipmentRequest extends Partial<CreateEquipmentRequest> {
  status?: EquipmentStatus;
  availableQuantity?: number;
}

export interface CreateRentalRequest {
  bookingId: string;
  equipmentId: string;
  quantity: number;
  startDate: Date;
  endDate: Date;
}

export interface UpdateRentalRequest {
  returnedAt?: Date;
  condition?: string;
  notes?: string;
}

/**
 * Get all equipment with optional filters
 */
export const getEquipment = async (
  filters?: EquipmentFilters,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Equipment>> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Handle category filter (single value or array)
    if (filters?.category) {
      const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
      categories.forEach(cat => params.append('category', String(cat)));
    }

    // Handle status filter (single value or array)
    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      statuses.forEach(stat => params.append('status', String(stat)));
    }

    // Handle search term (supports both 'search' and 'searchTerm' properties)
    const searchTerm = filters?.search || filters?.searchTerm;
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    // Handle price filters
    if (filters?.minPrice !== undefined) {
      params.append('minPrice', filters.minPrice.toString());
    }
    if (filters?.maxPrice !== undefined) {
      params.append('maxPrice', filters.maxPrice.toString());
    }

    // Handle availability filter
    if (filters?.availableOnly) {
      params.append('availableOnly', 'true');
    }

    const response = await get<PaginatedResponse<Equipment>>(`/equipment?${params.toString()}`);

    // Use mock data if API returns empty or invalid response
    if (!response || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
      const mockData = getMockEquipment();
      return {
        data: mockData,
        pagination: {
          page: 1,
          limit: mockData.length,
          total: mockData.length,
          pages: 1,
        },
        success: true,
        message: 'Using mock equipment data',
      };
    }

    return response;
  } catch (error) {
    // Fallback to mock data on any error (network, 404, 500, etc.)
    console.warn('Failed to fetch equipment from API, using mock data:', error);
    const mockData = getMockEquipment();
    return {
      data: mockData,
      pagination: {
        page: 1,
        limit: mockData.length,
        total: mockData.length,
        pages: 1,
      },
      success: true,
      message: 'Using mock equipment data (API unavailable)',
    };
  }
};

/**
 * Get equipment by ID
 */
export const getEquipmentById = async (id: string): Promise<ApiResponse<Equipment>> => {
  return get<ApiResponse<Equipment>>(`/equipment/${id}`);
};

/**
 * Check equipment availability for date range
 */
export const checkEquipmentAvailability = async (
  equipmentId: string,
  startDate: Date,
  endDate: Date
): Promise<ApiResponse<EquipmentAvailability>> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  return get<ApiResponse<EquipmentAvailability>>(
    `/equipment/${equipmentId}/availability?${params.toString()}`
  );
};

/**
 * Get available equipment for a date range
 * Returns all equipment with availability status for the specified period
 * Falls back to mock data if API is unavailable
 */
export const getAvailableEquipment = async (
  startDate: Date,
  endDate: Date,
  siteId?: string,
  equipmentType?: string
): Promise<ApiResponse<EquipmentWithAvailability[]>> => {
  try {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (siteId) {
      params.append('siteId', siteId);
    }

    if (equipmentType) {
      params.append('equipmentType', equipmentType);
    }

    const response = await get<ApiResponse<EquipmentWithAvailability[]>>(`/equipment/available?${params.toString()}`);

    // Use mock data if API returns empty or invalid response
    if (!response || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
      return {
        data: getMockEquipmentWithAvailability(),
        success: true,
        message: 'Using mock equipment data'
      };
    }

    return response;
  } catch (error) {
    // Fallback to mock data on any error (network, 404, 500, etc.)
    console.warn('Failed to fetch equipment from API, using mock data:', error);
    return {
      data: getMockEquipmentWithAvailability(),
      success: true,
      message: 'Using mock equipment data (API unavailable)'
    };
  }
};

/**
 * Create new equipment
 */
export const createEquipment = async (
  data: CreateEquipmentRequest
): Promise<ApiResponse<Equipment>> => {
  return post<ApiResponse<Equipment>>('/equipment', data);
};

/**
 * Update equipment
 */
export const updateEquipment = async (
  id: string,
  data: UpdateEquipmentRequest
): Promise<ApiResponse<Equipment>> => {
  return put<ApiResponse<Equipment>>(`/equipment/${id}`, data);
};

/**
 * Delete equipment
 */
export const deleteEquipment = async (id: string): Promise<ApiResponse<void>> => {
  return del<ApiResponse<void>>(`/equipment/${id}`);
};

/**
 * Get equipment rentals for a booking
 */
export const getBookingRentals = async (
  bookingId: string
): Promise<ApiResponse<EquipmentRental[]>> => {
  return get<ApiResponse<EquipmentRental[]>>(`/bookings/${bookingId}/rentals`);
};

/**
 * Create equipment rental
 */
export const createRental = async (
  data: CreateRentalRequest
): Promise<ApiResponse<EquipmentRental>> => {
  return post<ApiResponse<EquipmentRental>>('/equipment/rentals', data);
};

/**
 * Update equipment rental
 */
export const updateRental = async (
  id: string,
  data: UpdateRentalRequest
): Promise<ApiResponse<EquipmentRental>> => {
  return put<ApiResponse<EquipmentRental>>(`/equipment/rentals/${id}`, data);
};

/**
 * Delete equipment rental
 */
export const deleteRental = async (id: string): Promise<ApiResponse<void>> => {
  return del<ApiResponse<void>>(`/equipment/rentals/${id}`);
};

/**
 * Get equipment categories
 */
export const getEquipmentCategories = async (): Promise<ApiResponse<EquipmentCategory[]>> => {
  return get<ApiResponse<EquipmentCategory[]>>('/equipment/categories');
};

/**
 * Calculate rental pricing
 */
export const calculateRentalPrice = async (
  equipmentId: string,
  quantity: number,
  startDate: Date,
  endDate: Date
): Promise<ApiResponse<{ totalAmount: number; depositAmount: number; days: number }>> => {
  return post<ApiResponse<{ totalAmount: number; depositAmount: number; days: number }>>(
    '/equipment/calculate-price',
    {
      equipmentId,
      quantity,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  );
};
