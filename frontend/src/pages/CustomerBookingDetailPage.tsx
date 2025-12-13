import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Users, CreditCard } from 'lucide-react';
import { getBookingById, cancelBooking, calculateCancellationRefund, type CancellationRefund } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { BookingStatus, PaymentStatus } from '@/types';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PaymentHistory } from '@/features/payments/components/PaymentHistory';
import { PaymentModal } from '@/features/payments/components/PaymentModal';
import { useUIStore } from '@/stores/uiStore';
import { format } from 'date-fns';

const CustomerBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [refundInfo, setRefundInfo] = useState<CancellationRefund | null>(null);

  const { data: booking, isLoading, error: bookingError } = useQuery({
    queryKey: queryKeys.bookings.detail(id!),
    queryFn: () => getBookingById(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => cancelBooking(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.myBookings() });
      setShowCancelDialog(false);
      showToast('Booking cancelled successfully', 'success');
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : 'Failed to cancel booking',
        'error'
      );
    },
  });

  const handleCheckRefund = async () => {
    if (!booking) return;
    try {
      const refund = await calculateCancellationRefund(booking.id);
      setRefundInfo(refund);
      setShowCancelDialog(true);
    } catch (error) {
      console.error('Error calculating refund:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to calculate refund',
        'error'
      );
    }
  };

  const handleCancel = () => {
    cancelMutation.mutate(undefined);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (bookingError || !booking) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
            {bookingError ? 'Failed to load booking' : 'Booking not found'}
          </p>
          {bookingError && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {bookingError instanceof Error ? bookingError.message : 'An unexpected error occurred'}
            </p>
          )}
          <Button onClick={() => navigate('/customer/bookings')}>Back to Bookings</Button>
        </div>
      </div>
    );
  }

  const canCancel = booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED;
  const needsPayment = booking.paymentStatus === PaymentStatus.PENDING || booking.paymentStatus === PaymentStatus.PARTIAL;
  const nights = Math.ceil(
    (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/customer/bookings')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Back to bookings"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Booking #{booking.bookingNumber}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {booking.site?.name || 'Site information unavailable'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {needsPayment && (
            <Button onClick={() => setShowPaymentModal(true)}>
              <CreditCard className="w-4 h-4 mr-2" />
              Make Payment
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" onClick={handleCheckRefund}>
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Booking Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Check-in</div>
                <div className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(booking.checkInDate), 'MMM dd, yyyy')}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Check-out</div>
                <div className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(booking.checkOutDate), 'MMM dd, yyyy')}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</div>
                <div className="text-gray-900 dark:text-gray-100">{nights} nights</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Guests</div>
                <div className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                  <Users className="w-4 h-4" />
                  <span>
                    {booking.guests.adults} adult{booking.guests.adults !== 1 ? 's' : ''}
                    {booking.guests.children > 0 && `, ${booking.guests.children} child${booking.guests.children !== 1 ? 'ren' : ''}`}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
                <div className="text-gray-900 dark:text-gray-100">{booking.status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payment Status</div>
                <div className="text-gray-900 dark:text-gray-100">{booking.paymentStatus}</div>
              </div>
            </div>
          </Card>

          {/* Payment History */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Payment History
            </h2>
            <PaymentHistory bookingId={booking.id} />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Price Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-gray-100">
                  ${(booking.totalAmount - booking.taxAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span className="text-gray-900 dark:text-gray-100">
                  ${booking.taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  ${booking.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Paid</span>
                <span className="text-gray-900 dark:text-gray-100">
                  ${booking.paidAmount.toFixed(2)}
                </span>
              </div>
              {booking.paidAmount < booking.totalAmount && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>Balance Due</span>
                  <span className="font-semibold">
                    ${(booking.totalAmount - booking.paidAmount).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Cancel Booking
            </h3>
            {refundInfo && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Refund Amount:</strong> ${(refundInfo.refundAmount / 100).toFixed(2)}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Cancellation Fee:</strong> ${(refundInfo.cancellationFee / 100).toFixed(2)}
                </p>
              </div>
            )}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="flex-1">
                Keep Booking
              </Button>
              <Button onClick={handleCancel} className="flex-1" disabled={cancelMutation.isPending}>
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && booking && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingId={booking.id}
          amount={Math.round((booking.totalAmount - booking.paidAmount) * 100)}
          onSuccess={() => {
            setShowPaymentModal(false);
            queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id!) });
          }}
        />
      )}
    </div>
  );
};

export default CustomerBookingDetailPage;

