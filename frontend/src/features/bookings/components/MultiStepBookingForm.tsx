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
import { GlassCard } from '@/components/ui/GlassCard';
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
    initialCheckInDate?: string | undefined;

    /**
     * Initial check-out date (YYYY-MM-DD)
     */
    initialCheckOutDate?: string | undefined;

    /**
     * Initial number of guests
     */
    initialGuests?: number | undefined;

    /**
     * Primary guest information (pre-populated for first guest)
     */
    primaryGuestInfo?: PrimaryGuestInfo | undefined;

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
    submitError?: string | undefined;

    /**
     * Called when user clicks cancel
     */
    onCancel?: (() => void) | undefined;

    /**
     * Custom label for submit button
     */
    submitLabel?: string | undefined;
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
                    if (!(guest.firstName ?? '').trim()) {
                        newErrors[`guest_${index}_firstName`] = 'First name is required';
                    }
                    if (!(guest.lastName ?? '').trim()) {
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

        <div className="max-w-4xl mx-auto">
            {/* Progress Steps - Enhanced */}
            <div className="mb-8">
                <BookingProgressStepper currentStep={currentStep} />
            </div>

            {/* Form Content - Glassmorphism */}
            <GlassCard className="p-6 md:p-8" intensity="strong">
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
                    <div className="space-y-6">
                        <div className="border-b border-secondary-200/50 pb-4 mb-4">
                            <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                                    <Users size={24} />
                                </div>
                                Guest Information
                            </h2>
                            <p className="text-secondary-600 dark:text-secondary-400 mt-1 ml-14">
                                Who will be staying with us?
                            </p>
                        </div>

                        <GuestDetailsInput
                            adults={formData.adults}
                            children={formData.children}
                            guestDetails={formData.guestDetails}
                            onChange={(guests) => updateField('guestDetails', guests)}
                            primaryGuestInfo={primaryGuestInfo}
                            errors={errors as Record<string, string | undefined>}
                        />

                        {errors.guestDetails && (
                            <div className="flex items-center gap-3 text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-4 rounded-xl">
                                <AlertCircle size={20} className="flex-shrink-0" />
                                <p className="text-sm font-medium">{errors.guestDetails}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Vehicles */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="border-b border-secondary-200/50 pb-4 mb-4">
                            <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                                    <Car size={24} />
                                </div>
                                Vehicle Information
                            </h2>
                            <p className="text-secondary-600 dark:text-secondary-400 mt-1 ml-14">
                                Bringing a vehicle? Let us know for parking arrangements.
                            </p>
                        </div>

                        <VehicleInput
                            vehicles={formData.vehicles}
                            onChange={(vehicles: Omit<Vehicle, 'id'>[]) =>
                                updateField('vehicles', vehicles)
                            }
                            maxVehicles={site.maxVehicles}
                        />

                        {errors.vehicles && (
                            <div className="flex items-center gap-3 text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-4 rounded-xl">
                                <AlertCircle size={20} className="flex-shrink-0" />
                                <p className="text-sm font-medium">{errors.vehicles}</p>
                            </div>
                        )}

                        <div className="bg-secondary-50 dark:bg-gray-800/50 border border-secondary-200 dark:border-gray-700 p-4 rounded-xl flex justify-between items-center text-sm">
                            <span className="text-secondary-600 dark:text-secondary-400">Parking Capacity</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                {formData.vehicles.length} / {site.maxVehicles} Vehicles
                            </span>
                        </div>
                    </div>
                )}

                {/* Step 4: Equipment */}
                {currentStep === 4 && (
                    <div className="space-y-6">
                        <div className="border-b border-secondary-200/50 pb-4 mb-4">
                            <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                                    <Package size={24} />
                                </div>
                                Enhancements
                            </h2>
                            <p className="text-secondary-600 dark:text-secondary-400 mt-1 ml-14">
                                Add equipment rentals to upgrade your adventure.
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
                <div className="flex justify-between mt-8 pt-6 border-t border-secondary-200/50 dark:border-gray-700">
                    <div>
                        {currentStep > 1 && (
                            <Button variant="outline" onClick={handleBack} className="min-w-[100px]">
                                Back
                            </Button>
                        )}
                        {onCancel && currentStep === 1 && (
                            <Button variant="outline" onClick={onCancel} className="min-w-[100px]">
                                Cancel
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        {!isLastStep ? (
                            <Button variant="primary" onClick={handleNext} className="min-w-[120px]">
                                Next Step
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="min-w-[150px] shadow-lg shadow-primary-600/20"
                            >
                                {isSubmitting ? 'Processing...' : submitLabel}
                            </Button>
                        )}
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
