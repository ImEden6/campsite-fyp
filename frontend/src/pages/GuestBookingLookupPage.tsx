import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { GlassCard } from '@/components/ui/GlassCard';
import { post } from '@/services/api/client';

const GuestBookingLookupPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookingNumber, setBookingNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Verify email and get access token
      const response = await post<{ data: { token: string } }>(`/bookings/guest/${bookingNumber}/verify`, { email });
      const { token } = (response as { data: { token: string } }).data;

      // Navigate to booking detail with token
      navigate(`/booking/${bookingNumber}?token=${token}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error
        ? err.message
        : (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Booking not found. Please check your booking number and email.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <GlassCard className="p-8" intensity="strong">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-secondary-900 dark:text-primary-100 mb-2">
              Find Your Booking
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              Enter your booking reference number and email address to manage your reservation.
            </p>
          </div>

          <form onSubmit={handleLookup} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-secondary-700 dark:text-gray-300 mb-2">
                Booking Reference Number
              </label>
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors w-5 h-5" />
                <Input
                  type="text"
                  required
                  value={bookingNumber}
                  onChange={(e) => setBookingNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. BK-001"
                  className="pl-11 py-2.5 bg-white/50 dark:bg-night-surface/50 backdrop-blur-sm border-secondary-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors w-5 h-5" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-11 py-2.5 bg-white/50 dark:bg-night-surface/50 backdrop-blur-sm border-secondary-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
                <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full py-2.5 shadow-lg shadow-primary-600/20" size="lg">
              {isLoading ? (
                <span>Searching...</span>
              ) : (
                <span className="flex items-center justify-center">
                  Lookup Booking <ArrowRight className="w-4 h-4 ml-2" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-secondary-200 dark:border-gray-700/50 text-center">
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
              Don't have a booking number?
            </p>
            <Button variant="outline" onClick={() => navigate('/contact')} className="w-full">
              Contact Support
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default GuestBookingLookupPage;

