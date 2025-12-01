/**
 * Equipment Type Definitions
 * Unified types for equipment filtering, availability, and rental operations
 */

import type { EquipmentCategory, EquipmentStatus } from './index';

/**
 * Unified EquipmentFilters interface
 * Used for filtering equipment lists across the application
 * 
 * Supports both single values and arrays for flexible filtering:
 * - Single value: Filter by one specific category or status
 * - Array: Filter by multiple categories or statuses (OR logic)
 * 
 * @property category - Filter by equipment category (single or multiple)
 * @property status - Filter by equipment status (single or multiple)
 * @property search - Text search across equipment name and description
 * @property searchTerm - Alternative property name for text search (for backward compatibility)
 * @property minPrice - Minimum daily rate filter
 * @property maxPrice - Maximum daily rate filter
 * @property availableOnly - When true, only show equipment with available quantity > 0
 * 
 * @example
 * ```typescript
 * // Single category filter
 * const filters: EquipmentFilters = {
 *   category: EquipmentCategory.CAMPING_GEAR,
 *   availableOnly: true
 * };
 * 
 * // Multiple categories filter
 * const filters: EquipmentFilters = {
 *   category: [EquipmentCategory.CAMPING_GEAR, EquipmentCategory.RECREATIONAL],
 *   status: [EquipmentStatus.AVAILABLE, EquipmentStatus.RENTED]
 * };
 * 
 * // Price range filter
 * const filters: EquipmentFilters = {
 *   minPrice: 10,
 *   maxPrice: 50,
 *   search: 'tent'
 * };
 * ```
 */
export interface EquipmentFilters {
  /** Filter by equipment category - supports single value or array */
  category?: EquipmentCategory | EquipmentCategory[] | string | string[];
  
  /** Filter by equipment status - supports single value or array */
  status?: EquipmentStatus | EquipmentStatus[] | string | string[];
  
  /** Text search across equipment name and description */
  search?: string;
  
  /** Alternative property name for text search (backward compatibility) */
  searchTerm?: string;
  
  /** Minimum daily rate filter (inclusive) */
  minPrice?: number;
  
  /** Maximum daily rate filter (inclusive) */
  maxPrice?: number;
  
  /** When true, only show equipment with availableQuantity > 0 */
  availableOnly?: boolean;
}

/**
 * Equipment availability parameters
 * Used for checking equipment availability for a specific date range
 * 
 * @property startDate - Start date in ISO 8601 format (YYYY-MM-DD)
 * @property endDate - End date in ISO 8601 format (YYYY-MM-DD)
 * @property equipmentId - Optional specific equipment ID to check
 * @property category - Optional category filter for availability check
 * 
 * @example
 * ```typescript
 * const params: EquipmentAvailabilityParams = {
 *   startDate: '2024-06-01',
 *   endDate: '2024-06-07',
 *   category: EquipmentCategory.CAMPING_GEAR
 * };
 * ```
 */
export interface EquipmentAvailabilityParams {
  /** Start date in ISO 8601 format (YYYY-MM-DD) */
  startDate: string;
  
  /** End date in ISO 8601 format (YYYY-MM-DD) */
  endDate: string;
  
  /** Optional specific equipment ID to check availability for */
  equipmentId?: string;
  
  /** Optional category filter for availability check */
  category?: string;
}

/**
 * Type guard to check if a value is a single category
 * 
 * @param value - The value to check
 * @returns true if value is a single EquipmentCategory or string
 * 
 * @example
 * ```typescript
 * if (isSingleCategory(filters.category)) {
 *   // Handle single category
 * }
 * ```
 */
export function isSingleCategory(
  value: EquipmentCategory | EquipmentCategory[] | string | string[] | undefined
): value is EquipmentCategory | string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is an array of categories
 * 
 * @param value - The value to check
 * @returns true if value is an array of EquipmentCategory or string
 * 
 * @example
 * ```typescript
 * if (isCategoryArray(filters.category)) {
 *   // Handle multiple categories
 * }
 * ```
 */
export function isCategoryArray(
  value: EquipmentCategory | EquipmentCategory[] | string | string[] | undefined
): value is EquipmentCategory[] | string[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a single status
 * 
 * @param value - The value to check
 * @returns true if value is a single EquipmentStatus or string
 * 
 * @example
 * ```typescript
 * if (isSingleStatus(filters.status)) {
 *   // Handle single status
 * }
 * ```
 */
export function isSingleStatus(
  value: EquipmentStatus | EquipmentStatus[] | string | string[] | undefined
): value is EquipmentStatus | string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is an array of statuses
 * 
 * @param value - The value to check
 * @returns true if value is an array of EquipmentStatus or string
 * 
 * @example
 * ```typescript
 * if (isStatusArray(filters.status)) {
 *   // Handle multiple statuses
 * }
 * ```
 */
export function isStatusArray(
  value: EquipmentStatus | EquipmentStatus[] | string | string[] | undefined
): value is EquipmentStatus[] | string[] {
  return Array.isArray(value);
}

/**
 * Normalizes category filter to always return an array
 * Useful for consistent handling in filter logic
 * 
 * @param category - Single category or array of categories
 * @returns Array of categories, or undefined if input is undefined
 * 
 * @example
 * ```typescript
 * const categories = normalizeCategoryFilter(filters.category);
 * // Single value: 'CAMPING_GEAR' -> ['CAMPING_GEAR']
 * // Array: ['CAMPING_GEAR', 'RECREATIONAL'] -> ['CAMPING_GEAR', 'RECREATIONAL']
 * // Undefined: undefined -> undefined
 * ```
 */
export function normalizeCategoryFilter(
  category: EquipmentCategory | EquipmentCategory[] | string | string[] | undefined
): string[] | undefined {
  if (category === undefined) return undefined;
  return Array.isArray(category) ? category.map(String) : [String(category)];
}

/**
 * Normalizes status filter to always return an array
 * Useful for consistent handling in filter logic
 * 
 * @param status - Single status or array of statuses
 * @returns Array of statuses, or undefined if input is undefined
 * 
 * @example
 * ```typescript
 * const statuses = normalizeStatusFilter(filters.status);
 * // Single value: 'AVAILABLE' -> ['AVAILABLE']
 * // Array: ['AVAILABLE', 'RENTED'] -> ['AVAILABLE', 'RENTED']
 * // Undefined: undefined -> undefined
 * ```
 */
export function normalizeStatusFilter(
  status: EquipmentStatus | EquipmentStatus[] | string | string[] | undefined
): string[] | undefined {
  if (status === undefined) return undefined;
  return Array.isArray(status) ? status.map(String) : [String(status)];
}

/**
 * Gets the search term from EquipmentFilters
 * Handles both 'search' and 'searchTerm' properties for backward compatibility
 * 
 * @param filters - The equipment filters object
 * @returns The search term, or undefined if not present
 * 
 * @example
 * ```typescript
 * const searchTerm = getSearchTerm(filters);
 * // filters.search = 'tent' -> 'tent'
 * // filters.searchTerm = 'tent' -> 'tent'
 * // filters.search = 'tent', filters.searchTerm = 'sleeping bag' -> 'tent' (search takes precedence)
 * ```
 */
export function getSearchTerm(filters: EquipmentFilters): string | undefined {
  return filters.search || filters.searchTerm;
}
