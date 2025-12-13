import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSiteById } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';
import { mockSites } from '@/services/api/mock-sites';
import { BookingForm } from '@/features/bookings/components/BookingForm';
import { useAuthStore } from '@/stores/authStore';

const CustomerBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const siteId = searchParams.get('siteId');
  const checkInDate = searchParams.get('checkIn') || '';
  const checkOutDate = searchParams.get('checkOut') || '';
  const initialGuests = parseInt(searchParams.get('guests') || '2', 10);

  const { data: site, isLoading } = useQuery({
    queryKey: queryKeys.sites.byId(siteId!),
    queryFn: async () => {
      try {
        return await getSiteById(siteId!);
      } catch {
        return mockSites.find((s) => s.id === siteId) || mockSites[0];
      }
    },
    enabled: !!siteId,
  });

  const handleSuccess = (bookingId: string) => {
    navigate(`/customer/bookings/${bookingId}`);
  };

  const handleCancel = () => {
    navigate('/sites');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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

