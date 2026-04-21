/**
 * CustomerDashboardPage
 * Dashboard for customers to view their bookings overview
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CreditCard, MapPin, Plus, ArrowRight, Tent, RefreshCw, Sparkles, Map } from 'lucide-react';
import { getMyBookings, getUpcomingBookings } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { BookingStatus, PaymentStatus, type Booking } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { BookingCard } from '@/features/bookings/components/BookingCard';

const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  // Fetch customer bookings - only when auth has hydrated
  const {
    data: allBookings = [],
    isLoading: isLoadingBookings,
    error: bookingsError,
    refetch: refetchBookings,
  } = useQuery<Booking[]>({
    queryKey: queryKeys.bookings.myBookings(),
    queryFn: () => getMyBookings(),
    enabled: hasHydrated,
  });

  const {
    data: upcomingBookings = [],
    error: upcomingError,
    refetch: refetchUpcomingBookings,
  } = useQuery<Booking[]>({
    queryKey: queryKeys.bookings.upcoming(),
    queryFn: () => getUpcomingBookings(),
    enabled: hasHydrated,
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

  // Wait for auth to hydrate before showing content
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-nature-bg dark:bg-night-bg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-secondary-600 dark:text-secondary-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoadingBookings) {
    return (
      <div className="min-h-screen bg-nature-bg dark:bg-night-bg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-secondary-600 dark:text-secondary-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if ((bookingsError || upcomingError) && allBookings.length === 0 && upcomingBookings.length === 0) {
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
            <Button
              onClick={() => {
                void refetchBookings();
                void refetchUpcomingBookings();
              }}
            >
              Retry
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-600 dark:bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-secondary-900 dark:text-primary-100">Dashboard</h1>
              <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                Welcome back! Here's an overview of your bookings.
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/customer/sites')} className="shadow-lg shadow-primary-600/20">
            <Plus className="w-4 h-4 mr-2" />
            Book a Site
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-6" intensity="medium">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Bookings</p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-primary-100 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-6" intensity="medium">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Upcoming</p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-primary-100 mt-1">{stats.upcoming}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-6" intensity="medium">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Confirmed</p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-primary-100 mt-1">{stats.confirmed}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-6" intensity="medium">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Needs Payment</p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-primary-100 mt-1">{stats.needsPayment}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Upcoming Bookings */}
        {upcoming.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-semibold text-secondary-900 dark:text-primary-100">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-semibold text-secondary-900 dark:text-primary-100">
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
          <GlassCard className="text-center py-16" intensity="strong">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Tent className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="font-heading text-xl font-semibold text-secondary-900 dark:text-primary-100 mb-2">
              No bookings yet
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mb-8 max-w-md mx-auto">
              Start exploring our campsites and book your first stay!
            </p>
            <Button onClick={() => navigate('/customer/sites')} size="lg" className="shadow-lg shadow-primary-600/20">
              Browse Sites
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
