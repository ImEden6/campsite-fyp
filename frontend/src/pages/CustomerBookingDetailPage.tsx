import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Ban, FileText, MapPin } from 'lucide-react';
import { getBookingById, cancelBooking, calculateCancellationRefund, type CancellationRefund } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { BookingStatus, PaymentStatus as BookingPaymentStatus } from '@/types';
import Button from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { PaymentHistory } from '@/features/payments/components/PaymentHistory';
import { PaymentModal } from '@/features/payments/components/PaymentModal';
import { useUIStore } from '@/stores/uiStore';
import { CURRENCY_SYMBOL } from '@/utils/currency';
import { BookingDetailsCard, HelpSidebarCard } from '@/features/bookings/components';
import { getMockBookingPayments } from '@/features/payments/services/mockCurrentPayments';
import { PaymentStatus as TransactionPaymentStatus } from '@/features/payments/types/payment.types';

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
    queryFn: async () => {
      const fetchedBooking = await getBookingById(id!);
      const mockPayments = getMockBookingPayments(id!);
      const successfulMockPayments = mockPayments.filter(payment => payment.status === TransactionPaymentStatus.SUCCEEDED);

      if (successfulMockPayments.length === 0) {
        return fetchedBooking;
      }

      const mockPaidAmountMajor = successfulMockPayments.reduce((sum, payment) => sum + (payment.amount / 100), 0);
      const mergedPaidAmount = Math.min(
        Math.max(fetchedBooking.paidAmount, mockPaidAmountMajor),
        fetchedBooking.totalAmount
      );
      const isFullyPaid = mergedPaidAmount >= fetchedBooking.totalAmount;
      const preserveTerminalStatus =
        fetchedBooking.status === BookingStatus.CANCELLED ||
        fetchedBooking.status === BookingStatus.CHECKED_IN ||
        fetchedBooking.status === BookingStatus.CHECKED_OUT ||
        fetchedBooking.status === BookingStatus.NO_SHOW;
      const preserveTerminalPaymentStatus =
        fetchedBooking.paymentStatus === BookingPaymentStatus.REFUNDED ||
        fetchedBooking.paymentStatus === BookingPaymentStatus.FAILED;

      return {
        ...fetchedBooking,
        paidAmount: mergedPaidAmount,
        paymentStatus: preserveTerminalPaymentStatus
          ? fetchedBooking.paymentStatus
          : isFullyPaid
            ? BookingPaymentStatus.PAID
            : BookingPaymentStatus.PARTIAL,
        status: preserveTerminalStatus
          ? fetchedBooking.status
          : isFullyPaid
            ? BookingStatus.CONFIRMED
            : fetchedBooking.status,
      };
    },
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => cancelBooking(id!, reason),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.bookings.detail(id!), (previous: unknown) => {
        if (!previous || typeof previous !== 'object') return previous;
        return {
          ...(previous as Record<string, unknown>),
          status: BookingStatus.CANCELLED,
        };
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.myBookings() });
      setShowCancelDialog(false);
      showToast('Booking cancelled successfully', 'success');
      navigate('/customer/bookings');
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
      const shouldUseDisplayedPaidAmount =
        refund.refundAmount <= 0 &&
        booking.paidAmount > 0 &&
        refund.refundPercentage > 0;
      const normalizedRefund = shouldUseDisplayedPaidAmount
        ? {
            ...refund,
            refundAmount: Number(
              ((booking.paidAmount * refund.refundPercentage) / 100).toFixed(2)
            ),
            cancellationFee: Number(
              (
                booking.paidAmount -
                (booking.paidAmount * refund.refundPercentage) / 100
              ).toFixed(2)
            ),
            reason:
              refund.reason ||
              `Cancellation policy applies ${refund.refundPercentage}% refund based on check-in date proximity.`,
          }
        : refund;
      setRefundInfo(normalizedRefund);
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
      <div className="min-h-screen bg-nature-bg dark:bg-night-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (bookingError || !booking) {
    return (
      <div className="min-h-screen bg-nature-bg dark:bg-night-bg flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-8 text-center" intensity="light">
          <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
            {bookingError ? 'Failed to load booking' : 'Booking not found'}
          </p>
          {bookingError && (
            <p className="text-sm text-gray-600 dark:text-secondary-400 mb-4">
              {bookingError instanceof Error ? bookingError.message : 'An unexpected error occurred'}
            </p>
          )}
          <Button onClick={() => navigate('/customer/bookings')}>Back to Bookings</Button>
        </GlassCard>
      </div>
    );
  }

  const canCancel = booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED;
  const needsPayment = booking.paymentStatus === BookingPaymentStatus.PENDING || booking.paymentStatus === BookingPaymentStatus.PARTIAL;
  const nights = Math.ceil(
    (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={() => navigate('/customer/bookings')}
              className="flex items-center space-x-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to bookings</span>
            </button>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-primary-100 flex items-center gap-3">
              <span>Booking #{booking.bookingNumber}</span>
              <span className={`px-3 py-1 text-sm font-sans font-medium rounded-full ${booking.status === 'CONFIRMED'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : booking.status === 'CANCELLED'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                {booking.status}
              </span>
            </h1>
            <div className="flex items-center text-secondary-600 dark:text-secondary-400">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{booking.site?.name || 'Site information unavailable'}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {needsPayment && (
              <Button onClick={() => setShowPaymentModal(true)} className="shadow-lg shadow-primary-600/20">
                <CreditCard className="w-4 h-4 mr-2" />
                Make Payment
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={handleCheckRefund} className="bg-white/50 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors">
                <Ban className="w-4 h-4 mr-2" />
                Cancel Booking
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Booking Details */}
            <BookingDetailsCard
              checkInDate={booking.checkInDate}
              checkOutDate={booking.checkOutDate}
              guests={booking.guests}
              nights={nights}
              title="Reservation Details"
              icon={FileText}
            />

            {/* Payment History */}
            <GlassCard className="p-6 md:p-8">
              <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-primary-100 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-500" />
                Payment History
              </h2>
              <PaymentHistory bookingId={booking.id} />
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Summary */}
            <GlassCard className="p-6">
              <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-primary-100 mb-4">
                Price Breakdown
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-secondary-600 dark:text-secondary-400">
                  <span>Subtotal</span>
                  <span>{CURRENCY_SYMBOL}{(booking.totalAmount - booking.taxAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-secondary-600 dark:text-secondary-400">
                  <span>Tax</span>
                  <span>{CURRENCY_SYMBOL}{booking.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-secondary-200/50 dark:border-secondary-700">
                  <span className="font-semibold text-gray-900 dark:text-primary-100">Total</span>
                  <span className="font-bold text-xl text-primary-700 dark:text-primary-400">
                    {CURRENCY_SYMBOL}{booking.totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="pt-4 mt-2 border-t border-secondary-200/50 dark:border-secondary-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Amount Paid</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {CURRENCY_SYMBOL}{booking.paidAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {booking.paidAmount < booking.totalAmount && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl flex justify-between items-center text-red-700 dark:text-red-400">
                    <span className="font-medium">Balance Due</span>
                    <span className="font-bold">
                      {CURRENCY_SYMBOL}{(booking.totalAmount - booking.paidAmount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </GlassCard>

            <HelpSidebarCard
              title="Need Assistance?"
              description="Have questions about your upcoming stay? We're here to help."
              onButtonClick={() => navigate('/contact')}
            />
          </div>
        </div>

        {/* Cancel Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="max-w-md w-full p-6 animate-in fade-in zoom-in duration-200" intensity="strong">
              <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-primary-100 mb-4">
                Cancel Booking
              </h3>
              {refundInfo && (
                <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/30">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-secondary-300">Refund Amount:</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-primary-100">{CURRENCY_SYMBOL}{refundInfo.refundAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-secondary-300">Cancellation Fee:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-primary-100">{CURRENCY_SYMBOL}{refundInfo.cancellationFee.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <p className="text-gray-600 dark:text-secondary-300 mb-6">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="flex-1">
                  Keep Booking
                </Button>
                <Button onClick={handleCancel} className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none" disabled={cancelMutation.isPending}>
                  {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
                </Button>
              </div>
            </GlassCard>
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
    </div>
  );
};

export default CustomerBookingDetailPage;

