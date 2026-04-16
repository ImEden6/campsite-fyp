import { useState } from 'react';
import { format } from 'date-fns';
import { Download, RefreshCw, CreditCard } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { RefundDialog } from './RefundDialog';
import {
  usePaymentHistory,
  useBookingPayments,
  useDownloadReceipt,
} from '../hooks/usePayments';
import { Payment, PaymentStatus } from '../types/payment.types';
import { CURRENCY_SYMBOL } from '@/utils/currency';

interface PaymentHistoryProps {
  bookingId?: string;
  showRefundAction?: boolean;
}

export const PaymentHistory = ({
  bookingId,
  showRefundAction = false,
}: PaymentHistoryProps) => {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);

  const bookingPayments = useBookingPayments(bookingId || '');
  const paymentHistory = usePaymentHistory();

  const {
    data: payments,
    isLoading,
    isError,
    refetch,
  } = bookingId ? bookingPayments : paymentHistory;

  const downloadReceipt = useDownloadReceipt();

  const handleDownloadReceipt = (paymentId: string) => {
    downloadReceipt.mutate(paymentId);
  };

  const handleRefundClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsRefundDialogOpen(true);
  };

  const handleRefundSuccess = () => {
    setIsRefundDialogOpen(false);
    setSelectedPayment(null);
    refetch();
  };

  if (isLoading) {
    return (
      <GlassCard className="w-full p-8 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
        <span className="ml-3 text-secondary-600 dark:text-secondary-400">Loading payments...</span>
      </GlassCard>
    );
  }

  if (isError) {
    return (
      <GlassCard className="w-full p-6">
        <Alert variant="error">
          <p className="text-sm">
            Failed to load payment history. Please try again.
          </p>
        </Alert>
      </GlassCard>
    );
  }

  if (!payments || !Array.isArray(payments) || payments.length === 0) {
    return (
      <GlassCard className="w-full text-center py-12" intensity="medium">
        <CreditCard className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-primary-100 mb-1">No Payments Found</h3>
        <p className="text-secondary-500 dark:text-secondary-400">There are no payment records to display.</p>
      </GlassCard>
    );
  }


  return (
    <>
      <GlassCard className="w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-primary-100">Payment History</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="hover:bg-primary-50 dark:hover:bg-primary-900/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border border-secondary-200 dark:border-secondary-700/50 rounded-xl bg-white/50 dark:bg-night-surface/30 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <PaymentStatusBadge status={payment.status} />
                    <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                      {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  {payment.description && (
                    <p className="text-sm text-gray-700 dark:text-secondary-300 mb-1">
                      {payment.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-secondary-500 dark:text-secondary-400">
                    <span className="font-mono">ID: {payment.id.slice(0, 8)}...</span>
                    <span className="uppercase tracking-wider font-semibold">{payment.method}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-primary-100">
                      {CURRENCY_SYMBOL}{(payment.amount / 100).toFixed(2)}
                    </p>
                    {payment.refundedAmount && payment.refundedAmount > 0 && (
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">
                        Refunded: {CURRENCY_SYMBOL}{(payment.refundedAmount / 100).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {payment.receiptUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadReceipt(payment.id)}
                        disabled={downloadReceipt.isPending}
                        className="text-secondary-600 hover:text-primary-600"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}

                    {showRefundAction &&
                      payment.status === PaymentStatus.SUCCEEDED &&
                      (!payment.refundedAmount ||
                        payment.refundedAmount < payment.amount) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefundClick(payment)}
                        >
                          Refund
                        </Button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {selectedPayment && (
        <RefundDialog
          isOpen={isRefundDialogOpen}
          onClose={() => setIsRefundDialogOpen(false)}
          payment={selectedPayment}
          onSuccess={handleRefundSuccess}
        />
      )}
    </>
  );
};
