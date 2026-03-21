import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
import {
  PaymentModal,
  PaymentHistory,
} from '@/features/payments';
import { CURRENCY_SYMBOL } from '@/utils/currency';

export const PaymentPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // In a real app, you would fetch booking details here
  const mockBookingAmount = 15000; // $150.00 in cents

  const handlePaymentSuccess = () => {
    // Handle successful payment (e.g., show success message, redirect)
    alert('Payment successful!');
  };

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100">Payment</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-2">
            Manage payments for your booking
          </p>
        </div>

        <div className="space-y-6">
          {/* Payment Action Card */}
          <GlassCard intensity="medium" className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Make a Payment</h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">
                  Booking ID: <span className="font-mono text-gray-700 dark:text-gray-300">{bookingId || 'N/A'}</span>
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium text-gray-500 transform -translate-y-1">Total Due:</span>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {CURRENCY_SYMBOL}{(mockBookingAmount / 100).toFixed(2)}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex items-center gap-2 shadow-lg shadow-primary-600/20"
                size="lg"
              >
                <CreditCard className="w-5 h-5" />
                Pay Now
              </Button>
            </div>
          </GlassCard>

          {/* Payment History */}
          {bookingId && (
            // Using a div wrapper if PaymentHistory doesn't accept className or styling props to override inner Card
            // Ideally PaymentHistory should be updated to use GlassCard internally or accept a wrapper
            // For now, let's assume it works or just leave it. If it uses Card internally, it might look slightly inconsistent but acceptable.
            // I'll check PaymentHistory later.
            <PaymentHistory bookingId={bookingId} showRefundAction={true} />
          )}

          {/* Info Alert */}
          <div className="bg-primary-50/80 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Secure Payment</p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                All payments are processed securely through Stripe. We never
                store your card details on our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {bookingId && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            bookingId={bookingId}
            amount={mockBookingAmount}
            description={`Payment for booking ${bookingId}`}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
};
