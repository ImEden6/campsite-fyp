/**
 * GuestBookingForm Component
 * Multi-step form for guest users (not logged in) to create a booking
 * 
 * Refactored to use shared MultiStepBookingForm base
 */

import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Site } from '@/types';
import { createGuestBooking } from '@/services/api/bookings';
import type { CreateGuestBookingData } from '@/services/api/bookings';
import { MultiStepBookingForm } from './MultiStepBookingForm';
import type { BookingFormData } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface GuestBookingFormProps {
  site: Site;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  initialCheckInDate?: string;
  initialCheckOutDate?: string;
  initialGuests?: number;
  onSuccess?: (bookingId: string, accessToken: string, bookingNumber: string) => void;
  onCancel?: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Map form data to API request format for guest bookings
 */
function mapToGuestBookingData(
  formData: BookingFormData,
  siteId: string,
  guestInfo: GuestBookingFormProps['guestInfo']
): CreateGuestBookingData {
  return {
    siteId,
    checkInDate: formData.checkInDate,
    checkOutDate: formData.checkOutDate,
    adultGuests: formData.adults,
    childGuests: formData.children,
    petGuests: formData.pets,
    guests: formData.guestDetails.map((guest, index) => ({
      firstName: guest.firstName,
      lastName: guest.lastName,
      type: guest.isChild ? 'CHILD' : 'ADULT',
      isPrimary: index === 0,
    })),
    vehicles: formData.vehicles,
    specialRequests: formData.specialRequests || undefined,
    equipmentReservations:
      formData.equipmentReservations.length > 0
        ? formData.equipmentReservations
        : undefined,
    firstName: guestInfo.firstName,
    lastName: guestInfo.lastName,
    email: guestInfo.email,
    phone: guestInfo.phone,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GuestBookingForm: React.FC<GuestBookingFormProps> = ({
  site,
  guestInfo,
  initialCheckInDate = '',
  initialCheckOutDate = '',
  initialGuests = 2,
  onSuccess,
  onCancel,
}) => {
  const [submitError, setSubmitError] = useState<string>();

  // Create guest booking mutation
  const mutation = useMutation({
    mutationFn: (data: CreateGuestBookingData) => createGuestBooking(data),
    onSuccess: (result) => {
      onSuccess?.(result.booking.id, result.accessToken, result.booking.bookingNumber);
    },
    onError: (error: Error) => {
      setSubmitError(error.message || 'Failed to create booking');
    },
  });

  // Handle form submission
  const handleSubmit = useCallback(
    (formData: BookingFormData) => {
      setSubmitError(undefined);
      const bookingData = mapToGuestBookingData(formData, site.id, guestInfo);
      mutation.mutate(bookingData);
    },
    [mutation, site.id, guestInfo]
  );

  return (
    <MultiStepBookingForm
      site={site}
      initialCheckInDate={initialCheckInDate}
      initialCheckOutDate={initialCheckOutDate}
      initialGuests={initialGuests}
      primaryGuestInfo={{
        firstName: guestInfo.firstName,
        lastName: guestInfo.lastName,
      }}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      submitError={submitError}
      onCancel={onCancel}
    />
  );
};
