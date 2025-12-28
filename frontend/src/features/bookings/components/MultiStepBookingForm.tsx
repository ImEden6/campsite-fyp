/**
 * MultiStepBookingForm Component
 * Unified base component for multi-step booking forms
 * 
 * Used by BookingForm and GuestBookingForm
 */

import React, { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Car, Package, Users, AlertCircle } from 'lucide-react';
import type { Site, Vehicle } from '@/types';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { calculateBookingPrice } from '@/services/api/bookings';
import { useBookingFormState, useMultiStepForm } from '../hooks';
import type { BookingFormData, PrimaryGuestInfo, BookingFormStep, BookingFormErrors } from '../types';
import {
    BookingProgressStepper,
    DateGuestsStep,
    ReviewStep,
} from './steps';
import { VehicleInput } from './VehicleInput';
import { EquipmentSelector } from './EquipmentSelector';
import { GuestDetailsInput } from './GuestDetailsInput';

// ============================================================================
// TYPES
// ============================================================================

export interface MultiStepBookingFormProps {
    /**
     * The site being booked
     */
    site: Site;

    /**
     * Initial check-in date (YYYY-MM-DD)
     */
    initialCheckInDate?: string;

    /**
     * Initial check-out date (YYYY-MM-DD)
     */
    initialCheckOutDate?: string;

    /**
     * Initial number of guests
     */
    initialGuests?: number;

    /**
     * Primary guest information (pre-populated for first guest)
     */
    primaryGuestInfo?: PrimaryGuestInfo;

    /**
     * Called when form is submitted with valid data
     */
    onSubmit: (formData: BookingFormData) => void;

    /**
     * Whether submission is in progress
     */
    isSubmitting: boolean;

    /**
     * Submission error message
     */
    submitError?: string;

    /**
     * Called when user clicks cancel
     */
    onCancel?: () => void;

