/**
 * BookingProgressStepper Component
 * Visual progress indicator for multi-step booking forms
 */

import React from 'react';
import type { BookingStepConfig, BookingFormStep } from '../../types';
import { BOOKING_STEPS } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

export interface BookingProgressStepperProps {
    /**
     * Current active step (1-indexed)
     */
    currentStep: BookingFormStep;

    /**
     * Custom step configuration (defaults to BOOKING_STEPS)
     */
    steps?: BookingStepConfig[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BookingProgressStepper: React.FC<BookingProgressStepperProps> = ({
    currentStep,
    steps = BOOKING_STEPS,
}) => {
    return (
        <div className="mb-6 bg-white dark:bg-night-surface rounded-lg border border-gray-200 dark:border-secondary-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep >= step.num;
                    const isCompleted = currentStep > step.num;

                    return (
                        <div key={step.num} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${isActive
                                            ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                                            : 'bg-gray-200 dark:bg-night-surface-alt text-gray-600 dark:text-secondary-400'
                                        }`}
                                    aria-current={currentStep === step.num ? 'step' : undefined}
                                >
                                    <Icon size={16} />
                                </div>
                                <div
                                    className={`text-xs mt-2 text-center font-medium transition-colors ${isActive
                                            ? 'text-gray-900 dark:text-primary-100'
                                            : 'text-gray-600 dark:text-secondary-400'
                                        }`}
                                >
                                    {step.label}
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`h-1 flex-1 mx-2 rounded transition-all duration-200 ${isCompleted
                                            ? 'bg-blue-600 dark:bg-blue-500'
                                            : 'bg-gray-200 dark:bg-night-surface-alt'
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
