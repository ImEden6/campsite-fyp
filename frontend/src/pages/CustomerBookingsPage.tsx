/**
 * CustomerBookingsPage
 * List of all customer bookings with search and filters
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, Calendar, Filter } from 'lucide-react';
import { getMyBookings } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { BookingStatus, PaymentStatus, type Booking } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { GlassCard } from '@/components/ui/GlassCard';
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
      <div className="min-h-screen bg-nature-bg dark:bg-night-bg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-secondary-600 dark:text-secondary-400">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (bookingsError) {
    return (
      <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <GlassCard className="text-center py-12 px-6" intensity="medium">
            <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
              Failed to load bookings
            </p>
            <p className="text-secondary-600 dark:text-secondary-400 mb-4">
              {bookingsError instanceof Error ? bookingsError.message : 'An unexpected error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-secondary-900 dark:text-primary-100">My Bookings</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            View and manage all your bookings
          </p>
        </div>

        {/* Filters */}
        <GlassCard className="p-6" intensity="medium">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary-500" />
            <span className="font-semibold text-secondary-900 dark:text-primary-100">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
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
                className="w-full px-4 py-2.5 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white/70 dark:bg-night-surface/70 backdrop-blur-sm text-secondary-900 dark:text-primary-100 focus:ring-2 focus:ring-primary-500/50 focus:outline-none"
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
                className="w-full px-4 py-2.5 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white/70 dark:bg-night-surface/70 backdrop-blur-sm text-secondary-900 dark:text-primary-100 focus:ring-2 focus:ring-primary-500/50 focus:outline-none"
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
        </GlassCard>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <GlassCard className="text-center py-16" intensity="strong">
            <div className="w-16 h-16 bg-secondary-100 dark:bg-night-surface-alt rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-secondary-400" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-secondary-900 dark:text-primary-100 mb-2">
              No bookings found
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">
              {bookings.length === 0
                ? "You haven't made any bookings yet."
                : 'Try adjusting your filters.'}
            </p>
            {bookings.length === 0 && (
              <Button onClick={() => navigate('/customer/sites')} className="shadow-lg shadow-primary-600/20">
                Browse Sites
              </Button>
            )}
          </GlassCard>
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
    </div>
  );
};

export default CustomerBookingsPage;
