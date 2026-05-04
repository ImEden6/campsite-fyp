import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { BookingCalendar, BookingDetailView } from '@/features/bookings/components';
import BookingSearchBar from '@/features/bookings/components/BookingSearchBar';
import ManualBookingForm from '@/features/bookings/components/ManualBookingForm';
import { getBookings } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { useBookingStore } from '@/stores/bookingStore';
import { Booking } from '@/types';
import type { CalendarView } from '@/features/bookings/components/BookingCalendar';
import { ApiException } from '@/services/api/errors';

const BookingManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { selectedBooking, setSelectedBooking, filters, setSearchTerm: setStoreSearchTerm } = useBookingStore();

  // Fetch all bookings for calendar view (booking WebSocket invalidation lives in AppLayout)
  const { data: allBookings = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.bookings.list({ ...filters, searchTerm }),
    queryFn: async () => {
      const result = await getBookings({ ...filters, searchTerm });
      return result;
    },
  });

  const loadErrorMessage =
    isError && error instanceof ApiException && error.statusCode === 401
      ? 'You are signed out or your session expired (for example after clearing site data). Sign in again — your bookings are still on the server.'
      : isError && error instanceof Error
        ? error.message
        : isError
          ? 'Could not load bookings.'
          : null;

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setStoreSearchTerm(term);
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleCreateSuccess = (_bookingId: string) => {
    setShowCreateModal(false);
    refetch();
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCalendarView('day');
  };

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-primary-100">Booking Management</h1>
            <p className="text-secondary-600 dark:text-secondary-400">Manage all campsite bookings and reservations</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <BookingSearchBar onSearch={handleSearch} defaultValue={searchTerm} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
          </div>
        ) : isError && loadErrorMessage ? (
          <div
            className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6 flex flex-col sm:flex-row gap-4 items-start"
            role="alert"
          >
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-gray-900 dark:text-primary-100 font-medium">Bookings could not be loaded</p>
              <p className="text-secondary-700 dark:text-secondary-300 text-sm">{loadErrorMessage}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" type="button" onClick={() => void refetch()}>
                  Try again
                </Button>
                <Button type="button" onClick={() => navigate('/admin/login')}>
                  Staff login
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <BookingCalendar
            bookings={allBookings}
            view={calendarView}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onBookingClick={handleBookingClick}
            onViewChange={setCalendarView}
            loading={isLoading}
          />
        )}

        {/* Create Booking Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Manual Booking"
          size="xl"
        >
          <ManualBookingForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>

        {/* Booking Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedBooking(null);
          }}
          title="Booking Details"
          size="xl"
        >
          {selectedBooking && (
            <BookingDetailView
              booking={selectedBooking}
              isOpen={showDetailModal}
              onUpdate={() => {
                refetch();
                setShowDetailModal(false);
              }}
              onClose={() => {
                setShowDetailModal(false);
                setSelectedBooking(null);
              }}
            />
          )}
        </Modal>
      </div>
    </div>
  );
};

export default BookingManagementPage;