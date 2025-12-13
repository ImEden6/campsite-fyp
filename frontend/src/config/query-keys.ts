/**
 * Query Keys Factory
 * Centralized query key management for consistent cache handling
 * 
 * Benefits:
 * - Type-safe query keys
 * - Consistent naming conventions
 * - Easy cache invalidation
 * - Hierarchical key structure
 */

import type { DateRange, BookingFilters, EquipmentFilters } from '@/types';

/**
 * Booking Query Keys
 */
export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (filters?: BookingFilters) => [...bookingKeys.lists(), filters] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
  calendar: (params?: CalendarParams) => [...bookingKeys.all, 'calendar', params] as const,
  upcoming: (userId?: string) => [...bookingKeys.all, 'upcoming', userId] as const,
  history: (userId?: string) => [...bookingKeys.all, 'history', userId] as const,
  stats: (dateRange?: DateRange) => [...bookingKeys.all, 'stats', dateRange] as const,
  myBookings: () => [...bookingKeys.all, 'my-bookings'] as const,
  guest: (bookingNumber: string, token?: string) => 
    [...bookingKeys.all, 'guest', bookingNumber, token] as const,
};

/**
 * Site Query Keys
 */
export const siteKeys = {
  all: ['sites'] as const,
  lists: () => [...siteKeys.all, 'list'] as const,
  list: (filters?: SiteFilters) => [...siteKeys.lists(), filters] as const,
  details: () => [...siteKeys.all, 'detail'] as const,
  detail: (id: string) => [...siteKeys.details(), id] as const,
  availability: (params: AvailabilityParams) => [...siteKeys.all, 'availability', params] as const,
  map: () => [...siteKeys.all, 'map'] as const,
  amenities: () => [...siteKeys.all, 'amenities'] as const,
};

/**
 * User Query Keys
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  activity: (userId: string) => [...userKeys.all, 'activity', userId] as const,
  roles: () => [...userKeys.all, 'roles'] as const,
};

/**
 * Payment Query Keys
 */
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters?: PaymentFilters) => [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  history: (bookingId?: string, userId?: string) => 
    [...paymentKeys.all, 'history', { bookingId, userId }] as const,
  methods: (userId: string) => [...paymentKeys.all, 'methods', userId] as const,
  receipt: (paymentId: string) => [...paymentKeys.all, 'receipt', paymentId] as const,
};

/**
 * Equipment Query Keys
 */
export const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  list: (filters?: EquipmentFilters) => [...equipmentKeys.lists(), filters] as const,
  details: () => [...equipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentKeys.details(), id] as const,
  availability: (params: EquipmentAvailabilityParams) => 
    [...equipmentKeys.all, 'availability', params] as const,
  categories: () => [...equipmentKeys.all, 'categories'] as const,
  rentals: (bookingId?: string) => [...equipmentKeys.all, 'rentals', bookingId] as const,
  inventory: () => [...equipmentKeys.all, 'inventory'] as const,
};

/**
 * Analytics Query Keys
 */
export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (dateRange?: DateRange) => [...analyticsKeys.all, 'dashboard', dateRange] as const,
  revenue: (params: RevenueParams) => [...analyticsKeys.all, 'revenue', params] as const,
  occupancy: (params: OccupancyParams) => [...analyticsKeys.all, 'occupancy', params] as const,
  customers: (params?: CustomerInsightsParams) => 
    [...analyticsKeys.all, 'customers', params] as const,
  sites: (params?: SitePerformanceParams) => [...analyticsKeys.all, 'sites', params] as const,
  reports: () => [...analyticsKeys.all, 'reports'] as const,
  report: (reportId: string) => [...analyticsKeys.all, 'report', reportId] as const,
};

/**
 * Notification Query Keys
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters?: NotificationFilters) => [...notificationKeys.lists(), filters] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
  count: () => [...notificationKeys.all, 'count'] as const,
};

/**
 * Authentication Query Keys
 */
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  permissions: () => [...authKeys.all, 'permissions'] as const,
};

/**
 * Combined Query Keys Export
 * Provides a single object with all query key factories
 */
export const queryKeys = {
  bookings: bookingKeys,
  sites: siteKeys,
  users: userKeys,
  payments: paymentKeys,
  equipment: equipmentKeys,
  analytics: analyticsKeys,
  notifications: notificationKeys,
  auth: authKeys,
};

/**
 * Type Definitions for Query Key Parameters
 * These should match the actual filter/param types from the API
 * 
 * Note: BookingFilters, EquipmentFilters, and DateRange are now imported from consolidated types
 */

interface CalendarParams {
  startDate: string;
  endDate: string;
  view?: 'month' | 'week' | 'day';
}

interface SiteFilters {
  type?: string[];
  status?: string[];
  amenities?: string[];
  priceRange?: { min: number; max: number };
  capacity?: { min: number; max: number };
}

interface AvailabilityParams {
  startDate: string;
  endDate: string;
  siteType?: string;
  guests?: number;
}

interface UserFilters {
  role?: string[];
  status?: string[];
  searchTerm?: string;
}

interface PaymentFilters {
  status?: string[];
  dateRange?: DateRange;
  bookingId?: string;
  userId?: string;
}

interface EquipmentAvailabilityParams {
  startDate: string;
  endDate: string;
  equipmentId?: string;
  category?: string;
}

interface RevenueParams {
  dateRange: DateRange;
  groupBy?: 'day' | 'week' | 'month';
  siteType?: string;
}

interface OccupancyParams {
  dateRange: DateRange;
  siteType?: string;
}

interface CustomerInsightsParams {
  dateRange?: DateRange;
  segment?: string;
}

interface SitePerformanceParams {
  dateRange?: DateRange;
  siteId?: string;
}

interface NotificationFilters {
  type?: string[];
  read?: boolean;
  dateRange?: DateRange;
}

/**
 * Helper function to invalidate related queries
 * Useful when mutations affect multiple query keys
 */
export const getRelatedQueryKeys = (entity: string, id?: string) => {
  switch (entity) {
    case 'booking':
      return [
        bookingKeys.all,
        siteKeys.availability,
        analyticsKeys.dashboard,
      ];
    case 'site':
      return [
        siteKeys.all,
        bookingKeys.all,
        analyticsKeys.sites,
      ];
    case 'payment':
      return [
        paymentKeys.all,
        bookingKeys.detail(id!),
        analyticsKeys.revenue,
      ];
    case 'equipment':
      return [
        equipmentKeys.all,
        bookingKeys.detail(id!),
      ];
    case 'user':
      return [
        userKeys.all,
        bookingKeys.all,
      ];
    default:
      return [];
  }
};
