/**
 * CheckOutPage
 * Staff interface for checking out guests with final charges
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle, DollarSign, AlertCircle } from 'lucide-react';
import { Button, Input, Card, Badge } from '@/components/ui';
import { getBookings, checkOutBooking } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { Booking, BookingStatus } from '@/types';
import { format, parseISO, differenceInDays } from 'date-fns';

const CheckOutPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [chargeDescription, setChargeDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const queryClient = useQueryClient();

  // Search for checked-in bookings
  const { data: bookings = [], isLoading: searchLoading } = useQuery({
    queryKey: queryKeys.bookings.list({ 
      searchTerm,
      status: [BookingStatus.CHECKED_IN],
    }),
    queryFn: () => getBookings({ 
      searchTerm,
      status: [BookingStatus.CHECKED_IN],
    }),
    enabled: searchTerm.length >= 3,
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: (bookingId: string) => checkOutBooking(bookingId),
    onSuccess: (updatedBooking) => {
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
    setAdditionalCharges(0);
    setChargeDescription('');
    setShowSuccess(false);
  };

  const handleCheckOut = () => {
    if (selectedBooking) {
      // In a real implementation, you would send additional charges to the backend
      checkOutMutation.mutate(selectedBooking.id);
    }
  };

  const handleReset = () => {
    setSelectedBooking(null);
    setAdditionalCharges(0);
    setChargeDescription('');
    setShowSuccess(false);
    setSearchTerm('');
  };

  const calculateFinalCharges = () => {
    if (!selectedBooking) {
      return {
        totalPaid: 0,
        totalDue: 0,
        balance: 0,
        additionalCharges: 0,
        finalTotal: 0,
      };
    }
    
    const totalPaid = selectedBooking.paidAmount;
    const totalDue = selectedBooking.totalAmount;
    const balance = totalDue - totalPaid;
    const finalTotal = balance + additionalCharges;
    
    return {
      totalPaid,
      totalDue,
      balance,
      additionalCharges,
      finalTotal,
    };
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
          <p>No checked-in bookings found</p>
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
                  <Badge variant="success">{booking.bookingNumber}</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {booking.site?.name || `Site ${booking.siteId}`}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Checked in: {booking.checkInTime ? format(new Date(booking.checkInTime), 'MMM d, h:mm a') : 'N/A'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {differenceInDays(
                    booking.checkOutDate instanceof Date ? booking.checkOutDate : new Date(booking.checkOutDate),
                    booking.checkInDate instanceof Date ? booking.checkInDate : new Date(booking.checkInDate)
                  )}{' '}
                  nights
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

    const charges = calculateFinalCharges();
    const hasBalance = charges.finalTotal > 0;

    return (
      <div className="space-y-6">
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
              <div className="text-sm text-gray-500">Check-in Time</div>
              <div className="font-medium">
                {selectedBooking.checkInTime && format(parseISO(selectedBooking.checkInTime.toString()), 'MMM d, h:mm a')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Expected Check-out</div>
              <div className="font-medium">
                {format(selectedBooking.checkOutDate instanceof Date ? selectedBooking.checkOutDate : new Date(selectedBooking.checkOutDate), 'MMM d, h:mm a')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Guests</div>
              <div className="font-medium">
                {selectedBooking.guests.adults} adults, {selectedBooking.guests.children} children
                {selectedBooking.guests.pets > 0 && `, ${selectedBooking.guests.pets} pets`}
              </div>
            </div>
          </div>

          {selectedBooking.equipmentRentals && selectedBooking.equipmentRentals.length > 0 && (
            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-2">Equipment Rentals</div>
              <div className="space-y-2">
                {selectedBooking.equipmentRentals.map((rental, index) => (
                  <div key={index} className="text-sm bg-gray-50 p-2 rounded flex justify-between">
                    <span>
                      {rental.equipment?.name} x{rental.quantity}
                    </span>
                    <span className="font-medium">${rental.totalAmount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Additional Charges</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Charge Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={chargeDescription}
                onChange={(e) => setChargeDescription(e.target.value)}
                placeholder="Reason for additional charges (e.g., damages, late checkout, extra services)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Final Charges</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Original Total</span>
              <span className="font-medium">${charges.totalDue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-medium text-green-600">-${charges.totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Balance Due</span>
              <span className="font-medium">${charges.balance.toFixed(2)}</span>
            </div>
            {additionalCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Additional Charges</span>
                <span className="font-medium text-orange-600">+${charges.additionalCharges.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold">Final Total</span>
              <span className={`font-bold text-lg ${hasBalance ? 'text-red-600' : 'text-green-600'}`}>
                ${charges.finalTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {hasBalance && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>Payment Required:</strong> Guest has an outstanding balance of ${charges.finalTotal.toFixed(2)} that needs to be collected before check-out.
              </div>
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleReset}>
            Cancel
          </Button>
          <Button
            onClick={handleCheckOut}
            disabled={checkOutMutation.isPending}
          >
            {checkOutMutation.isPending ? 'Checking Out...' : 'Complete Check-Out'}
          </Button>
        </div>
      </div>
    );
  };

  const renderSuccess = () => {
    if (!showSuccess || !selectedBooking) return null;

    const charges = calculateFinalCharges();

    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
          <h3 className="text-xl font-semibold text-green-900 mb-2">Check-out Successful!</h3>
          <p className="text-green-700 mb-4">
            {selectedBooking.user?.firstName} {selectedBooking.user?.lastName} has been checked out from{' '}
            {selectedBooking.site?.name}
          </p>

          {charges.finalTotal > 0 && (
            <div className="mb-6 p-4 bg-white rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Final Charges</div>
              <div className="text-2xl font-bold text-gray-900">${charges.finalTotal.toFixed(2)}</div>
              <div className="text-sm text-gray-600 mt-1">
                {additionalCharges > 0 && `Includes $${additionalCharges.toFixed(2)} in additional charges`}
              </div>
            </div>
          )}

          <Button onClick={handleReset}>Check Out Another Guest</Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Guest Check-Out</h1>
        <p className="text-gray-600 dark:text-gray-400">Search for and check out guests with final charges</p>
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

      {checkOutMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            Failed to check out: {(checkOutMutation.error as Error)?.message || 'Unknown error'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CheckOutPage;
