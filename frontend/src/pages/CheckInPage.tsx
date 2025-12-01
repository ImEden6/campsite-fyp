/**
 * CheckInPage
 * Staff interface for checking in guests
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle, Calendar, MapPin } from 'lucide-react';
import { Button, Input, Card, Badge } from '@/components/ui';
import { getBookings, checkInBooking, getBookingQRCode } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { Booking, BookingStatus } from '@/types';
import { format } from 'date-fns';

const CheckInPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

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

  const renderSearchResults = () => {
    if (searchTerm.length < 3) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Enter at least 3 characters to search</p>
        </div>
      );
    }

    if (searchLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (bookings.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No confirmed bookings found</p>
          <p className="text-sm mt-1">Try searching by guest name, booking number, or site</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="cursor-pointer"
            onClick={() => handleSelectBooking(booking)}
          >
            <Card className={`p-4 hover:shadow-md transition-shadow ${
              selectedBooking?.id === booking.id ? 'ring-2 ring-blue-500' : ''
            }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">
                    {booking.user?.firstName} {booking.user?.lastName}
                  </h4>
                  <Badge variant="info">{booking.bookingNumber}</Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {booking.site?.name || `Site ${booking.siteId}`}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(booking.checkInDate instanceof Date ? booking.checkInDate : new Date(booking.checkInDate), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {booking.guests.adults} adults, {booking.guests.children} children
                </div>
              </div>
            </div>
          </Card>
          </div>
        ))}
      </div>
    );
  };

  const renderBookingDetails = () => {
    if (!selectedBooking) return null;

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Booking Details</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-sm text-gray-500">Guest Name</div>
            <div className="font-medium">
              {selectedBooking.user?.firstName} {selectedBooking.user?.lastName}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Booking Number</div>
            <div className="font-medium">{selectedBooking.bookingNumber}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Site</div>
            <div className="font-medium">
              {selectedBooking.site?.name || `Site ${selectedBooking.siteId}`}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Site Type</div>
            <div className="font-medium">{selectedBooking.site?.type}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Check-in Date</div>
            <div className="font-medium">
              {format(selectedBooking.checkInDate instanceof Date ? selectedBooking.checkInDate : new Date(selectedBooking.checkInDate), 'MMM d, yyyy h:mm a')}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Check-out Date</div>
            <div className="font-medium">
              {format(selectedBooking.checkOutDate instanceof Date ? selectedBooking.checkOutDate : new Date(selectedBooking.checkOutDate), 'MMM d, yyyy h:mm a')}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Guests</div>
            <div className="font-medium">
              {selectedBooking.guests.adults} adults, {selectedBooking.guests.children} children
              {selectedBooking.guests.pets > 0 && `, ${selectedBooking.guests.pets} pets`}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Total Amount</div>
            <div className="font-medium">${selectedBooking.totalAmount.toFixed(2)}</div>
          </div>
        </div>

        {selectedBooking.vehicles && selectedBooking.vehicles.length > 0 && (
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">Vehicles</div>
            <div className="space-y-2">
              {selectedBooking.vehicles.map((vehicle, index) => (
                <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                  {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.licensePlate} ({vehicle.state})
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedBooking.specialRequests && (
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">Special Requests</div>
            <div className="text-sm bg-gray-50 p-3 rounded">{selectedBooking.specialRequests}</div>
          </div>
        )}

        {!showSuccess && (
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleReset}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckIn}
              disabled={checkInMutation.isPending}
            >
              {checkInMutation.isPending ? 'Checking In...' : 'Check In Guest'}
            </Button>
          </div>
        )}
      </Card>
    );
  };

  const renderSuccess = () => {
    if (!showSuccess || !selectedBooking) return null;

    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
          <h3 className="text-xl font-semibold text-green-900 mb-2">Check-in Successful!</h3>
          <p className="text-green-700 mb-6">
            {selectedBooking.user?.firstName} {selectedBooking.user?.lastName} has been checked in to{' '}
            {selectedBooking.site?.name}
          </p>

          {qrCode && (
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">Site Access QR Code</div>
              <div className="bg-white p-4 rounded-lg inline-block">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Guest can use this QR code for site access
              </p>
            </div>
          )}

          <Button onClick={handleReset}>Check In Another Guest</Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Guest Check-In</h1>
        <p className="text-gray-600 dark:text-gray-400">Search for and check in confirmed bookings</p>
      </div>

      {!showSuccess && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleSearch} className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Search by guest name, booking number, or site
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter search term..."
                  className="pl-10"
                />
              </div>
            </div>
          </form>

          {renderSearchResults()}
        </Card>
      )}

      {selectedBooking && !showSuccess && renderBookingDetails()}
      {showSuccess && renderSuccess()}

      {checkInMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            Failed to check in: {(checkInMutation.error as Error)?.message || 'Unknown error'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CheckInPage;
