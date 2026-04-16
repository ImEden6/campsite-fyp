import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Mail, ArrowRight, Home, LayoutDashboard } from 'lucide-react';
import Button from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import confetti from 'canvas-confetti';

const GuestBookingConfirmPage: React.FC = () => {
  const { bookingNumber } = useParams<{ bookingNumber: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Fire confetti on load
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#16a34a', '#86efac', '#15803d'] // Nature greens
    });
  }, []);

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <GlassCard className="p-8 text-center" intensity="strong">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white dark:ring-night-surface">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="font-heading text-4xl font-bold text-secondary-900 dark:text-primary-100 mb-3">
              Booking Confirmed!
            </h1>
            <p className="text-lg text-secondary-600 dark:text-secondary-400">
              Your booking <span className="font-semibold text-secondary-900 dark:text-secondary-200">#{bookingNumber}</span> has been successfully placed.
            </p>
          </div>

          <div className="bg-primary-50/80 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 rounded-xl p-5 mb-8 text-left">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg shrink-0">
                <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-secondary-900 dark:text-primary-100 mb-1">
                  Confirmation Email Sent
                </p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 leading-relaxed">
                  We've sent a confirmation email with your booking details, access link, and check-in instructions to your inbox.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => navigate(`/booking/${bookingNumber}`)}
              className="w-full flex items-center justify-center py-6 text-lg shadow-lg shadow-primary-600/20"
              size="lg"
            >
              View Booking Details
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/register')}
                className="w-full justify-center"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Create Account
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/sites')}
                className="w-full justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Browse More Sites
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default GuestBookingConfirmPage;

