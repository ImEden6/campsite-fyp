/**
 * ManualBookingForm Component
 * Form for staff to create bookings manually without payment
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { Button, Input, Select, Card } from '@/components/ui';
import { VehicleInput, EquipmentSelector, PricingBreakdown } from './';
import { getSites } from '@/services/api/sites';
import { mockSites } from '@/services/api/mock-sites';
import { calculateBookingPrice, createBooking } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { BookingStatus, Vehicle, SiteStatus } from '@/types';
import type { CreateBookingData, BookingPricing } from '@/services/api/bookings';

export interface ManualBookingFormProps {
  onSuccess?: (bookingId: string) => void;
  onCancel?: () => void;
}

interface GuestsState {
  adults: number;
  children: number;
  pets: number;
}

interface ManualFormState {
  siteId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: GuestsState;
  vehicles: Omit<Vehicle, 'id'>[];
  specialRequests: string;
  equipmentRentals: { equipmentId: string; quantity: number }[];
  status: BookingStatus;
  skipPayment: boolean;
}

const ManualBookingForm: React.FC<ManualBookingFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<ManualFormState>({
    siteId: '',
    checkInDate: '',
    checkOutDate: '',
    guests: {
      adults: 1,
      children: 0,
      pets: 0,
    },
    vehicles: [],
    specialRequests: '',
    equipmentRentals: [],
    status: BookingStatus.CONFIRMED,
    skipPayment: true,
  });

  const [pricing, setPricing] = useState<BookingPricing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'string' && err.trim()) {
      return err;
    }
    return 'An unexpected error occurred';
  };

  // Fetch available sites (with mock data fallback)
  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: queryKeys.sites.lists(),
    queryFn: async () => {
      try {
        const apiSites = await getSites({ status: [SiteStatus.AVAILABLE] });
        // Use mock data if API returns empty
        if (apiSites.length === 0) {
          return mockSites.filter(s => s.status === SiteStatus.AVAILABLE);
        }
        return apiSites;
      } catch {
        // Fallback to mock data on error
        return mockSites.filter(s => s.status === SiteStatus.AVAILABLE);
      }
    },
  });

  // Calculate pricing when dates or site changes
  const handleCalculatePrice = async (state: ManualFormState = formData) => {
    if (!state.siteId || !state.checkInDate || !state.checkOutDate) {
      return;
    }

    try {
      const price = await calculateBookingPrice(
        state.siteId,
        state.checkInDate,
        state.checkOutDate,
        state.equipmentRentals
      );
      setPricing(price);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const bookingData: CreateBookingData = {
        siteId: formData.siteId,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        guests: formData.guests,
        vehicles: formData.vehicles,
        specialRequests: formData.specialRequests || undefined,
        equipmentRentals: formData.equipmentRentals.length > 0 ? formData.equipmentRentals : undefined,
      };

      const booking = await createBooking(bookingData);
      onSuccess?.(booking.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVehiclesChange = (vehicles: Omit<Vehicle, 'id'>[]) => {
    setFormData((prev) => ({ ...prev, vehicles }));
  };

  const handleEquipmentChange = (equipment: { equipmentId: string; quantity: number }[]) => {
    setFormData((prev) => {
      const next = { ...prev, equipmentRentals: equipment };
      void handleCalculatePrice(next);
      return next;
    });
  };

  const updateGuests = (updater: (prev: GuestsState) => GuestsState) => {
    setFormData((prev) => ({ ...prev, guests: updater(prev.guests) }));
  };

  const updateFormField = <K extends keyof ManualFormState>(field: K, value: ManualFormState[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value } as ManualFormState;
      if (field === 'siteId' || field === 'checkInDate' || field === 'checkOutDate') {
        void handleCalculatePrice(next);
      }
      return next;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Booking Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Site Selection */}
          <div className="md:col-span-2">
            <Select
              label="Site *"
              value={formData.siteId}
              onChange={(value) => updateFormField('siteId', value)}
              disabled={sitesLoading}
              options={[
                { value: '', label: 'Select a site' },
                ...sites.map((site) => ({
                  value: site.id,
                  label: `${site.name} - ${site.type} ($${site.basePrice}/night)`,
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
              onChange={(e) => updateFormField('checkInDate', e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
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
              onChange={(e) => updateFormField('checkOutDate', e.target.value)}
              required
              min={formData.checkInDate || new Date().toISOString().split('T')[0]}
              icon={<Calendar size={18} className="text-gray-700 dark:text-gray-300" />}
            />
          </div>

          {/* Adults */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adults *</label>
            <Input
              type="number"
              value={formData.guests.adults}
              onChange={(e) =>
                updateGuests((prev) => ({ ...prev, adults: parseInt(e.target.value, 10) || 0 }))
              }
              min={1}
              required
            />
          </div>

          {/* Children */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Children</label>
            <Input
              type="number"
              value={formData.guests.children}
              onChange={(e) =>
                updateGuests((prev) => ({ ...prev, children: parseInt(e.target.value, 10) || 0 }))
              }
              min={0}
            />
          </div>

          {/* Pets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pets</label>
            <Input
              type="number"
              value={formData.guests.pets}
              onChange={(e) =>
                updateGuests((prev) => ({ ...prev, pets: parseInt(e.target.value, 10) || 0 }))
              }
              min={0}
            />
          </div>

          {/* Status */}
          <div>
            <Select
              label="Status *"
              value={formData.status}
              onChange={(value) => updateFormField('status', value as BookingStatus)}
              options={[
                { value: BookingStatus.PENDING, label: 'Pending' },
                { value: BookingStatus.CONFIRMED, label: 'Confirmed' },
              ]}
            />
          </div>

          {/* Special Requests */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Special Requests / Notes</label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) => updateFormField('specialRequests', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              rows={3}
              placeholder="Any special requests or notes..."
            />
          </div>
        </div>
      </Card>

      {/* Vehicles */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Vehicles</h3>
        <VehicleInput
          vehicles={formData.vehicles}
          onChange={handleVehiclesChange}
          maxVehicles={5}
        />
      </Card>

      {/* Equipment Rentals */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Equipment Rentals (Optional)</h3>
        <EquipmentSelector
          selectedEquipment={formData.equipmentRentals}
          onChange={handleEquipmentChange}
          checkInDate={formData.checkInDate}
          checkOutDate={formData.checkOutDate}
        />
      </Card>

      {/* Pricing */}
      {pricing && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Pricing Summary</h3>
          <PricingBreakdown pricing={pricing} />
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> This is a manual booking. Payment will be marked as pending and can be
              collected separately.
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
        <Button type="submit" disabled={loading || !formData.siteId || !formData.checkInDate || !formData.checkOutDate}>
          {loading ? 'Creating...' : 'Create Booking'}
        </Button>
      </div>
    </form>
  );
};

export { ManualBookingForm };
export default ManualBookingForm;
