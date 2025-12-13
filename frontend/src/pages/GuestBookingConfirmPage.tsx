import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Mail, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const GuestBookingConfirmPage: React.FC = () => {
  const { bookingNumber } = useParams<{ bookingNumber: string }>();
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your booking #{bookingNumber} has been confirmed
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Confirmation email sent
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                We've sent a confirmation email with your booking details and access link.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => navigate(`/booking/${bookingNumber}`)}
            className="w-full"
          >
            View Booking Details
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/register')}
            className="w-full"
          >
            Create Account to Manage Bookings
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/sites')}
            className="w-full"
          >
            Browse More Sites
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default GuestBookingConfirmPage;

