import { useState, FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useProcessRefund } from '../hooks/usePayments';
import { Payment } from '../types/payment.types';

interface RefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  onSuccess?: () => void;
}

export const RefundDialog = ({
  isOpen,
  onClose,
  payment,
  onSuccess,
}: RefundDialogProps) => {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const processRefund = useProcessRefund();

  const maxRefundAmount =
    payment.amount - (payment.refundedAmount || 0);
  const maxRefundDollars = maxRefundAmount / 100;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    let refundAmount: number | undefined;

    if (refundType === 'partial') {
      const amount = parseFloat(partialAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      if (amount > maxRefundDollars) {
        setError(`Amount cannot exceed $${maxRefundDollars.toFixed(2)}`);
        return;
      }
      refundAmount = Math.round(amount * 100);
    }

    processRefund.mutate(
      {
        paymentId: payment.id,
        amount: refundAmount,
        reason: reason || undefined,
      },
      {
        onSuccess: () => {
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        },
        onError: (err: unknown) => {
          const error = err as { response?: { data?: { message?: string } } };
          setError(
            error.response?.data?.message ||
              'Failed to process refund. Please try again.'
          );
        },
      }
    );
  };

  const handleClose = () => {
    if (!processRefund.isPending) {
      setRefundType('full');
      setPartialAmount('');
      setReason('');
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Process Refund"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Alert variant="warning">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Refund Confirmation</p>
              <p className="text-sm mt-1">
                This action cannot be undone. The refund will be processed
                immediately.
              </p>
            </div>
          </div>
        </Alert>

        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Original Amount:</span>
            <span className="font-medium">
              ${(payment.amount / 100).toFixed(2)}
            </span>
          </div>
          {payment.refundedAmount && payment.refundedAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Already Refunded:</span>
              <span className="font-medium text-red-600">
                -${(payment.refundedAmount / 100).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
            <span className="text-gray-600">Available to Refund:</span>
            <span className="font-semibold">
              ${maxRefundDollars.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="refundType"
                  value="full"
                  checked={refundType === 'full'}
                  onChange={(e) => setRefundType(e.target.value as 'full')}
                  className="mr-2"
                />
                <span className="text-sm">
                  Full Refund (${maxRefundDollars.toFixed(2)})
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="refundType"
                  value="partial"
                  checked={refundType === 'partial'}
                  onChange={(e) => setRefundType(e.target.value as 'partial')}
                  className="mr-2"
                />
                <span className="text-sm">Partial Refund</span>
              </label>
            </div>
          </div>

          {refundType === 'partial' && (
            <div>
              <label
                htmlFor="partialAmount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Refund Amount
              </label>
              <Input
                id="partialAmount"
                type="number"
                step="0.01"
                min="0.01"
                max={maxRefundDollars}
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          )}

          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Reason (Optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter reason for refund..."
            />
          </div>
        </div>

        {error && (
          <Alert variant="error">
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={processRefund.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={processRefund.isPending}
            className="min-w-[120px]"
          >
            {processRefund.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Process Refund'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
