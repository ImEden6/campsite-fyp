/**
 * Booking Type Definitions
 * Consolidated types for booking-related functionality
 */

import type { BookingStatus, PaymentStatus } from '@/types';
import type { DateRange } from './common';

/**
 * Unified BookingFilters interface
 * Used for filtering bookings across the application
 * 
 * This interface consolidates the various BookingFilters definitions that existed
 * in different parts of the codebase (types/index.ts, services/api/bookings.ts, 
 * config/query-keys.ts) into a single source of truth.
 * 
 * @property status - Filter by booking status (e.g., PENDING, CONFIRMED, CHECKED_IN)
 * @property paymentStatus - Filter by payment status (e.g., PENDING, PAID, REFUNDED)
 * @property dateRange - Filter by date range using unified DateRange interface
 * @property siteType - Filter by site type (e.g., TENT, RV, CABIN)
 * @property searchTerm - Search term for text-based filtering (booking number, user name, etc.)
 * @property userId - Filter bookings by specific user ID
 * @property siteId - Filter bookings by specific site ID
 * 
 * @example
 * ```typescript
 * // Filter for confirmed bookings in January 2024
 * const filters: BookingFilters = {
 *   status: [BookingStatus.CONFIRMED],
 *   dateRange: {
 *     startDate: '2024-01-01',
 *     endDate: '2024-01-31'
 *   }
 * };
 * 
 * // Filter for a specific user's RV bookings
 * const userFilters: BookingFilters = {
 *   userId: 'user-123',
 *   siteType: ['RV']
 * };
 * 
 * // Search with text term
 * const searchFilters: BookingFilters = {
 *   searchTerm: 'Smith'
 * };
 * ```
 */
export interface BookingFilters {
  /**
   * Filter by booking status
   * Supports multiple statuses for OR filtering
   */
  status?: BookingStatus[];
  
  /**
   * Filter by payment status
   * Supports multiple payment statuses for OR filtering
   */
  paymentStatus?: PaymentStatus[];
  
  /**
   * Filter by date range
   * Uses the unified DateRange interface with startDate/endDate properties
   */
  dateRange?: DateRange;
  
  /**
   * Filter by site type
   * Supports multiple site types for OR filtering
   * Values should match SiteType enum (TENT, RV, CABIN)
   */
  siteType?: string[];
  
  /**
   * Search term for text-based filtering
   * Typically searches across booking number, user name, site name, etc.
   */
  searchTerm?: string;
  
  /**
   * Filter bookings by specific user ID
   * Useful for admin views to see a specific customer's bookings
   */
  userId?: string;
  
  /**
   * Filter bookings by specific site ID
   * Useful for viewing all bookings for a particular site
   */
  siteId?: string;
}

/**
 * Type guard to check if an object is a valid BookingFilters
 * 
 * @param obj - The object to check
 * @returns true if the object conforms to BookingFilters interface
 * 
 * @example
 * ```typescript
 * const filters = { status: ['CONFIRMED'] };
 * if (isBookingFilters(filters)) {
 *   // TypeScript knows filters is BookingFilters
 *   console.log(filters.status);
 * }
 * ```
 */
export function isBookingFilters(obj: unknown): obj is BookingFilters {
  console.log('[BookingFilters] Validating object:', obj);
  
  if (typeof obj !== 'object' || obj === null) {
    console.log('[BookingFilters] Validation failed: not an object or null');
    return false;
  }
  
  const record = obj as Record<string, unknown>;
  
  // Check optional properties have correct types if present
  if (record.status !== undefined && !Array.isArray(record.status)) {
    console.log('[BookingFilters] Validation failed: status is not an array', record.status);
    return false;
  }
  
  if (record.paymentStatus !== undefined && !Array.isArray(record.paymentStatus)) {
    console.log('[BookingFilters] Validation failed: paymentStatus is not an array', record.paymentStatus);
    return false;
  }
  
  if (record.dateRange !== undefined) {
    const dateRange = record.dateRange as { startDate?: unknown; endDate?: unknown };
    if (typeof dateRange !== 'object' || 
        typeof dateRange.startDate !== 'string' || 
        typeof dateRange.endDate !== 'string') {
      console.log('[BookingFilters] Validation failed: invalid dateRange', record.dateRange);
      return false;
    }
  }
  
  if (record.siteType !== undefined && !Array.isArray(record.siteType)) {
    console.log('[BookingFilters] Validation failed: siteType is not an array', record.siteType);
    return false;
  }
  
  if (record.searchTerm !== undefined && typeof record.searchTerm !== 'string') {
    console.log('[BookingFilters] Validation failed: searchTerm is not a string', record.searchTerm);
    return false;
  }
  
  if (record.userId !== undefined && typeof record.userId !== 'string') {
    console.log('[BookingFilters] Validation failed: userId is not a string', record.userId);
    return false;
  }
  
  if (record.siteId !== undefined && typeof record.siteId !== 'string') {
    console.log('[BookingFilters] Validation failed: siteId is not a string', record.siteId);
    return false;
  }
  
  console.log('[BookingFilters] Validation passed ✓');
  return true;
}

/**
 * Creates an empty BookingFilters object
 * Useful for initializing filter state
 * 
 * @returns An empty BookingFilters object with all properties undefined
 * 
 * @example
 * ```typescript
 * const [filters, setFilters] = useState<BookingFilters>(createEmptyBookingFilters());
 * ```
 */
export function createEmptyBookingFilters(): BookingFilters {
  console.log('[BookingFilters] Creating empty filters');
  const filters = {
    status: undefined,
    paymentStatus: undefined,
    dateRange: undefined,
    siteType: undefined,
    searchTerm: undefined,
    userId: undefined,
    siteId: undefined,
  };
  console.log('[BookingFilters] Empty filters created:', filters);
  return filters;
}

/**
 * Checks if BookingFilters has any active filters
 * 
 * @param filters - The BookingFilters object to check
 * @returns true if any filter property is set, false if all are undefined
 * 
 * @example
 * ```typescript
 * const filters: BookingFilters = { status: ['CONFIRMED'] };
 * hasActiveFilters(filters); // true
 * 
 * const emptyFilters = createEmptyBookingFilters();
 * hasActiveFilters(emptyFilters); // false
 * ```
 */
export function hasActiveFilters(filters: BookingFilters): boolean {
  console.log('[BookingFilters] Checking for active filters:', filters);
  
  const activeFilters = {
    status: filters.status?.length || 0,
    paymentStatus: filters.paymentStatus?.length || 0,
    dateRange: !!filters.dateRange,
    siteType: filters.siteType?.length || 0,
    searchTerm: !!filters.searchTerm,
    userId: !!filters.userId,
    siteId: !!filters.siteId,
  };
  
  const hasActive = !!(
    filters.status?.length ||
    filters.paymentStatus?.length ||
    filters.dateRange ||
    filters.siteType?.length ||
    filters.searchTerm ||
    filters.userId ||
    filters.siteId
  );
  
  console.log('[BookingFilters] Active filters breakdown:', activeFilters);
  console.log('[BookingFilters] Has active filters:', hasActive);
  
  return hasActive;
}
