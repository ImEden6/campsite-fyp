/**
 * CancellationDialog Component
 * Handles booking cancellation with refund calculation
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, DollarSign, Info, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cancelBooking, calculateCancellationRefund } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { useToast } from '@/hooks/useToast';
import type { Booking } from '@/types';

interface CancellationDialogProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancellationDialog: React.FC<CancellationDialogProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
    return 'An unexpected error occurred';
  };

  // Fetch refund calculation
  const { data: refundInfo, isLoading: loadingRefund } = useQuery({
    queryKey: ['booking-refund', booking.id],
    queryFn: () => calculateCancellationRefund(booking.id),
    enabled: isOpen,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(booking.id, reason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      showToast('Booking cancelled successfully', 'success');
      onSuccess();
    },
    onError: (error: unknown) => {
      showToast(getErrorMessage(error) || 'Failed to cancel booking', 'error');
    },
  });

  const handleCancel = () => {
    if (!confirmed) {
      showToast('Please confirm that you want to cancel this booking', 'warning');
      return;
    }
    cancelMutation.mutate();
  };

  const daysUntilCheckIn = Math.ceil(
    (new Date(booking.checkInDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Booking"
      size="md"
    >
      <div className="space-y-6">
        {/* Warning Banner */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">
                Are you sure you want to cancel this booking?
              </h4>
              <p className="text-sm text-red-700">
                This action cannot be undone. Please review the refund details below.
              </p>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Booking Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking Number:</span>
              <span className="font-medium text-gray-900">{booking.bookingNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Site:</span>
              <span className="font-medium text-gray-900">{booking.site?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-medium text-gray-900">
                {new Date(booking.checkInDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-out:</span>
              <span className="font-medium text-gray-900">
                {new Date(booking.checkOutDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Days until check-in:</span>
              <span className="font-medium text-gray-900">{daysUntilCheckIn} days</span>
            </div>
          </div>
        </div>

        {/* Refund Information */}
        {loadingRefund ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : refundInfo ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <DollarSign size={18} />
              Refund Calculation
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-800">Original Amount:</span>
                <span className="font-medium text-blue-900">
                  ${booking.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">Paid Amount:</span>
                <span className="font-medium text-blue-900">
                  ${booking.paidAmount.toFixed(2)}
                </span>
              </div>
              {refundInfo.cancellationFee > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Cancellation Fee:</span>
                  <span className="font-medium">-${refundInfo.cancellationFee.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-blue-300 flex justify-between">
                <span className="font-semibold text-blue-900">Refund Amount:</span>
                <span className="font-bold text-blue-900 text-lg">
                  ${refundInfo.refundAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-700">Refund Percentage:</span>
                <span className="text-blue-700">{refundInfo.refundPercentage}%</span>
              </div>
            </div>

            {refundInfo.reason && (
              <div className="mt-3 pt-3 border-t border-blue-300">
                <div className="flex items-start gap-2 text-xs text-blue-800">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <p>{refundInfo.reason}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Unable to calculate refund. Please contact support for assistance.
            </p>
          </div>
        )}

        {/* Cancellation Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Cancellation (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Please let us know why you're cancelling..."
          />
        </div>

        {/* Confirmation Checkbox */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="confirm-cancel"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="confirm-cancel" className="text-sm text-gray-700">
            I understand that this booking will be cancelled and{' '}
            {refundInfo && refundInfo.refundAmount > 0 ? (
              <span className="font-semibold">
                a refund of ${refundInfo.refundAmount.toFixed(2)} will be processed
              </span>
            ) : (
              <span className="font-semibold">no refund will be issued</span>
            )}
            .
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={cancelMutation.isPending}
          >
            Keep Booking
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleCancel}
            disabled={!confirmed || cancelMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Booking'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
