import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { CURRENCY_SYMBOL } from '@/utils/currency';
import { useConfirmPayment } from '../hooks/usePayments';

interface MockPaymentFormProps {
  amount: number;
  // bookingId is currently unused in the mock flow but kept for API parity
  bookingId: string;
  clientSecret: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

/**
 * Mock payment form for local development/testing
 * Simulates the Stripe payment flow without requiring real Stripe credentials
 */
export const MockPaymentForm = ({
  amount,
  bookingId: _bookingId,
  clientSecret,
  onSuccess,
  onCancel,
}: MockPaymentFormProps) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const confirmPayment = useConfirmPayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Extract payment intent ID from client secret
      const paymentIntentId = clientSecret.split('_secret_')[0];

      if (!paymentIntentId) throw new Error('Invalid client secret');

      // Confirm the mock payment
      await confirmPayment.mutateAsync(paymentIntentId);

      onSuccess();
    } catch {
      setError('Mock payment failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mock Payment Badge */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Mock Payment Mode - No real charges will be made
          </p>
        </div>
      </div>

      {/* Amount Display */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Amount
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {CURRENCY_SYMBOL}{(amount / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Mock Card Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Card Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="4242 4242 4242 4242"
            />
            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expiry Date
            </label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="MM/YY"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CVC
            </label>
            <input
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123"
            />
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={processing}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={processing}
          className="min-w-[120px]"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${CURRENCY_SYMBOL}${(amount / 100).toFixed(2)}`
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        This is a simulated payment for testing purposes.
      </p>
    </form>
  );
};

export default MockPaymentForm;