    /**
     * Custom label for submit button
     */
    submitLabel?: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

function createStepValidator(
    formData: BookingFormData,
    site: Site,
    setErrors: React.Dispatch<React.SetStateAction<BookingFormErrors>>
) {
    return (step: BookingFormStep): boolean => {
        const newErrors: BookingFormErrors = {};

        if (step === 1) {
            if (!formData.checkInDate) {
                newErrors.checkInDate = 'Check-in date is required';
            }
            if (!formData.checkOutDate) {
                newErrors.checkOutDate = 'Check-out date is required';
            }
            if (
                formData.checkInDate &&
                formData.checkOutDate &&
                formData.checkInDate >= formData.checkOutDate
            ) {
                newErrors.checkOutDate = 'Check-out must be after check-in';
            }
            if (formData.adults < 1) {
                newErrors.adults = 'At least one adult is required';
            }
            const totalGuests = formData.adults + formData.children;
            if (totalGuests > site.capacity) {
                newErrors.adults = `Total guests cannot exceed site capacity of ${site.capacity}`;
            }
        }

        if (step === 2) {
            const totalGuests = formData.adults + formData.children;
            if (formData.guestDetails.length !== totalGuests) {
                newErrors.guestDetails = 'Please provide details for all guests';
            } else {
                formData.guestDetails.forEach((guest, index) => {
                    if (!guest.firstName.trim()) {
                        newErrors[`guest_${index}_firstName`] = 'First name is required';
                    }
                    if (!guest.lastName.trim()) {
                        newErrors[`guest_${index}_lastName`] = 'Last name is required';
                    }
                });
            }
        }

        if (step === 3) {
            if (formData.vehicles.length > site.maxVehicles) {
                newErrors.vehicles = `Maximum ${site.maxVehicles} vehicles allowed`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
}

// ============================================================================
// COMPONENT
// ============================================================================

export const MultiStepBookingForm: React.FC<MultiStepBookingFormProps> = ({
    site,
    initialCheckInDate = '',
    initialCheckOutDate = '',
    initialGuests = 2,
    primaryGuestInfo,
    onSubmit,
    isSubmitting,
    submitError,
    onCancel,
    submitLabel = 'Confirm Booking',
}) => {
    // Form state
    const {
        formData,
        errors,
        setErrors,
        updateField,
        today,
    } = useBookingFormState({
        initialData: {
            checkInDate: initialCheckInDate,
            checkOutDate: initialCheckOutDate,
            adults: initialGuests,
        },
    });

    // Step validation
    const validateStep = useCallback(
        (step: BookingFormStep) => createStepValidator(formData, site, setErrors)(step),
        [formData, site, setErrors]
    );

    // Multi-step navigation
    const { currentStep, handleNext, handleBack, isLastStep } = useMultiStepForm({
        totalSteps: 5,
        validateStep,
    });

    // Calculate pricing
    const { data: pricing, isLoading: isPricingLoading } = useQuery({
        queryKey: [
            'booking-price',
            site.id,
            formData.checkInDate,
            formData.checkOutDate,
            formData.equipmentReservations,
        ],
        queryFn: () =>
            calculateBookingPrice(
                site.id,
                formData.checkInDate,
                formData.checkOutDate,
                formData.equipmentReservations
            ),
        enabled: !!formData.checkInDate && !!formData.checkOutDate,
    });

    // Handle form submission
    const handleSubmit = useCallback(() => {
        if (validateStep(5)) {
            onSubmit(formData);
        }
    }, [validateStep, onSubmit, formData]);

    // Merge submit error into errors (memoized to prevent unnecessary re-renders)
    const errorsWithSubmit = useMemo<BookingFormErrors>(
        () => (submitError ? { ...errors, submit: submitError } : errors),
        [errors, submitError]
    );

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Steps */}
            <BookingProgressStepper currentStep={currentStep} />

            {/* Form Content */}
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                {/* Step 1: Dates & Guests */}
                {currentStep === 1 && (
                    <DateGuestsStep
                        formData={formData}
                        errors={errors}
                        site={site}
                        today={today}
                        onUpdate={updateField}
                    />
                )}

                {/* Step 2: Guest Details */}
                {currentStep === 2 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Users size={20} className="text-blue-600 dark:text-blue-400" />
                            Guest Information
                        </h2>

                        <GuestDetailsInput
                            adults={formData.adults}
                            children={formData.children}
                            guestDetails={formData.guestDetails}
                            onChange={(guests) => updateField('guestDetails', guests)}
                            primaryGuestInfo={primaryGuestInfo}
                            errors={errors}
                        />

                        {errors.guestDetails && (
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 p-3 rounded-lg">
                                <AlertCircle size={20} />
                                <p className="text-sm font-medium">{errors.guestDetails}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Vehicles */}
                {currentStep === 3 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Car size={20} className="text-blue-600 dark:text-blue-400" />
                            Vehicle Information (Optional)
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Add your vehicle details if arriving by car, RV, or motorcycle
                        </p>

                        <VehicleInput
                            vehicles={formData.vehicles}
                            onChange={(vehicles: Omit<Vehicle, 'id'>[]) =>
                                updateField('vehicles', vehicles)
                            }
                            maxVehicles={site.maxVehicles}
                        />

                        {errors.vehicles && (
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 p-3 rounded-lg">
                                <AlertCircle size={20} />
                                <p className="text-sm font-medium">{errors.vehicles}</p>
                            </div>
                        )}

                        <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                            <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                <strong>Maximum Vehicles:</strong> {site.maxVehicles} |{' '}
                                <strong>Current:</strong> {formData.vehicles.length}
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 4: Equipment */}
                {currentStep === 4 && (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Package size={20} className="text-blue-600 dark:text-blue-400" />
                                Equipment Rentals (Optional)
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Add equipment rentals to enhance your camping experience
                            </p>
                        </div>

                        <EquipmentSelector
                            checkInDate={formData.checkInDate}
                            checkOutDate={formData.checkOutDate}
                            selectedEquipment={formData.equipmentReservations}
                            onChange={(equipment) =>
                                updateField('equipmentReservations', equipment)
                            }
                        />
                    </div>
                )}

                {/* Step 5: Review */}
                {currentStep === 5 && (
                    <ReviewStep
                        formData={formData}
                        errors={errorsWithSubmit}
                        site={site}
                        pricing={pricing}
                        isPricingLoading={isPricingLoading}
                        onUpdateSpecialRequests={(value) => updateField('specialRequests', value)}
                    />
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                        {currentStep > 1 && (
                            <Button variant="outline" onClick={handleBack}>
                                Back
                            </Button>
                        )}
                        {onCancel && currentStep === 1 && (
                            <Button variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {!isLastStep ? (
                            <Button variant="primary" onClick={handleNext}>
                                Next
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating Booking...' : submitLabel}
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};
