import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSiteById } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';
import { mockSites } from '@/services/api/mock-sites';
import { BookingForm } from '@/features/bookings/components/BookingForm';

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
      try {
        return await getSiteById(siteId);
      } catch (error) {
        console.error('Failed to fetch site:', error);
        // Fallback to mock data only in development or as last resort
        if (import.meta.env.DEV) {
          return mockSites.find((s) => s.id === siteId) || mockSites[0];
        }
        throw error;
      }
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
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Site not found
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

  return (
    <div className="max-w-7xl mx-auto py-8">
      <BookingForm
        site={site}
        initialCheckInDate={checkInDate}
        initialCheckOutDate={checkOutDate}
        initialGuests={initialGuests}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default CustomerBookingPage;

