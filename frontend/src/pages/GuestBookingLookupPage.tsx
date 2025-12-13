import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
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
      const response = await post(`/bookings/guest/${bookingNumber}/verify`, { email });
      const { token } = response.data;
      
      // Navigate to booking detail with token
      navigate(`/booking/${bookingNumber}?token=${token}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking not found. Please check your booking number and email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Lookup Your Booking
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Enter your booking reference number and email address to access your booking details
        </p>

        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Booking Reference Number
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                required
                value={bookingNumber}
                onChange={(e) => setBookingNumber(e.target.value.toUpperCase())}
                placeholder="BK-001"
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Looking up...' : 'Lookup Booking'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default GuestBookingLookupPage;

