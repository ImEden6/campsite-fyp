import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSiteById } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';

import { BookingForm } from '@/features/bookings/components/BookingForm';
import { GlassCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

const CustomerBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const siteId = searchParams.get('siteId');
  const checkInDate = searchParams.get('checkIn') || '';
  const checkOutDate = searchParams.get('checkOut') || '';
  const initialGuests = parseInt(searchParams.get('guests') || '2', 10);

  const { data: site, isLoading, error } = useQuery({
    queryKey: queryKeys.sites.detail(siteId || ''),
    queryFn: async () => {
      if (!siteId) {
        throw new Error('Site ID is required');
      }
      return await getSiteById(siteId);
    },
    enabled: !!siteId,
  });

  const handleSuccess = (bookingId: string) => {
    navigate(`/customer/bookings/${bookingId}`);
  };

  const handleCancel = () => {
    navigate('/customer/sites');
  };

  // Handle missing siteId
  if (!siteId) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Site ID is required
          </p>
          <button
            onClick={() => navigate('/customer/sites')}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Sites
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
            Failed to load site
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => navigate('/sites')}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Sites
          </button>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-nature-bg dark:bg-night-bg flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-8 text-center" intensity="light">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Site not found
          </p>
          <Button onClick={() => navigate('/sites')}>Back to Sites</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Secure Your Reservation
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Complete your booking for <span className="font-semibold text-primary-700 dark:text-primary-400">{site.name}</span>
          </p>
        </div>

        <BookingForm
          site={site}
          initialCheckInDate={checkInDate}
          initialCheckOutDate={checkOutDate}
          initialGuests={initialGuests}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default CustomerBookingPage;

