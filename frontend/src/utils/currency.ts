/**
 * Currency Formatting Utility
 * Centralizes all currency formatting to Malaysian Ringgit (MYR)
 */

const CURRENCY_LOCALE = 'ms-MY';
const CURRENCY_CODE = 'MYR';

/**
 * Format a number as Malaysian Ringgit currency
 * @param amount - The amount to format
 * @param options - Optional formatting options
 * @returns Formatted currency string (e.g., "RM 150.00")
 */
export function formatCurrency(
    amount: number,
    options: {
        minimumFractionDigits?: number;
        maximumFractionDigits?: number;
        showSymbol?: boolean;
    } = {}
): string {
    const {
        minimumFractionDigits = 2,
        maximumFractionDigits = 2,
        showSymbol = true,
    } = options;

    if (showSymbol) {
        return new Intl.NumberFormat(CURRENCY_LOCALE, {
            style: 'currency',
            currency: CURRENCY_CODE,
            minimumFractionDigits,
            maximumFractionDigits,
        }).format(amount);
    }

    return new Intl.NumberFormat(CURRENCY_LOCALE, {
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(amount);
}

/**
 * Format currency for display in charts (shorter format)
 * @param value - The value to format
 * @returns Short formatted string (e.g., "RM 1.5K")
 */
export function formatCurrencyShort(value: number): string {
    if (value >= 1000000) {
        return `RM ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `RM ${(value / 1000).toFixed(1)}K`;
    }
    return `RM ${value.toLocaleString(CURRENCY_LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Format currency for chart axis labels (no decimal)
 * @param value - The value to format  
 * @returns Formatted string (e.g., "RM 1,500")
 */
export function formatCurrencyAxis(value: number): string {
    return `RM ${value.toLocaleString(CURRENCY_LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Currency symbol for MYR
 */
export const CURRENCY_SYMBOL = 'RM';

export default formatCurrency;
