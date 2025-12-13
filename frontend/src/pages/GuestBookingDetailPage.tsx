import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Users, UserPlus } from 'lucide-react';
import { verifyGuestBookingEmail, getGuestBooking } from '@/services/api/bookings';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { format } from 'date-fns';

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
      <div className="max-w-md mx-auto py-8 px-4">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Access Your Booking
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Enter your email address to access your booking details
          </p>
          <form onSubmit={handleEmailVerification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <Button type="submit" disabled={isVerifying} className="w-full">
              {isVerifying ? 'Sending...' : 'Send Verification Email'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Booking not found
          </p>
          <Button onClick={() => navigate('/booking/lookup')}>Lookup Booking</Button>
        </div>
      </div>
    );
  }

  const nights = Math.ceil(
    (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Booking #{booking.bookingNumber}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {booking.site?.name || 'Site information unavailable'}
          </p>
        </div>
        <Button onClick={() => navigate('/register')}>
          <UserPlus className="w-4 h-4 mr-2" />
          Create Account
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Booking Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Check-in</div>
                <div className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(booking.checkInDate), 'MMM dd, yyyy')}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Check-out</div>
                <div className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(booking.checkOutDate), 'MMM dd, yyyy')}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</div>
                <div className="text-gray-900 dark:text-gray-100">{nights} nights</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Guests</div>
                <div className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                  <Users className="w-4 h-4" />
                  <span>
                    {booking.guests.adults} adult{booking.guests.adults !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
                <div className="text-gray-900 dark:text-gray-100">{booking.status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payment Status</div>
                <div className="text-gray-900 dark:text-gray-100">{booking.paymentStatus}</div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Price Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  ${booking.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Paid</span>
                <span className="text-gray-900 dark:text-gray-100">
                  ${booking.paidAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GuestBookingDetailPage;

