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
  adultGuests: number;
  childGuests: number;
  petGuests: number;
  guests?: {
    firstName: string;
    lastName: string;
    email?: string | undefined;
    phone?: string | undefined;
    type: 'ADULT' | 'CHILD';
    isPrimary: boolean;
  }[] | undefined;
  vehicles: Omit<Vehicle, 'id'>[];
  specialRequests?: string | undefined;
  equipmentReservations?: {
    equipmentId: string;
    quantity: number;
  }[] | undefined;
}

export interface UpdateBookingData {
  checkInDate?: string | undefined;
  checkOutDate?: string | undefined;
  adultGuests?: number | undefined;
  childGuests?: number | undefined;
  petGuests?: number | undefined;
  guests?: {
    firstName: string;
    lastName: string;
    email?: string | undefined;
    phone?: string | undefined;
    type: 'ADULT' | 'CHILD';
    isPrimary: boolean;
  }[] | undefined;
  vehicles?: Omit<Vehicle, 'id'>[] | undefined;
  specialRequests?: string | undefined;
  status?: BookingStatus | undefined;
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
export const getBookings = async (filters?: BookingFilters | undefined): Promise<Booking[]> => {
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
  filters?: BookingFilters | undefined
): Promise<PaginatedResponse<Booking>> => {
  const response = await get<PaginatedResponse<Booking>>('/bookings/paginated', {
    params: { page, limit, ...filters },
  });
  return response;
};

/**
 * Get booking by ID
 * Falls back to mock booking if API is unavailable (MVP)
 */
export const getBookingById = async (id: string): Promise<Booking> => {
  const response = await get<ApiResponse<Booking>>(`/bookings/${id}`);
  if (!response.data) {
    throw new Error(`Booking not found: ${id}`);
  }
  return response.data;
};

/**
 * Get current user's bookings
 * Falls back to mock data if API is unavailable
 */
export const getMyBookings = async (filters?: BookingFilters | undefined): Promise<Booking[]> => {
  const response = await get<ApiResponse<Booking[]>>('/bookings/my-bookings', {
    params: filters,
  });

  return response.data;
};

/**
 * Get upcoming bookings for current user
 * Falls back to mock data if API is unavailable
 */
export const getUpcomingBookings = async (): Promise<Booking[]> => {
  const response = await get<ApiResponse<Booking[]>>('/bookings/upcoming');
  return response.data;
};

/**
 * Get booking history for current user
 * Falls back to mock data if API is unavailable
 */
export const getBookingHistory = async (): Promise<Booking[]> => {
  const response = await get<ApiResponse<Booking[]>>('/bookings/history');
  return response.data;
};

/**
 * Calculate booking pricing
 * Falls back to mock pricing if API is unavailable (MVP)
 */
export const calculateBookingPrice = async (
  siteId: string,
  checkInDate: string,
  checkOutDate: string,
  equipmentReservations?: { equipmentId: string; quantity: number }[] | undefined
): Promise<BookingPricing> => {
  const response = await post<ApiResponse<BookingPricing>>('/bookings/calculate-price', {
    siteId,
    checkInDate,
    checkOutDate,
    equipmentReservations,
  });
  if (!response.data) {
    throw new Error('Failed to calculate pricing');
  }
  return response.data;
};

/**
 * Create a new booking
 * Falls back to mock booking creation if API is unavailable (MVP)
 */
export const createBooking = async (bookingData: CreateBookingData): Promise<Booking> => {
  try {
    const response = await post<ApiResponse<Booking>>('/bookings', bookingData);
    if (!response.data) {
      throw new Error('Failed to create booking');
    }
    return response.data;
  } catch {
    throw new Error('Failed to create booking');
  }
};

/**
 * Update booking
 */
export const updateBooking = async (
  id: string,
  bookingData: UpdateBookingData
): Promise<Booking> => {
  const response = await put<ApiResponse<Booking>>(`/bookings/${id}`, bookingData);
  if (!response.data) {
    throw new Error(`Failed to update booking: ${id}`);
  }
  return response.data;
};

/**
 * Cancel booking
 */
export const cancelBooking = async (id: string, reason?: string | undefined): Promise<Booking> => {
  const response = await post<ApiResponse<Booking>>(`/bookings/${id}/cancel`, { reason });
  if (!response.data) {
    throw new Error(`Failed to cancel booking: ${id}`);
  }
  return response.data;
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
  if (!response.data) {
    throw new Error(`Failed to calculate refund for booking: ${id}`);
  }
  return response.data;
};

/**
 * Check-in booking (Staff only)
 */
export const checkInBooking = async (id: string): Promise<Booking> => {
  const response = await post<ApiResponse<Booking>>(`/bookings/${id}/check-in`);
  if (!response.data) {
    throw new Error(`Failed to check-in booking: ${id}`);
  }
  return response.data;
};

/**
 * Check-out booking (Staff only)
 */
export const checkOutBooking = async (id: string): Promise<Booking> => {
  const response = await post<ApiResponse<Booking>>(`/bookings/${id}/check-out`);
  if (!response.data) {
    throw new Error(`Failed to check-out booking: ${id}`);
  }
  return response.data;
};

/**
 * Get booking QR code
 */
export const getBookingQRCode = async (id: string): Promise<string> => {
  const response = await get<ApiResponse<{ qrCode: string }>>(`/bookings/${id}/qr-code`);
  if (!response.data?.qrCode) {
    throw new Error(`Failed to get QR code for booking: ${id}`);
  }
  return response.data.qrCode;
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
  if (!response.data) {
    throw new Error('Failed to create guest booking');
  }
  return response.data;
};

/**
 * Get guest booking by reference number (with token or email verification)
 */
export const getGuestBooking = async (
  bookingNumber: string,
  token?: string | undefined,
  email?: string | undefined
): Promise<Booking> => {
  const params: Record<string, string> = {};
  if (token) params.token = token;
  if (email) params.email = email;

  const response = await get<ApiResponse<Booking>>(`/bookings/guest/${bookingNumber}`, { params });
  if (!response.data) {
    throw new Error(`Booking not found: ${bookingNumber}`);
  }
  return response.data;
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
  if (!response.data?.token) {
    throw new Error('Failed to verify email');
  }
  return response.data;
};