import { useEffect, useState, lazy, Suspense } from 'react';
import Modal from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Loader2, CreditCard } from 'lucide-react';
import { useCreatePaymentIntent } from '../hooks/usePayments';
import { PageLoader } from '@/components/ui/PageLoader';

// Lazy load heavy Stripe components
const StripeProvider = lazy(() => import('./StripeProvider').then(m => ({ default: m.StripeProvider })));
const PaymentForm = lazy(() => import('./PaymentForm').then(m => ({ default: m.PaymentForm })));

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  amount: number;
  description?: string;
  onSuccess?: () => void;
}

export const PaymentModal = ({
  isOpen,
  onClose,
  bookingId,
  amount,
  description,
  onSuccess,
}: PaymentModalProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const createPaymentIntent = useCreatePaymentIntent();

  useEffect(() => {
    if (isOpen && !clientSecret) {
      createPaymentIntent.mutate(
        {
          bookingId,
          amount,
          currency: 'usd',
          description,
        },
        {
          onSuccess: (data) => {
            setClientSecret(data.clientSecret);
          },
        }
      );
    }
  }, [isOpen, bookingId, amount, description, clientSecret, createPaymentIntent]);

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  const handleClose = () => {
    setClientSecret(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Complete Payment"
      size="lg"
    >
      <div className="space-y-4">
        {description && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Payment Details
                </p>
                <p className="text-sm text-blue-700 mt-1">{description}</p>
              </div>
            </div>
          </div>
        )}

        {createPaymentIntent.isPending && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">
              Preparing payment form...
            </span>
          </div>
        )}

        {createPaymentIntent.isError && (
          <Alert variant="error">
            <p className="text-sm">
              Failed to initialize payment. Please try again or contact support.
            </p>
          </Alert>
        )}

        {clientSecret && (
          <Suspense fallback={<div className="flex items-center justify-center py-8"><PageLoader /></div>}>
            <StripeProvider clientSecret={clientSecret}>
              <PaymentForm
                amount={amount}
                bookingId={bookingId}
                onSuccess={handleSuccess}
                onCancel={handleClose}
              />
            </StripeProvider>
          </Suspense>
        )}
      </div>
    </Modal>
  );
};
