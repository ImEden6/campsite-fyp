import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { getMyBookings } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { BookingStatus, PaymentStatus, type Booking } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { BookingCard } from '@/features/bookings/components/BookingCard';

const CustomerBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | 'all'>('all');

  const { data: bookings = [], isLoading, error: bookingsError } = useQuery<Booking[]>({
    queryKey: queryKeys.bookings.myBookings(),
    queryFn: () => getMyBookings(),
  });

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesNumber = booking.bookingNumber.toLowerCase().includes(term);
        const matchesSite = booking.site?.name?.toLowerCase().includes(term) ?? false;
        if (!matchesNumber && !matchesSite) return false;
      }

      if (statusFilter !== 'all' && booking.status !== statusFilter) {
        return false;
      }

      if (paymentStatusFilter !== 'all' && booking.paymentStatus !== paymentStatusFilter) {
        return false;
      }

      return true;
    });
  }, [bookings, searchTerm, statusFilter, paymentStatusFilter]);

  const handleViewBooking = (booking: Booking) => {
    navigate(`/customer/bookings/${booking.id}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (bookingsError) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Bookings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage all your bookings
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by booking number or site name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Statuses</option>
              {Object.values(BookingStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value as PaymentStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Payment Statuses</option>
              {Object.values(PaymentStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No bookings found
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {bookings.length === 0
              ? "You haven't made any bookings yet."
              : 'Try adjusting your filters.'}
          </p>
          {bookings.length === 0 && (
            <Button onClick={() => navigate('/customer/sites')}>Browse Sites</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onViewDetails={handleViewBooking}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerBookingsPage;

