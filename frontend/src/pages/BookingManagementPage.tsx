/**
 * BookingManagementPage
 * Staff/Manager interface for managing all bookings
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Modal, Card } from '@/components/ui';
import { BookingCalendar, BookingDetailView } from '@/features/bookings/components';
import BookingSearchBar from '@/features/bookings/components/BookingSearchBar';
import ManualBookingForm from '@/features/bookings/components/ManualBookingForm';
import { getBookings, getBookingsPaginated } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import { useBookingStore } from '@/stores/bookingStore';
import { Booking, BookingStatus } from '@/types';
import type { CalendarView } from '@/features/bookings/components/BookingCalendar';

type ViewMode = 'calendar' | 'list';

const BookingManagementPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { selectedBooking, setSelectedBooking, filters, setSearchTerm: setStoreSearchTerm } = useBookingStore();

  // Fetch all bookings for calendar view (no pagination needed for calendar)
  const { data: allBookings = [], isLoading: isLoadingAll } = useQuery({
    queryKey: queryKeys.bookings.list({ ...filters, searchTerm }),
    queryFn: async () => {
      console.log('[BookingManagement] Fetching bookings with filters:', { ...filters, searchTerm });
      const result = await getBookings({ ...filters, searchTerm });
      console.log('[BookingManagement] Received bookings:', result.length, result);
      return result;
    },
    enabled: viewMode === 'calendar',
  });

  // Fetch paginated bookings for list view
  const { data: paginatedData, isLoading: isLoadingPaginated, refetch } = useQuery({
    queryKey: [...queryKeys.bookings.list({ ...filters, searchTerm }), 'paginated', currentPage],
    queryFn: async () => {
      console.log('[BookingManagement] Fetching paginated bookings with filters:', { ...filters, searchTerm, page: currentPage });
      const result = await getBookingsPaginated(currentPage, pageSize, { ...filters, searchTerm });
      console.log('[BookingManagement] Received paginated bookings:', result);
      return result;
    },
    enabled: viewMode === 'list',
  });

  const bookings = viewMode === 'calendar' ? allBookings : (paginatedData?.items || []);
  const isLoading = viewMode === 'calendar' ? isLoadingAll : isLoadingPaginated;
  const totalPages = paginatedData?.totalPages || 1;
  const totalItems = paginatedData?.total || 0;

  console.log('[BookingManagement] Current state:', {
    viewMode,
    bookingsCount: bookings.length,
    isLoading,
    filters,
    searchTerm
  });

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
    setCurrentPage(1); // Reset to first page
    refetch();
    // Optionally show the newly created booking
  };

  const handleDateSelect = (_date: Date) => {
    // Could navigate to day view or show bookings for that date
    setCalendarView('day');
  };

  const getStatusColor = (status: BookingStatus): string => {
    const colors: Record<BookingStatus, string> = {
      [BookingStatus.PENDING]: 'text-yellow-600 dark:text-yellow-400',
      [BookingStatus.CONFIRMED]: 'text-blue-600 dark:text-blue-400',
      [BookingStatus.CHECKED_IN]: 'text-green-600 dark:text-green-400',
      [BookingStatus.CHECKED_OUT]: 'text-gray-600 dark:text-gray-400',
      [BookingStatus.CANCELLED]: 'text-red-600 dark:text-red-400',
      [BookingStatus.NO_SHOW]: 'text-orange-600 dark:text-orange-400',
    };
    return colors[status] || 'text-gray-600 dark:text-gray-400';
  };

  const renderListView = () => {
    if (bookings.length === 0) {
      return (
        <Card className="p-12 text-center dark:bg-gray-800 dark:border-gray-700">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No bookings found</h3>
          <p className="text-gray-500 dark:text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search criteria' : 'Create your first booking to get started'}
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Booking
          </Button>
        </Card>
      );
    }

    return (
      <>
        <div className="space-y-3">
          {bookings.map((booking: Booking) => (
            <div
              key={booking.id}
              className="cursor-pointer"
              onClick={() => handleBookingClick(booking)}
            >
              <Card className="p-4 hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        {booking.site?.name || `Site ${booking.siteId}`}
                      </h3>
                      <span className={`text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">Guest</div>
                        <div>
                          {booking.user?.firstName} {booking.user?.lastName}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">Booking #</div>
                        <div>{booking.bookingNumber}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">Check-in</div>
                        <div>{new Date(booking.checkInDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">Check-out</div>
                        <div>{new Date(booking.checkOutDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {booking.guests.adults} adults, {booking.guests.children} children
                      {booking.guests.pets > 0 && `, ${booking.guests.pets} pets`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      ${booking.totalAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {booking.paymentStatus === 'PAID' ? 'Paid' : `$${booking.paidAmount.toFixed(2)} paid`}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4 gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} bookings
            </div>
            <div className="flex gap-2 items-center flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-500 dark:bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Booking Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage all campsite bookings and reservations</p>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 w-full md:w-auto">
          <BookingSearchBar onSearch={handleSearch} defaultValue={searchTerm} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
            <button
              className={`px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-blue-500 dark:bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </button>
            <button
              className={`px-4 py-2 text-sm flex items-center gap-2 border-l border-gray-300 dark:border-gray-600 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-500 dark:bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>
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
      ) : (
        <>
          {viewMode === 'calendar' ? (
            <BookingCalendar
              bookings={bookings}
              view={calendarView}
              onDateSelect={handleDateSelect}
              onBookingClick={handleBookingClick}
              onViewChange={setCalendarView}
              loading={isLoading}
            />
          ) : (
            renderListView()
          )}
        </>
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
  );
};

export default BookingManagementPage;