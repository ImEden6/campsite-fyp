/**
 * useMultiStepForm Hook
 * Type-safe step navigation for multi-step booking forms
 */

import { useState, useCallback, useMemo } from 'react';
import type { BookingFormStep } from '../types';
import { isValidStep } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseMultiStepFormOptions {
    /**
     * Total number of steps in the form
     */
    totalSteps: number;

    /**
     * Validation function called before advancing to next step
     * Return true if valid, false otherwise
     */
    validateStep: (step: BookingFormStep) => boolean;
}

export interface UseMultiStepFormReturn {
    /**
     * Current step number (1-indexed)
     */
    currentStep: BookingFormStep;

    /**
     * Advance to next step if validation passes
     */
    handleNext: () => void;

    /**
     * Go back to previous step (no validation)
     */
    handleBack: () => void;

    /**
     * Jump to a specific step (no validation)
     */
    goToStep: (step: BookingFormStep) => void;

    /**
     * True if currently on first step
     */
    isFirstStep: boolean;

    /**
     * True if currently on last step
     */
    isLastStep: boolean;

    /**
     * Reset to first step
     */
    resetSteps: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Multi-step form navigation hook with type-safe step handling
 * 
 * @example
 * ```tsx
 * const { currentStep, handleNext, handleBack, isLastStep } = useMultiStepForm({
 *     totalSteps: 5,
 *     validateStep: (step) => {
 *         if (step === 1 && !formData.checkInDate) return false;
 *         return true;
 *     },
 * });
 * 
 * // Navigate
 * handleNext(); // Validates current step, then advances if valid
 * handleBack(); // Goes back without validation
 * ```
 */
export function useMultiStepForm(options: UseMultiStepFormOptions): UseMultiStepFormReturn {
    const { totalSteps, validateStep } = options;

    const [currentStep, setCurrentStep] = useState<BookingFormStep>(1);

    /**
     * Advance to next step if validation passes
     */
    const handleNext = useCallback(() => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => {
                const next = prev + 1;
                return isValidStep(next) ? next : prev;
            });
        }
    }, [currentStep, validateStep]);

    /**
     * Go back to previous step (no validation required)
     */
    const handleBack = useCallback(() => {
        setCurrentStep((prev) => {
            const next = prev - 1;
            return isValidStep(next) ? next : prev;
        });
    }, []);

    /**
     * Jump to a specific step
     */
    const goToStep = useCallback((step: BookingFormStep) => {
        if (step >= 1 && step <= totalSteps && isValidStep(step)) {
            setCurrentStep(step);
        }
    }, [totalSteps]);

    /**
     * Reset to first step
     */
    const resetSteps = useCallback(() => {
        setCurrentStep(1);
    }, []);

    // Derived state
    const isFirstStep = currentStep === 1;
    const isLastStep = currentStep === totalSteps;

    return useMemo(() => ({
        currentStep,
        handleNext,
        handleBack,
        goToStep,
        isFirstStep,
        isLastStep,
        resetSteps,
    }), [currentStep, handleNext, handleBack, goToStep, isFirstStep, isLastStep, resetSteps]);
}
