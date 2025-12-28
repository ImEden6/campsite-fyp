/**
 * ManualBookingForm Component
 * Form for staff to create bookings manually without payment
 * 
 * Refactored to use shared useBookingFormState hook
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Users } from 'lucide-react';
import { Button, Input, Select, Card } from '@/components/ui';
import { VehicleInput, EquipmentSelector, PricingBreakdown } from './';
import { GuestDetailsInput } from './GuestDetailsInput';
import { getSites } from '@/services/api/sites';
import { calculateBookingPrice, createBooking } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { BookingStatus, SiteStatus } from '@/types';
import type { CreateBookingData } from '@/services/api/bookings';
import { CURRENCY_SYMBOL } from '@/utils/currency';
import { useBookingFormState } from '../hooks';

// ============================================================================
// TYPES
// ============================================================================

export interface ManualBookingFormProps {
  onSuccess?: (bookingId: string) => void;
  onCancel?: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string' && err.trim()) {
    return err;
  }
  return 'An unexpected error occurred';
};

// ============================================================================
// COMPONENT
// ============================================================================

const ManualBookingForm: React.FC<ManualBookingFormProps> = ({ onSuccess, onCancel }) => {
  // Use shared form state hook for core booking data
  const {
    formData,
    updateField,
    today,
  } = useBookingFormState({
    initialData: { adults: 1 }, // Default to 1 adult for manual bookings
  });

  // Manual-form specific state
  const [siteId, setSiteId] = useState('');
  const [status, setStatus] = useState<BookingStatus>(BookingStatus.CONFIRMED);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available sites
  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: queryKeys.sites.lists(),
    queryFn: async () => {
      try {
        return await getSites({ status: [SiteStatus.AVAILABLE] });
      } catch {
        return [];
      }
    },
  });

  // Get selected site for max vehicles
  const selectedSite = useMemo(
    () => sites.find((s) => s.id === siteId),
    [sites, siteId]
  );

  // Calculate pricing reactively with useQuery
  const { data: pricing } = useQuery({
    queryKey: [
      'booking-price',
      siteId,
      formData.checkInDate,
      formData.checkOutDate,
      formData.equipmentReservations,
    ],
    queryFn: () =>
      calculateBookingPrice(
        siteId,
        formData.checkInDate,
        formData.checkOutDate,
        formData.equipmentReservations
      ),
    enabled: !!siteId && !!formData.checkInDate && !!formData.checkOutDate,
  });

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const bookingData: CreateBookingData = {
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
      };

      const booking = await createBooking(bookingData);
      onSuccess?.(booking.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [siteId, formData, onSuccess]);

  // Handle site change
  const handleSiteChange = useCallback((value: string) => {
    setSiteId(value);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Booking Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Site Selection */}
          <div className="md:col-span-2">
            <Select
              label="Site *"
              value={siteId}
              onChange={handleSiteChange}
              disabled={sitesLoading}
              options={[
                { value: '', label: 'Select a site' },
                ...sites.map((site) => ({
                  value: site.id,
                  label: `${site.name} - ${site.type} (${CURRENCY_SYMBOL}${site.basePrice}/night)`,
                })),
              ]}
            />
          </div>

          {/* Check-in Date */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Calendar size={16} className="text-gray-700 dark:text-gray-300" />
              Check-in Date *
            </label>
            <Input
              type="date"
              value={formData.checkInDate}
              onChange={(e) => updateField('checkInDate', e.target.value)}
              required
              min={today}
              icon={<Calendar size={18} className="text-gray-700 dark:text-gray-300" />}
            />
          </div>

          {/* Check-out Date */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Calendar size={16} className="text-gray-700 dark:text-gray-300" />
              Check-out Date *
            </label>
            <Input
              type="date"
              value={formData.checkOutDate}
              onChange={(e) => updateField('checkOutDate', e.target.value)}
              required
              min={formData.checkInDate || today}
              icon={<Calendar size={18} className="text-gray-700 dark:text-gray-300" />}
            />
          </div>

          {/* Adults */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adults *
            </label>
            <Input
              type="number"
              value={formData.adults}
              onChange={(e) => updateField('adults', parseInt(e.target.value, 10) || 0)}
              min={1}
              required
            />
          </div>

          {/* Children */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Children
            </label>
            <Input
              type="number"
              value={formData.children}
              onChange={(e) => updateField('children', parseInt(e.target.value, 10) || 0)}
              min={0}
            />
          </div>

          {/* Pets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pets
            </label>
            <Input
              type="number"
              value={formData.pets}
              onChange={(e) => updateField('pets', parseInt(e.target.value, 10) || 0)}
              min={0}
            />
          </div>

          {/* Status */}
          <div>
            <Select
              label="Status *"
              value={status}
              onChange={(value) => setStatus(value as BookingStatus)}
              options={[
                { value: BookingStatus.PENDING, label: 'Pending' },
                { value: BookingStatus.CONFIRMED, label: 'Confirmed' },
              ]}
            />
          </div>

          {/* Special Requests */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Special Requests / Notes
            </label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) => updateField('specialRequests', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              rows={3}
              placeholder="Any special requests or notes..."
            />
          </div>
        </div>
      </Card>

      {/* Guest Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Users size={20} className="text-blue-600 dark:text-blue-400" />
          Guest Information
        </h3>
        <GuestDetailsInput
          adults={formData.adults}
          children={formData.children}
          guestDetails={formData.guestDetails}
          onChange={(guests) => updateField('guestDetails', guests)}
        />
      </Card>

      {/* Vehicles */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Vehicles (Optional)
        </h3>
        <VehicleInput
          vehicles={formData.vehicles}
          onChange={(vehicles) => updateField('vehicles', vehicles)}
          maxVehicles={selectedSite?.maxVehicles ?? 5}
        />
      </Card>

      {/* Equipment Rentals */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Equipment Rentals (Optional)
        </h3>
        <EquipmentSelector
          selectedEquipment={formData.equipmentReservations}
          onChange={(equipment) => updateField('equipmentReservations', equipment)}
          checkInDate={formData.checkInDate}
          checkOutDate={formData.checkOutDate}
        />
      </Card>

      {/* Pricing */}
      {pricing && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Pricing Summary
          </h3>
          <PricingBreakdown pricing={pricing} />
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> This is a manual booking. Payment will be marked as pending and
              can be collected separately.
            </p>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading || !siteId || !formData.checkInDate || !formData.checkOutDate}
        >
          {loading ? 'Creating...' : 'Create Booking'}
        </Button>
      </div>
    </form>
  );
};

export { ManualBookingForm };
export default ManualBookingForm;
