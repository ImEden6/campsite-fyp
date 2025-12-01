/**
 * Common Type Definitions
 * Shared types used across multiple features and components
 */

/**
 * Unified DateRange interface
 * Represents a date range with start and end dates in ISO 8601 format (YYYY-MM-DD)
 * 
 * @property startDate - The start date of the range in ISO format (YYYY-MM-DD)
 * @property endDate - The end date of the range in ISO format (YYYY-MM-DD)
 * 
 * @example
 * ```typescript
 * const range: DateRange = {
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * };
 * ```
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * DateRangeFilter type alias
 * Alternative naming for DateRange used in filter contexts
 * This provides backward compatibility with existing code that uses DateRangeFilter
 * 
 * @example
 * ```typescript
 * const filter: DateRangeFilter = {
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * };
 * ```
 */
export type DateRangeFilter = DateRange;

/**
 * Legacy DateRange format used in query-keys.ts
 * Uses 'start' and 'end' instead of 'startDate' and 'endDate'
 * 
 * @deprecated Use DateRange instead
 */
export interface LegacyDateRange {
  start: string;
  end: string;
}

/**
 * Conversion Utilities
 */

/**
 * Converts a DateRange to LegacyDateRange format
 * Used when interfacing with code that expects the old format
 * 
 * @param dateRange - The DateRange object to convert
 * @returns LegacyDateRange object with start/end properties
 * 
 * @example
 * ```typescript
 * const modern = { startDate: '2024-01-01', endDate: '2024-01-31' };
 * const legacy = dateRangeToLegacy(modern);
 * // Result: { start: '2024-01-01', end: '2024-01-31' }
 * ```
 */
export function dateRangeToLegacy(dateRange: DateRange): LegacyDateRange {
  return {
    start: dateRange.startDate,
    end: dateRange.endDate,
  };
}

/**
 * Converts a LegacyDateRange to DateRange format
 * Used when receiving data in the old format
 * 
 * @param legacyRange - The LegacyDateRange object to convert
 * @returns DateRange object with startDate/endDate properties
 * 
 * @example
 * ```typescript
 * const legacy = { start: '2024-01-01', end: '2024-01-31' };
 * const modern = legacyToDateRange(legacy);
 * // Result: { startDate: '2024-01-01', endDate: '2024-01-31' }
 * ```
 */
export function legacyToDateRange(legacyRange: LegacyDateRange): DateRange {
  return {
    startDate: legacyRange.start,
    endDate: legacyRange.end,
  };
}

/**
 * Validates that a date string is in ISO 8601 format (YYYY-MM-DD)
 * 
 * @param dateString - The date string to validate
 * @returns true if the date string is valid, false otherwise
 * 
 * @example
 * ```typescript
 * isValidDateString('2024-01-01'); // true
 * isValidDateString('01/01/2024'); // false
 * isValidDateString('2024-13-01'); // false (invalid month)
 * ```
 */
export function isValidDateString(dateString: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(dateString);
}

/**
 * Validates that a DateRange object has valid dates and that endDate is after startDate
 * 
 * @param dateRange - The DateRange object to validate
 * @returns true if the date range is valid, false otherwise
 * 
 * @example
 * ```typescript
 * isValidDateRange({ startDate: '2024-01-01', endDate: '2024-01-31' }); // true
 * isValidDateRange({ startDate: '2024-01-31', endDate: '2024-01-01' }); // false (end before start)
 * isValidDateRange({ startDate: 'invalid', endDate: '2024-01-31' }); // false (invalid date)
 * ```
 */
export function isValidDateRange(dateRange: DateRange): boolean {
  if (!isValidDateString(dateRange.startDate) || !isValidDateString(dateRange.endDate)) {
    return false;
  }
  
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  
  return start <= end;
}

/**
 * Formats a DateRange object into a human-readable string
 * 
 * @param dateRange - The DateRange object to format
 * @param locale - The locale to use for formatting (defaults to 'en-US')
 * @returns A formatted string representation of the date range
 * 
 * @example
 * ```typescript
 * const range = { startDate: '2024-01-01', endDate: '2024-01-31' };
 * formatDateRange(range); // "Jan 1, 2024 - Jan 31, 2024"
 * ```
 */
export function formatDateRange(dateRange: DateRange, locale: string = 'en-US'): string {
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  const startFormatted = start.toLocaleDateString(locale, options);
  const endFormatted = end.toLocaleDateString(locale, options);
  
  return `${startFormatted} - ${endFormatted}`;
}
