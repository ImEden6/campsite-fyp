import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Users, UserPlus, MapPin, CheckCircle } from 'lucide-react';
import { verifyGuestBookingEmail, getGuestBooking } from '@/services/api/bookings';
import Button from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { format } from 'date-fns';
import { CURRENCY_SYMBOL } from '@/utils/currency';

const GuestBookingDetailPage: React.FC = () => {
  const { bookingNumber } = useParams<{ bookingNumber: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(!!token);
  const [accessToken, setAccessToken] = useState<string | null>(token || null);

  // Fetch guest booking by bookingNumber and token
  const { data: booking, isLoading } = useQuery({
    queryKey: ['guest-booking', bookingNumber, accessToken],
    queryFn: async () => {
      if (!bookingNumber || !accessToken) return null;
      return await getGuestBooking(bookingNumber, accessToken);
    },
    enabled: !!bookingNumber && !!accessToken,
  });

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const result = await verifyGuestBookingEmail(bookingNumber!, email);
      setAccessToken(result.token);
      setVerified(true);
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!verified && !token) {
    return (
      <div className="min-h-screen bg-nature-bg dark:bg-night-bg flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Access Your Booking
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              For security, please verify your email address to view booking details.
            </p>
          </div>

          <form onSubmit={handleEmailVerification} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-secondary-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="name@example.com"
              />
            </div>
            <Button type="submit" disabled={isVerifying} className="w-full" size="lg">
              {isVerifying ? 'Verifying...' : 'Access Booking'}
            </Button>
          </form>
        </GlassCard>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nature-bg dark:bg-night-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-nature-bg dark:bg-night-bg flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-8 text-center" intensity="light">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Booking not found or access denied.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/booking/lookup')}>Lookup Another Booking</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Return Home</Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const nights = Math.ceil(
    (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <span>Booking #{booking.bookingNumber}</span>
              <span className={`px-3 py-1 text-sm font-sans font-medium rounded-full ${booking.status === 'CONFIRMED'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                {booking.status}
              </span>
            </h1>
            <div className="flex items-center text-secondary-600 dark:text-secondary-400 mt-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{booking.site?.name || 'Site information unavailable'}</span>
            </div>
          </div>

          <GlassCard className="p-4 flex items-center gap-4" intensity="light">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-full hidden sm:block">
              <UserPlus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Create an account</p>
              <p className="text-xs text-secondary-500">Manage bookings easily</p>
            </div>
            <Button size="sm" onClick={() => navigate('/register')}>Sign Up</Button>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-6 md:p-8">
              <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Booking Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <div className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-1">Check-in</div>
                    <div className="flex items-center space-x-3 text-gray-900 dark:text-gray-100">
                      <div className="p-2 bg-primary-50 dark:bg-gray-800 rounded-lg">
                        <Calendar className="w-5 h-5 text-primary-600" />
                      </div>
                      <span className="text-lg font-medium">{format(new Date(booking.checkInDate), 'EEE, MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-1">Check-out</div>
                    <div className="flex items-center space-x-3 text-gray-900 dark:text-gray-100">
                      <div className="p-2 bg-primary-50 dark:bg-gray-800 rounded-lg">
                        <Calendar className="w-5 h-5 text-primary-600" />
                      </div>
                      <span className="text-lg font-medium">{format(new Date(booking.checkOutDate), 'EEE, MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-1">Guests</div>
                    <div className="flex items-center space-x-3 text-gray-900 dark:text-gray-100">
                      <div className="p-2 bg-primary-50 dark:bg-gray-800 rounded-lg">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <span className="text-lg font-medium">
                        {booking.guests.adults} Adults
                        {booking.guests.children > 0 && `, ${booking.guests.children} Children`}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-1">Length of Stay</div>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100 pl-2">
                      {nights} Nights
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-secondary-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-secondary-500">Payment Status</div>
                    <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                      }`}>
                      {booking.paymentStatus}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-secondary-500">Total Amount</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {CURRENCY_SYMBOL}{booking.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-1 space-y-6">
            <GlassCard className="p-6 bg-primary-600/5 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800">
              <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Need Help?
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                If you need to modify or cancel your booking, please contact support or create an account.
              </p>
              <Button variant="outline" className="w-full bg-white dark:bg-transparent" onClick={() => navigate('/contact')}>
                Contact Support
              </Button>
            </GlassCard>

            <GlassCard className="p-6 text-center" intensity="light">
              <h3 className="font-sans text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                Check-in / Check-out
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                Check-in time is 3:00 PM. <br />
                Check-out time is 11:00 AM.
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestBookingDetailPage;

