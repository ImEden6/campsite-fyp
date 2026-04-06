/**
 * CheckOutPage
 * Staff interface for checking out guests with final charges
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, DollarSign, AlertCircle, ArrowLeft, Calculator, User, MapPin } from 'lucide-react';
import { Button, Input, ErrorAlert } from '@/components/ui';
import { GlassCard } from '@/components/ui/GlassCard';
import { getBookings, checkOutBooking } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { Booking, BookingStatus } from '@/types';
import { format, parseISO, differenceInDays } from 'date-fns';
import { formatCurrency } from '@/utils/currency';
import { useNavigate } from 'react-router-dom';
import { BookingSearchPanel } from '@/features/bookings/components';

const CheckOutPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [chargeDescription, setChargeDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

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

  const renderBookingDetails = () => {
    if (!selectedBooking) return null;

    const charges = calculateFinalCharges();
    const hasBalance = charges.finalTotal > 0;

    return (
      <div className="space-y-6">
        <GlassCard className="p-8" intensity="strong">
          <h3 className="font-heading text-xl font-bold mb-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-4">Booking Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
              <div className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Check-in Time</div>
              <div className="font-medium">
                {selectedBooking.checkInTime && format(parseISO(selectedBooking.checkInTime.toString()), 'MMM d, h:mm a')}
              </div>
            </div>
            <div>
              <div className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Expected Check-out</div>
              <div className="font-medium">
                {format(selectedBooking.checkOutDate instanceof Date ? selectedBooking.checkOutDate : new Date(selectedBooking.checkOutDate), 'MMM d, h:mm a')}
              </div>
            </div>
            <div>
              <div className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Guests</div>
              <div className="font-medium">
                {selectedBooking.guests.adults} adults, {selectedBooking.guests.children} children
                {selectedBooking.guests.pets > 0 && `, ${selectedBooking.guests.pets} pets`}
              </div>
            </div>
          </div>

          {selectedBooking.equipmentReservations && selectedBooking.equipmentReservations.length > 0 && (
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Equipment Rentals</div>
              <div className="space-y-2">
                {selectedBooking.equipmentReservations.map((rental, index) => (
                  <div key={index} className="text-sm bg-gray-50/50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 flex justify-between">
                    <span>
                      {rental.equipment?.name} x{rental.quantity}
                    </span>
                    <span className="font-medium">{formatCurrency(rental.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-8" intensity="medium">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="w-5 h-5 text-primary-500" />
            <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-gray-100">Additional Charges</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Charge Amount</label>
              <div className="relative group">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500" />
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
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                value={chargeDescription}
                onChange={(e) => setChargeDescription(e.target.value)}
                placeholder="Reason for additional charges (e.g., damages, late checkout, extra services)"
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-secondary-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-gray-900 dark:text-gray-100"
                rows={3}
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8" intensity="strong">
          <h3 className="font-heading text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Final Charges</h3>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-base">
              <span className="text-secondary-600 dark:text-secondary-400">Original Total</span>
              <span className="font-medium">{formatCurrency(charges.totalDue)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-secondary-600 dark:text-secondary-400">Amount Paid</span>
              <span className="font-medium text-green-600 dark:text-green-400">-{formatCurrency(charges.totalPaid)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-secondary-600 dark:text-secondary-400">Balance Due</span>
              <span className="font-medium">{formatCurrency(charges.balance)}</span>
            </div>
            {additionalCharges > 0 && (
              <div className="flex justify-between text-base">
                <span className="text-secondary-600 dark:text-secondary-400">Additional Charges</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">+{formatCurrency(charges.additionalCharges)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
              <span className="font-bold text-lg">Final Total</span>
              <span className={`font-bold text-2xl ${hasBalance ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {formatCurrency(charges.finalTotal)}
              </span>
            </div>
          </div>

          {hasBalance && (
            <div className="mb-6 p-4 bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong className="block mb-1">Payment Required</strong> Guest has an outstanding balance of {formatCurrency(charges.finalTotal)} that needs to be collected before check-out.
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700/50">
            <Button variant="ghost" onClick={handleReset}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckOut}
              disabled={checkOutMutation.isPending}
              className="shadow-lg shadow-primary-600/20"
              size="lg"
            >
              {checkOutMutation.isPending ? 'Checking Out...' : 'Complete Check-Out'}
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  };

  const renderSuccess = () => {
    if (!showSuccess || !selectedBooking) return null;

    const charges = calculateFinalCharges();

    return (
      <GlassCard className="p-8 bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-center" intensity="strong">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Check-out Successful!</h3>
        <p className="text-green-700 dark:text-green-300 mb-8 max-w-lg mx-auto">
          <span className="font-semibold">{selectedBooking.user?.firstName} {selectedBooking.user?.lastName}</span> has been successfully checked out from <span className="font-semibold">{selectedBooking.site?.name}</span>.
        </p>

        {charges.finalTotal > 0 && (
          <div className="mb-8 p-6 bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 inline-block min-w-[280px]">
            <div className="text-xs uppercase tracking-wider text-secondary-500 mb-2">Final Charges Collected</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(charges.finalTotal)}</div>
            <div className="text-sm text-secondary-500 mt-2">
              {additionalCharges > 0 && `Includes ${formatCurrency(additionalCharges)} in additional charges`}
            </div>
          </div>
        )}

        <div>
          <Button onClick={handleReset} size="lg" className="shadow-lg shadow-primary-600/20">Check Out Another Guest</Button>
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Guest Check-Out</h1>
            <p className="text-secondary-600 dark:text-secondary-400">Search for and check out guests with final charges</p>
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
            emptyMessage="No checked-in bookings found"
            badgeVariant="success"
            renderSecondaryInfo={(booking) => (
              <>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-secondary-400" />
                  {booking.site?.name || `Site ${booking.siteId}`}
                </div>
                <div className="text-xs text-secondary-500">
                  Checked in: {booking.checkInTime ? format(new Date(booking.checkInTime), 'MMM d, h:mm a') : 'N/A'}
                </div>
              </>
            )}
            renderRightPanel={(booking) => (
              <div className="text-sm font-medium text-secondary-500">
                {differenceInDays(
                  booking.checkOutDate instanceof Date ? booking.checkOutDate : new Date(booking.checkOutDate),
                  booking.checkInDate instanceof Date ? booking.checkInDate : new Date(booking.checkInDate)
                )}{' '}
                nights
              </div>
            )}
          />
        )}

        {selectedBooking && !showSuccess && renderBookingDetails()}
        {showSuccess && renderSuccess()}

        {checkOutMutation.isError && (
          <ErrorAlert message={`Failed to check out: ${(checkOutMutation.error as Error)?.message || 'Unknown error'}`} />
        )}
      </div>
    </div>
  );
};

export default CheckOutPage;
