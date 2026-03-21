/**
 * BookingForm Component
 * Multi-step form for authenticated users to create a new booking
 * 
 * Refactored to use shared MultiStepBookingForm base
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Site } from '@/types';
import { createBooking } from '@/services/api/bookings';
import type { CreateBookingData } from '@/services/api/bookings';
import { useAuthStore } from '@/stores/authStore';
import { MultiStepBookingForm } from './MultiStepBookingForm';
import type { BookingFormData } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface BookingFormProps {
    site: Site;
    initialCheckInDate?: string | undefined;
    initialCheckOutDate?: string | undefined;
    initialGuests?: number | undefined;
    onSuccess?: ((bookingId: string) => void) | undefined;
    onCancel?: (() => void) | undefined;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Map form data to API request format for authenticated bookings
 */
function mapToCreateBookingData(
    formData: BookingFormData,
    siteId: string,
    user: { email?: string | undefined; phone?: string | undefined } | null
): CreateBookingData {
    // Determine primary guest (first adult)
    let primaryAssigned = false;
    const mappedGuests = formData.guestDetails.map((g) => {
        const type = g.isChild ? 'CHILD' : 'ADULT';
        let isPrimary = false;
        if (!primaryAssigned && type === 'ADULT') {
            isPrimary = true;
            primaryAssigned = true;
        }
        return {
            firstName: g.firstName,
            lastName: g.lastName,
            type: type as 'ADULT' | 'CHILD',
            isPrimary,
            email: isPrimary ? user?.email : undefined,
            phone: isPrimary ? user?.phone : undefined,
        };
    });

    return {
        siteId,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        adultGuests: formData.adults,
        childGuests: formData.children,
        petGuests: formData.pets,
        guests: mappedGuests,
        vehicles: formData.vehicles,
        specialRequests: formData.specialRequests || undefined,
        equipmentReservations:
            formData.equipmentReservations.length > 0
                ? formData.equipmentReservations
                : undefined,
    };
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BookingForm: React.FC<BookingFormProps> = ({
    site,
    initialCheckInDate = '',
    initialCheckOutDate = '',
    initialGuests = 2,
    onSuccess,
    onCancel,
}) => {
    const { user } = useAuthStore();
    const [submitError, setSubmitError] = useState<string>();

    // Create booking mutation
    const mutation = useMutation({
        mutationFn: (data: CreateBookingData) => createBooking(data),
        onSuccess: (booking) => {
            onSuccess?.(booking.id);
        },
        onError: (error: Error) => {
            setSubmitError(error.message || 'Failed to create booking');
        },
    });

    // Handle form submission
    const handleSubmit = useCallback(
        (formData: BookingFormData) => {
            setSubmitError(undefined);
            const bookingData = mapToCreateBookingData(formData, site.id, user);
            mutation.mutate(bookingData);
        },
        [mutation, site.id, user]
    );

    return (
        <MultiStepBookingForm
            site={site}
            initialCheckInDate={initialCheckInDate}
            initialCheckOutDate={initialCheckOutDate}
            initialGuests={initialGuests}
            primaryGuestInfo={
                user
                    ? { firstName: user.firstName, lastName: user.lastName }
                    : undefined
            }
            onSubmit={handleSubmit}
            isSubmitting={mutation.isPending}
            submitError={submitError}
            onCancel={onCancel}
        />
    );
};