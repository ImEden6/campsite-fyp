/**
 * BookingModificationDialog Component
 * Allows customers to modify their booking dates
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Users, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { updateBooking, calculateBookingPrice, type BookingPricing } from '@/services/api/bookings';
import { checkSiteAvailability } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';
import { useToast } from '@/hooks/useToast';
import type { Booking } from '@/types';

interface BookingModificationDialogProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModificationDialog: React.FC<BookingModificationDialogProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const [checkInDate, setCheckInDate] = useState<Date>(new Date(booking.checkInDate));
  const [checkOutDate, setCheckOutDate] = useState<Date>(new Date(booking.checkOutDate));
  const [adults, setAdults] = useState(booking.guests.adults);
  const [children, setChildren] = useState(booking.guests.children);
  const [pets, setPets] = useState(booking.guests.pets);
  const [specialRequests, setSpecialRequests] = useState(booking.specialRequests || '');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [newPricing, setNewPricing] = useState<BookingPricing | null>(null);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
    return 'An unexpected error occurred';
  };

  const checkAvailability = useCallback(async () => {
    setIsCheckingAvailability(true);
    setAvailabilityError(null);
    setNewPricing(null);

    try {
      // Check if site is available for new dates
      const available = await checkSiteAvailability(
        booking.siteId,
        checkInDate.toISOString(),
        checkOutDate.toISOString(),
        booking.id // Exclude current booking
      );

      if (!available) {
        setAvailabilityError('This site is not available for the selected dates');
        return;
      }

      // Calculate new pricing
      const pricing = await calculateBookingPrice(
        booking.siteId,
        checkInDate.toISOString(),
        checkOutDate.toISOString(),
        booking.equipmentRentals?.map(er => ({
          equipmentId: er.equipmentId,
          quantity: er.quantity,
        }))
      );

      setNewPricing(pricing);
    } catch (error: unknown) {
      setAvailabilityError(getErrorMessage(error) || 'Failed to check availability');
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [booking.equipmentRentals, booking.id, booking.siteId, checkInDate, checkOutDate]);

  // Check if dates have changed
  const datesChanged = 
    checkInDate.getTime() !== new Date(booking.checkInDate).getTime() ||
    checkOutDate.getTime() !== new Date(booking.checkOutDate).getTime();

  // Check availability when dates change
  useEffect(() => {
    if (datesChanged && isOpen) {
      void checkAvailability();
    }
  }, [checkAvailability, datesChanged, isOpen]);

  const updateMutation = useMutation({
    mutationFn: () => updateBooking(booking.id, {
      checkInDate: checkInDate.toISOString(),
      checkOutDate: checkOutDate.toISOString(),
      guests: { adults, children, pets },
      specialRequests: specialRequests || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      showToast('Booking updated successfully', 'success');
      onSuccess();
    },
    onError: (error: unknown) => {
      showToast(getErrorMessage(error) || 'Failed to update booking', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (checkInDate >= checkOutDate) {
      showToast('Check-out date must be after check-in date', 'error');
      return;
    }

    if (adults < 1) {
      showToast('At least one adult is required', 'error');
      return;
    }

    if (datesChanged && availabilityError) {
      showToast('Please resolve availability issues before updating', 'error');
      return;
    }

    updateMutation.mutate();
  };

  const priceDifference = newPricing 
    ? newPricing.totalAmount - booking.totalAmount 
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modify Booking"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Booking Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Current Booking</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <span className="font-medium">Check-in:</span>{' '}
              {new Date(booking.checkInDate).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Check-out:</span>{' '}
              {new Date(booking.checkOutDate).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Guests:</span>{' '}
              {booking.guests.adults} adults, {booking.guests.children} children
            </div>
            <div>
              <span className="font-medium">Total:</span> ${booking.totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              New Check-in Date
            </label>
            <DatePicker
              selected={checkInDate}
              onChange={(date) => date && setCheckInDate(date)}
              minDate={new Date()}
              selectsStart
              startDate={checkInDate}
              endDate={checkOutDate}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              New Check-out Date
            </label>
            <DatePicker
              selected={checkOutDate}
              onChange={(date) => date && setCheckOutDate(date)}
              minDate={checkInDate}
              selectsEnd
              startDate={checkInDate}
              endDate={checkOutDate}
              className="w-full"
            />
          </div>
        </div>

        {/* Availability Check */}
        {datesChanged && (
          <div>
            {isCheckingAvailability ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 size={16} className="animate-spin" />
                <span>Checking availability...</span>
              </div>
            ) : availabilityError ? (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <span>{availabilityError}</span>
              </div>
            ) : newPricing ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">✓ Available</h4>
                <div className="space-y-2 text-sm text-green-800">
                  <div className="flex justify-between">
                    <span>New Total:</span>
                    <span className="font-semibold">${newPricing.totalAmount.toFixed(2)}</span>
                  </div>
                  {priceDifference !== 0 && (
                    <div className="flex justify-between">
                      <span>Price Difference:</span>
                      <span className={`font-semibold ${priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {priceDifference > 0 ? '+' : ''}${priceDifference.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {priceDifference > 0 && (
                    <p className="text-xs mt-2">
                      Additional payment will be required to complete this modification.
                    </p>
                  )}
                  {priceDifference < 0 && (
                    <p className="text-xs mt-2">
                      A refund of ${Math.abs(priceDifference).toFixed(2)} will be processed.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Guest Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users size={16} className="inline mr-1" />
            Guests
          </label>
          <div className="grid grid-cols-3 gap-4">
            <Input
              type="number"
              label="Adults"
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value) || 0)}
              min={1}
              max={booking.site?.capacity || 10}
              required
            />
            <Input
              type="number"
              label="Children"
              value={children}
              onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
              min={0}
              max={booking.site?.capacity || 10}
            />
            <Input
              type="number"
              label="Pets"
              value={pets}
              onChange={(e) => setPets(parseInt(e.target.value) || 0)}
              min={0}
              max={5}
            />
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requests
          </label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any special requests or notes..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={
              updateMutation.isPending ||
              (datesChanged && (isCheckingAvailability || !!availabilityError))
            }
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Updating...
              </>
            ) : (
              'Update Booking'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
