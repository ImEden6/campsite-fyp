/**
 * Bookings API Service
 * Handles all booking-related API calls
 */

import { get, post, put } from './client';
import type {
  Booking,
  BookingStatus,
  Vehicle,
  PaginatedResponse,
  ApiResponse,
  BookingFilters,
} from '@/types';

export interface CreateBookingData {
  siteId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: {
    adults: number;
    children: number;
    pets: number;
  };
  vehicles: Omit<Vehicle, 'id'>[];
  specialRequests?: string;
  equipmentRentals?: {
    equipmentId: string;
    quantity: number;
  }[];
}

export interface UpdateBookingData {
  checkInDate?: string;
  checkOutDate?: string;
  guests?: {
    adults: number;
    children: number;
    pets: number;
  };
  vehicles?: Omit<Vehicle, 'id'>[];
  specialRequests?: string;
  status?: BookingStatus;
}

export interface BookingPricing {
  basePrice: number;
  nights: number;
  subtotal: number;
  taxAmount: number;
  depositAmount: number;
  equipmentTotal: number;
  discountAmount: number;
  totalAmount: number;
  breakdown: {
    date: string;
    rate: number;
    description: string;
  }[];
}

/**
 * Get all bookings with optional filters
 */
export const getBookings = async (filters?: BookingFilters): Promise<Booking[]> => {
  console.log('[getBookings] Calling API with filters:', filters);
  try {
    const response = await get<ApiResponse<Booking[]>>('/bookings', { params: filters });
    console.log('[getBookings] API response:', response);
    return response.data || [];
  } catch (error) {
    console.error('[getBookings] API error:', error);
    throw error;
  }
};

/**
 * Get paginated bookings
 */
export const getBookingsPaginated = async (
  page: number = 1,
  limit: number = 10,
  filters?: BookingFilters
): Promise<PaginatedResponse<Booking>> => {
  const response = await get<PaginatedResponse<Booking>>('/bookings/paginated', {
    params: { page, limit, ...filters },
  });
  return response;
};

/**
 * Get booking by ID
 */
export const getBookingById = async (id: string): Promise<Booking> => {
  const response = await get<ApiResponse<Booking>>(`/bookings/${id}`);
  return response.data!;
};

/**
 * Get current user's bookings
 */
export const getMyBookings = async (filters?: BookingFilters): Promise<Booking[]> => {
  const response = await get<ApiResponse<Booking[]>>('/bookings/my-bookings', {
    params: filters,
  });
  return response.data || [];
};

/**
 * Get upcoming bookings for current user
 */
export const getUpcomingBookings = async (): Promise<Booking[]> => {
  const response = await get<ApiResponse<Booking[]>>('/bookings/upcoming');
  return response.data || [];
};

/**
 * Get booking history for current user
 */
export const getBookingHistory = async (): Promise<Booking[]> => {
  const response = await get<ApiResponse<Booking[]>>('/bookings/history');
  return response.data || [];
};

/**
 * Calculate booking pricing
 */
export const calculateBookingPrice = async (
  siteId: string,
  checkInDate: string,
  checkOutDate: string,
  equipmentRentals?: { equipmentId: string; quantity: number }[]
): Promise<BookingPricing> => {
  const response = await post<ApiResponse<BookingPricing>>('/bookings/calculate-price', {
    siteId,
    checkInDate,
    checkOutDate,
    equipmentRentals,
  });
  return response.data!;
};

/**
 * Create a new booking
 */
export const createBooking = async (bookingData: CreateBookingData): Promise<Booking> => {
  const response = await post<ApiResponse<Booking>>('/bookings', bookingData);
  return response.data!;
};

/**
 * Update booking
 */
export const updateBooking = async (
  id: string,
  bookingData: UpdateBookingData
): Promise<Booking> => {
  const response = await put<ApiResponse<Booking>>(`/bookings/${id}`, bookingData);
  return response.data!;
};

/**
 * Cancel booking
 */
export const cancelBooking = async (id: string, reason?: string): Promise<Booking> => {
  const response = await post<ApiResponse<Booking>>(`/bookings/${id}/cancel`, { reason });
  return response.data!;
};

export interface CancellationRefund {
  refundAmount: number;
  refundPercentage: number;
  cancellationFee: number;
  reason: string;
}

/**
 * Calculate cancellation refund
 */
export const calculateCancellationRefund = async (id: string): Promise<CancellationRefund> => {
  const response = await get<ApiResponse<CancellationRefund>>(`/bookings/${id}/refund-calculation`);
  return response.data!;
};

/**
 * Check-in booking (Staff only)
 */
export const checkInBooking = async (id: string): Promise<Booking> => {
  const response = await post<ApiResponse<Booking>>(`/bookings/${id}/check-in`);
  return response.data!;
};

/**
 * Check-out booking (Staff only)
 */
export const checkOutBooking = async (id: string): Promise<Booking> => {
  const response = await post<ApiResponse<Booking>>(`/bookings/${id}/check-out`);
  return response.data!;
};

/**
 * Get booking QR code
 */
export const getBookingQRCode = async (id: string): Promise<string> => {
  const response = await get<ApiResponse<{ qrCode: string }>>(`/bookings/${id}/qr-code`);
  return response.data!.qrCode;
};
