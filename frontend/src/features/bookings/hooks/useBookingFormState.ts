/**
 * useBookingFormState Hook
 * Core form state management shared by all booking forms
 */

import { useState, useCallback, useMemo } from 'react';
import type { BookingFormData, BookingFormErrors } from '../types';
import { createInitialFormData } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseBookingFormStateOptions {
    /**
     * Initial form data overrides
     */
    initialData?: Partial<BookingFormData>;
}

export interface UseBookingFormStateReturn {
    // State
    formData: BookingFormData;
    errors: BookingFormErrors;

    // State setters
    setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
    setErrors: React.Dispatch<React.SetStateAction<BookingFormErrors>>;

    // Convenience methods
    updateField: <K extends keyof BookingFormData>(field: K, value: BookingFormData[K]) => void;
    clearError: (field: string) => void;
    clearAllErrors: () => void;
    resetForm: () => void;

    // Derived values
    today: string;
    totalGuests: number;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Core form state management hook for booking forms
 * 
 * Features:
 * - Form data state with type-safe field updates
 * - Error state with auto-clear on field update
 * - Derived values (today's date, total guests)
 * - Reset functionality
 * 
 * @example
 * ```tsx
 * const { formData, updateField, errors } = useBookingFormState({
 *     initialData: { adults: 3, checkInDate: '2024-01-01' }
 * });
 * 
 * // Update a field
 * updateField('adults', 4);
 * 
 * // Access derived values
 * console.log(totalGuests); // adults + children
 * ```
 */
export function useBookingFormState(
    options?: UseBookingFormStateOptions
): UseBookingFormStateReturn {
    // Initialize form data with factory function
    const [formData, setFormData] = useState<BookingFormData>(() =>
        createInitialFormData(options?.initialData)
    );

    // Error state
    const [errors, setErrors] = useState<BookingFormErrors>({});

    // Today's date for min date validation (memoized to prevent unnecessary recalcs)
    const today = useMemo(() => {
        const isoDate = new Date().toISOString().split('T')[0];
        return isoDate ?? '';
    }, []);

    // Derived: total guest count
    const totalGuests = useMemo(
        () => formData.adults + formData.children,
        [formData.adults, formData.children]
    );

    /**
     * Update a single form field and auto-clear any associated error
     */
    const updateField = useCallback(<K extends keyof BookingFormData>(
        field: K,
        value: BookingFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Auto-clear error for this field if it exists
        setErrors(prev => {
            if (prev[field]) {
                const next = { ...prev };
                delete next[field];
                return next;
            }
            return prev;
        });
    }, []);

    /**
     * Clear a specific error
     */
    const clearError = useCallback((field: string) => {
        setErrors(prev => {
            if (prev[field]) {
                const next = { ...prev };
                delete next[field];
                return next;
            }
            return prev;
        });
    }, []);

    /**
     * Clear all errors
     */
    const clearAllErrors = useCallback(() => {
        setErrors({});
    }, []);

    /**
     * Reset form to initial state
     */
    const resetForm = useCallback(() => {
        setFormData(createInitialFormData(options?.initialData));
        setErrors({});
    }, [options?.initialData]);

    return {
        formData,
        errors,
        setFormData,
        setErrors,
        updateField,
        clearError,
        clearAllErrors,
        resetForm,
        today,
        totalGuests,
    };
}
