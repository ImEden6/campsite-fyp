import { useState } from 'react';
import { format } from 'date-fns';
import { Download, RefreshCw, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
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
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Loading payments...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardBody>
          <Alert variant="error">
            <p className="text-sm">
              Failed to load payment history. Please try again.
            </p>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No payments found</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment History</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <PaymentStatusBadge status={payment.status} />
                    <span className="text-sm text-gray-500">
                      {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  {payment.description && (
                    <p className="text-sm text-gray-600 mb-1">
                      {payment.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>ID: {payment.id.slice(0, 8)}...</span>
                    <span className="uppercase">{payment.method}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${(payment.amount / 100).toFixed(2)}
                    </p>
                    {payment.refundedAmount && payment.refundedAmount > 0 && (
                      <p className="text-xs text-gray-500">
                        Refunded: ${(payment.refundedAmount / 100).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {payment.receiptUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReceipt(payment.id)}
                        disabled={downloadReceipt.isPending}
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
        </CardBody>
      </Card>

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
