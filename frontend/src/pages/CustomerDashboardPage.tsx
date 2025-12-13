import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CreditCard, MapPin, Plus, ArrowRight } from 'lucide-react';
import { getMyBookings, getUpcomingBookings } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { BookingStatus, PaymentStatus, type Booking } from '@/types';
import Button from '@/components/ui/Button';
import { BookingCard } from '@/features/bookings/components/BookingCard';

const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Fetch customer bookings
  const { data: allBookings = [], isLoading: isLoadingBookings, error: bookingsError } = useQuery<Booking[]>({
    queryKey: queryKeys.bookings.myBookings(),
    queryFn: () => getMyBookings(),
  });

  const { data: upcomingBookings = [], error: upcomingError } = useQuery<Booking[]>({
    queryKey: queryKeys.bookings.upcoming(),
    queryFn: () => getUpcomingBookings(),
  });

  const upcoming = upcomingBookings.slice(0, 3);
  const recent = allBookings.slice(0, 3);

  const stats = {
    total: allBookings.length,
    upcoming: upcomingBookings.length,
    pending: allBookings.filter((b: Booking) => b.status === BookingStatus.PENDING).length,
    confirmed: allBookings.filter((b: Booking) => b.status === BookingStatus.CONFIRMED).length,
    needsPayment: allBookings.filter(
      (b: Booking) => b.paymentStatus === PaymentStatus.PENDING || b.paymentStatus === PaymentStatus.PARTIAL
    ).length,
  };

  const handleViewBooking = (booking: Booking) => {
    navigate(`/customer/bookings/${booking.id}`);
  };

  if (isLoadingBookings) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (bookingsError || upcomingError) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
            Failed to load bookings
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {bookingsError instanceof Error ? bookingsError.message : 'An unexpected error occurred'}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's an overview of your bookings.
          </p>
        </div>
        <Button onClick={() => navigate('/customer/sites')}>
          <Plus className="w-4 h-4 mr-2" />
          Book a Site
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.upcoming}
              </p>
            </div>
            <MapPin className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.confirmed}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Needs Payment</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.needsPayment}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Upcoming Bookings
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/customer/bookings')}
            >
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetails={handleViewBooking}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Recent Bookings
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/customer/bookings')}
            >
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recent.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetails={handleViewBooking}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {allBookings.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No bookings yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start exploring our campsites and book your first stay!
          </p>
          <Button onClick={() => navigate('/customer/sites')}>
            Browse Sites
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboardPage;

