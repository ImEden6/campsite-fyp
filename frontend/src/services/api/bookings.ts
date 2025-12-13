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
 * Falls back to mock data if API is unavailable
 */
export const getMyBookings = async (filters?: BookingFilters): Promise<Booking[]> => {
  try {
    const response = await get<ApiResponse<Booking[]>>('/bookings/my-bookings', {
      params: filters,
    });

    // Use mock data if API returns empty or invalid response
    if (!response || !response.data || response.data.length === 0) {
      const { getMockMyBookings } = await import('./mock-bookings');
      return getMockMyBookings();
    }

    return response.data;
  } catch (error) {
    // Fallback to mock data on any error
    console.warn('Failed to fetch bookings from API, using mock data:', error);
    const { getMockMyBookings } = await import('./mock-bookings');
    return getMockMyBookings();
  }
};

/**
 * Get upcoming bookings for current user
 * Falls back to mock data if API is unavailable
 */
export const getUpcomingBookings = async (): Promise<Booking[]> => {
  try {
    const response = await get<ApiResponse<Booking[]>>('/bookings/upcoming');

    // Use mock data if API returns empty or invalid response
    if (!response || !response.data || response.data.length === 0) {
      const { getMockUpcomingBookings } = await import('./mock-bookings');
      return getMockUpcomingBookings();
    }

    return response.data;
  } catch (error) {
    // Fallback to mock data on any error
    console.warn('Failed to fetch upcoming bookings from API, using mock data:', error);
    const { getMockUpcomingBookings } = await import('./mock-bookings');
    return getMockUpcomingBookings();
  }
};

/**
 * Get booking history for current user
 * Falls back to mock data if API is unavailable
 */
export const getBookingHistory = async (): Promise<Booking[]> => {
  try {
    const response = await get<ApiResponse<Booking[]>>('/bookings/history');

    // Use mock data if API returns empty or invalid response
    if (!response || !response.data || response.data.length === 0) {
      const { getMockBookingHistory } = await import('./mock-bookings');
      return getMockBookingHistory();
    }

    return response.data;
  } catch (error) {
    // Fallback to mock data on any error
    console.warn('Failed to fetch booking history from API, using mock data:', error);
    const { getMockBookingHistory } = await import('./mock-bookings');
    return getMockBookingHistory();
  }
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

/**
 * Guest Booking Functions
 */

export interface CreateGuestBookingData extends CreateBookingData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface GuestBookingResponse {
  booking: Booking;
  accessToken: string;
}

/**
 * Create a guest booking (no auth required)
 */
export const createGuestBooking = async (
  bookingData: CreateGuestBookingData
): Promise<GuestBookingResponse> => {
  const response = await post<ApiResponse<GuestBookingResponse>>('/bookings/guest', bookingData);
  return response.data!;
};

/**
 * Get guest booking by reference number (with token or email verification)
 */
export const getGuestBooking = async (
  bookingNumber: string,
  token?: string,
  email?: string
): Promise<Booking> => {
  const params: Record<string, string> = {};
  if (token) params.token = token;
  if (email) params.email = email;

  const response = await get<ApiResponse<Booking>>(`/bookings/guest/${bookingNumber}`, { params });
  return response.data!;
};

/**
 * Verify email for guest booking access
 */
export const verifyGuestBookingEmail = async (
  bookingNumber: string,
  email: string
): Promise<{ token: string }> => {
  const response = await post<ApiResponse<{ token: string }>>(
    `/bookings/guest/${bookingNumber}/verify`,
    { email }
  );
  return response.data!;
};