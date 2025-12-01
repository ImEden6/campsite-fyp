import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ArrowLeft, CreditCard } from 'lucide-react';
import {
  PaymentModal,
  PaymentHistory,
} from '@/features/payments';

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
        <p className="text-gray-600 mt-2">
          Manage payments for your booking
        </p>
      </div>

      <div className="space-y-6">
        {/* Payment Action Card */}
        <Card>
          <CardHeader>
            <CardTitle>Make a Payment</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Booking ID: {bookingId || 'N/A'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(mockBookingAmount / 100).toFixed(2)}
                </p>
              </div>
              <Button
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Pay Now
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Payment History */}
        {bookingId && (
          <PaymentHistory bookingId={bookingId} showRefundAction={true} />
        )}

        {/* Info Alert */}
        <Alert variant="info">
          <div>
            <p className="text-sm font-medium mb-1">Secure Payment</p>
            <p className="text-sm">
              All payments are processed securely through Stripe. We never
              store your card details on our servers.
            </p>
          </div>
        </Alert>
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
  );
};
