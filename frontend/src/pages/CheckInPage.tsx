/**
 * CheckInPage
 * Staff interface for checking in guests
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, User, ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { Button, ErrorAlert } from '@/components/ui';
import { GlassCard } from '@/components/ui/GlassCard';
import { getBookings, checkInBooking, getBookingQRCode } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { Booking, BookingStatus } from '@/types';
import { format } from 'date-fns';
import { CURRENCY_SYMBOL } from '@/utils/currency';
import { useNavigate } from 'react-router-dom';
import { BookingSearchPanel } from '@/features/bookings/components';

const CheckInPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  // Search for bookings
  const { data: bookings = [], isLoading: searchLoading } = useQuery({
    queryKey: queryKeys.bookings.list({
      searchTerm,
      status: [BookingStatus.CONFIRMED],
    }),
    queryFn: () => getBookings({
      searchTerm,
      status: [BookingStatus.CONFIRMED],
    }),
    enabled: searchTerm.length >= 3,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (bookingId: string) => checkInBooking(bookingId),
    onSuccess: async (updatedBooking) => {
      // Fetch QR code
      try {
        const qr = await getBookingQRCode(updatedBooking.id);
        setQrCode(qr);
      } catch (error) {
        console.error('Failed to fetch QR code:', error);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      setShowSuccess(true);
      setSelectedBooking(updatedBooking);
    },
  });

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setQrCode(null);
    setShowSuccess(false);
  };

  const handleCheckIn = () => {
    if (selectedBooking) {
      checkInMutation.mutate(selectedBooking.id);
    }
  };

  const handleReset = () => {
    setSelectedBooking(null);
    setQrCode(null);
    setShowSuccess(false);
    setSearchTerm('');
  };

  const renderBookingDetails = () => {
    if (!selectedBooking) return null;

    return (
      <GlassCard className="p-8" intensity="strong">
        <h3 className="font-heading text-2xl font-bold mb-6 text-gray-900 dark:text-primary-100 border-b border-gray-200 dark:border-secondary-700 pb-4">Booking Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Guest Name</div>
            <div className="font-semibold text-lg flex items-center gap-2">
              <User className="w-4 h-4 text-primary-500" />
              {selectedBooking.user?.firstName} {selectedBooking.user?.lastName}
            </div>
          </div>
          <div>
            <div className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Booking Number</div>
            <div className="font-mono font-medium text-lg">{selectedBooking.bookingNumber}</div>
          </div>
          <div>
            <div className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Site</div>
            <div className="font-medium">
              {selectedBooking.site?.name || `Site ${selectedBooking.siteId}`}
            </div>
          </div>
          <div>
            <div className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Site Type</div>
            <div className="font-medium capitalize">{selectedBooking.site?.type}</div>
          </div>
          <div>
            <div className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Check-in Date</div>
            <div className="font-medium">
              {format(selectedBooking.checkInDate instanceof Date ? selectedBooking.checkInDate : new Date(selectedBooking.checkInDate), 'MMM d, yyyy h:mm a')}
            </div>
          </div>
          <div>
            <div className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Check-out Date</div>
            <div className="font-medium">
              {format(selectedBooking.checkOutDate instanceof Date ? selectedBooking.checkOutDate : new Date(selectedBooking.checkOutDate), 'MMM d, yyyy h:mm a')}
            </div>
          </div>
          <div>
            <div className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Guests</div>
            <div className="font-medium">
              {selectedBooking.guests.adults} adults, {selectedBooking.guests.children} children
              {selectedBooking.guests.pets > 0 && `, ${selectedBooking.guests.pets} pets`}
            </div>
          </div>
          <div>
            <div className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Total Amount</div>
            <div className="font-bold text-xl text-primary-600 dark:text-primary-400">{CURRENCY_SYMBOL}{selectedBooking.totalAmount.toFixed(2)}</div>
          </div>
        </div>

        {selectedBooking.vehicles && selectedBooking.vehicles.length > 0 && (
          <div className="mb-8">
            <div className="text-sm font-semibold text-gray-900 dark:text-primary-100 mb-3 border-b border-gray-100 dark:border-secondary-800 pb-2">Vehicles</div>
            <div className="space-y-2">
              {selectedBooking.vehicles.map((vehicle, index) => (
                <div key={index} className="text-sm bg-gray-50/50 dark:bg-night-surface/50 p-3 rounded-lg border border-gray-100 dark:border-secondary-700">
                  <span className="font-medium text-gray-900 dark:text-primary-100">{vehicle.year} {vehicle.make} {vehicle.model}</span>
                  <span className="mx-2 text-secondary-300">|</span>
                  <span className="font-mono text-gray-600 dark:text-secondary-400">{vehicle.licensePlate} ({vehicle.state})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedBooking.specialRequests && (
          <div className="mb-8">
            <div className="text-sm font-semibold text-gray-900 dark:text-primary-100 mb-3 border-b border-gray-100 dark:border-secondary-800 pb-2">Special Requests</div>
            <div className="text-sm bg-yellow-50/50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800/30 text-yellow-800 dark:text-yellow-200">
              {selectedBooking.specialRequests}
            </div>
          </div>
        )}

        {!showSuccess && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-secondary-700">
            <Button variant="ghost" onClick={handleReset}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckIn}
              disabled={checkInMutation.isPending}
              className="shadow-lg shadow-primary-600/20"
            >
              {checkInMutation.isPending ? 'Checking In...' : 'Check In Guest'}
            </Button>
          </div>
        )}
      </GlassCard>
    );
  };

  const renderSuccess = () => {
    if (!showSuccess || !selectedBooking) return null;

    return (
      <GlassCard className="p-8 text-center bg-green-50/30 dark:bg-green-900/10 border-green-200 dark:border-green-800/50" intensity="strong">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="font-heading text-2xl font-bold text-gray-900 dark:text-primary-100 mb-2">Check-in Successful!</h3>
        <p className="text-secondary-600 dark:text-secondary-400 mb-8 max-w-md mx-auto">
          <span className="font-semibold text-gray-900 dark:text-secondary-200">{selectedBooking.user?.firstName} {selectedBooking.user?.lastName}</span> has been successfully checked into <span className="font-semibold text-gray-900 dark:text-secondary-200">{selectedBooking.site?.name}</span>.
        </p>

        {qrCode && (
          <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm inline-block border border-gray-100">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-semibold">Site Access QR Code</div>
            <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
            <p className="text-xs text-gray-500 mt-3 text-center">
              Scan for site access
            </p>
          </div>
        )}

        <div>
          <Button onClick={handleReset} size="lg" className="shadow-lg shadow-primary-600/20">Check In Another Guest</Button>
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-2 text-gray-900 dark:text-primary-100">Guest Check-In</h1>
            <p className="text-secondary-600 dark:text-secondary-400">Search for and check in confirmed bookings</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/staff/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Staff Dashboard
          </Button>
        </div>

        {!showSuccess && (
          <BookingSearchPanel
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            bookings={bookings}
            isLoading={searchLoading}
            selectedBooking={selectedBooking}
            onSelectBooking={handleSelectBooking}
            emptyMessage="No confirmed bookings found"
            badgeVariant="info"
            renderSecondaryInfo={(booking) => (
              <>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-secondary-400" />
                  {booking.site?.name || `Site ${booking.siteId}`}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-secondary-400" />
                  {format(booking.checkInDate instanceof Date ? booking.checkInDate : new Date(booking.checkInDate), 'MMM d, yyyy h:mm a')}
                </div>
              </>
            )}
            renderRightPanel={(booking) => (
              <div className="text-sm text-secondary-500">
                {booking.guests.adults} adults, {booking.guests.children} children
              </div>
            )}
          />
        )}

        {selectedBooking && !showSuccess && renderBookingDetails()}
        {showSuccess && renderSuccess()}

        {checkInMutation.isError && (
          <ErrorAlert message={`Failed to check in: ${(checkInMutation.error as Error)?.message || 'Unknown error'}`} />
        )}
      </div>
    </div>
  );
};

export default CheckInPage;
