/**
 * BookingCalendar Component - Dark Mode Fixed
 * Displays bookings in calendar view with month/week/day views
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui';
import type { BadgeProps } from '@/components/ui';
import { Booking, BookingStatus, SiteType } from '@/types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks, isSameMonth, isToday } from 'date-fns';

export type CalendarView = 'month' | 'week' | 'day';

export interface BookingCalendarProps {
  bookings: Booking[];
  view?: CalendarView;
  onDateSelect?: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
  onViewChange?: (view: CalendarView) => void;
  selectedDate?: Date;
  loading?: boolean;
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700',
  [BookingStatus.CONFIRMED]: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700',
  [BookingStatus.CHECKED_IN]: 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700',
  [BookingStatus.CHECKED_OUT]: 'bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-700/50 dark:text-gray-200 dark:border-gray-600',
  [BookingStatus.CANCELLED]: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700',
  [BookingStatus.NO_SHOW]: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700',
};

const STATUS_BADGE_VARIANTS: Record<BookingStatus, BadgeProps['variant']> = {
  [BookingStatus.PENDING]: 'warning',
  [BookingStatus.CONFIRMED]: 'info',
  [BookingStatus.CHECKED_IN]: 'success',
  [BookingStatus.CHECKED_OUT]: 'secondary',
  [BookingStatus.CANCELLED]: 'error',
  [BookingStatus.NO_SHOW]: 'warning',
};

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  bookings,
  view = 'month',
  onDateSelect,
  onBookingClick,
  onViewChange,
  selectedDate = new Date(),
  loading = false,
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [currentView, setCurrentView] = useState<CalendarView>(view);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BookingStatus[]>([]);
  const [siteTypeFilter, setSiteTypeFilter] = useState<SiteType[]>([]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (statusFilter.length > 0 && !statusFilter.includes(booking.status)) {
        return false;
      }
      if (siteTypeFilter.length > 0 && booking.site && !siteTypeFilter.includes(booking.site.type)) {
        return false;
      }
      return true;
    });
  }, [bookings, statusFilter, siteTypeFilter]);

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date): Booking[] => {
    const result = filteredBookings.filter((booking) => {
      // checkInDate and checkOutDate are already Date objects, no need to parse
      const checkIn = booking.checkInDate instanceof Date ? booking.checkInDate : new Date(booking.checkInDate);
      const checkOut = booking.checkOutDate instanceof Date ? booking.checkOutDate : new Date(booking.checkOutDate);
      const matches = date >= checkIn && date <= checkOut;
      
      if (matches) {
        console.log('[BookingCalendar] Booking matches date:', {
          date: date.toISOString(),
          bookingNumber: booking.bookingNumber,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString()
        });
      }
      
      return matches;
    });
    
    console.log('[BookingCalendar] getBookingsForDate:', {
      date: date.toISOString(),
      totalBookings: filteredBookings.length,
      matchingBookings: result.length
    });
    
    return result;
  };

  console.log('[BookingCalendar] Render:', {
    totalBookings: bookings.length,
    filteredBookings: filteredBookings.length,
    currentView,
    currentDate: currentDate.toISOString()
  });

  // Navigation handlers
  const handlePrevious = () => {
    if (currentView === 'month') {
      setCurrentDate(addMonths(currentDate, -1));
    } else if (currentView === 'week') {
      setCurrentDate(addWeeks(currentDate, -1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (currentView === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (currentView === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleViewChange = (newView: CalendarView) => {
    setCurrentView(newView);
    onViewChange?.(newView);
  };

  const handleDateClick = (date: Date) => {
    onDateSelect?.(date);
  };

  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayBookings = getBookingsForDate(currentDay);
        const isCurrentMonth = isSameMonth(currentDay, currentDate);
        const isCurrentDay = isToday(currentDay);

        days.push(
          <div
            key={currentDay.toString()}
            className={`min-h-[100px] border border-gray-200 dark:border-gray-700 p-2 cursor-pointer transition-all duration-150 ${
              !isCurrentMonth 
                ? 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-850' 
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-gray-600'
            } ${isCurrentDay ? 'bg-blue-50 dark:bg-blue-950 border-blue-400 dark:border-blue-600 ring-1 ring-blue-400 dark:ring-blue-600' : ''}`}
            onClick={() => handleDateClick(currentDay)}
          >
            <div className={`font-semibold text-sm mb-1 transition-colors ${isCurrentDay ? 'text-blue-700 dark:text-blue-300' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
              {format(currentDay, 'd')}
            </div>
            <div className="space-y-1">
              {dayBookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 transition-opacity ${
                    STATUS_COLORS[booking.status]
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookingClick?.(booking);
                  }}
                >
                  <div className="truncate font-medium">
                    {booking.site?.name || `Site ${booking.siteId}`}
                  </div>
                  <div className="truncate text-xs opacity-75">
                    {booking.user?.firstName} {booking.user?.lastName}
                  </div>
                </div>
              ))}
              {dayBookings.length > 3 && (
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  +{dayBookings.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div>
        <div className="grid grid-cols-7 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center font-semibold text-sm text-gray-900 dark:text-gray-100">
              {day}
            </div>
          ))}
        </div>
        {rows}
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayBookings = getBookingsForDate(day);
      const isCurrentDay = isToday(day);

      days.push(
        <div key={day.toString()} className="flex-1 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
          <div
            className={`p-3 border-b border-gray-200 dark:border-gray-700 text-center cursor-pointer transition-all duration-150 ${
              isCurrentDay 
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-400 dark:border-blue-600' 
                : 'hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-gray-600'
            }`}
            onClick={() => handleDateClick(day)}
          >
            <div className="text-xs text-gray-500 dark:text-gray-400">{format(day, 'EEE')}</div>
            <div className={`text-lg font-semibold transition-colors ${isCurrentDay ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400'}`}>
              {format(day, 'd')}
            </div>
          </div>
          <div className="p-2 space-y-2 min-h-[400px] bg-white dark:bg-gray-800">
            {dayBookings.map((booking) => (
              <div
                key={booking.id}
                className={`p-2 rounded border cursor-pointer hover:opacity-80 transition-opacity ${
                  STATUS_COLORS[booking.status]
                }`}
                onClick={() => onBookingClick?.(booking)}
              >
                <div className="font-medium text-sm">
                  {booking.site?.name || `Site ${booking.siteId}`}
                </div>
                <div className="text-xs opacity-75">
                  {booking.user?.firstName} {booking.user?.lastName}
                </div>
                <div className="text-xs mt-1">
                  {format(booking.checkInDate instanceof Date ? booking.checkInDate : new Date(booking.checkInDate), 'h:mm a')} -{' '}
                  {format(booking.checkOutDate instanceof Date ? booking.checkOutDate : new Date(booking.checkOutDate), 'h:mm a')}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">{days}</div>;
  };

  // Render day view
  const renderDayView = () => {
    const dayBookings = getBookingsForDate(currentDate);

    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{dayBookings.length} bookings</p>
        </div>
        <div className="p-4 space-y-3 bg-white dark:bg-gray-900">
          {dayBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No bookings for this day</p>
            </div>
          ) : (
            dayBookings.map((booking) => (
              <Card key={booking.id} className="dark:bg-gray-800 dark:border-gray-700">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  onClick={() => onBookingClick?.(booking)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {booking.site?.name || `Site ${booking.siteId}`}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.user?.firstName} {booking.user?.lastName}
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE_VARIANTS[booking.status]}>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>
                      Check-in: {format(booking.checkInDate instanceof Date ? booking.checkInDate : new Date(booking.checkInDate), 'MMM d, h:mm a')}
                    </div>
                    <div>
                      Check-out: {format(booking.checkOutDate instanceof Date ? booking.checkOutDate : new Date(booking.checkOutDate), 'MMM d, h:mm a')}
                    </div>
                    <div>
                      Guests: {booking.guests.adults} adults, {booking.guests.children} children
                      {booking.guests.pets > 0 && `, ${booking.guests.pets} pets`}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <h2 className="text-xl font-semibold ml-4 text-gray-900 dark:text-gray-100">
            {currentView === 'month' && format(currentDate, 'MMMM yyyy')}
            {currentView === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
            {currentView === 'day' && format(currentDate, 'MMMM d, yyyy')}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </Button>
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
            <button
              className={`px-3 py-1 text-sm transition-colors ${
                currentView === 'month' 
                  ? 'bg-blue-500 dark:bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleViewChange('month')}
            >
              Month
            </button>
            <button
              className={`px-3 py-1 text-sm border-l border-gray-300 dark:border-gray-600 transition-colors ${
                currentView === 'week' 
                  ? 'bg-blue-500 dark:bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleViewChange('week')}
            >
              Week
            </button>
            <button
              className={`px-3 py-1 text-sm border-l border-gray-300 dark:border-gray-600 transition-colors ${
                currentView === 'day' 
                  ? 'bg-blue-500 dark:bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleViewChange('day')}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Status</label>
              <div className="space-y-2">
                {Object.values(BookingStatus).map((status) => (
                  <label key={status} className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 p-1 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setStatusFilter([...statusFilter, status]);
                        } else {
                          setStatusFilter(statusFilter.filter((s) => s !== status));
                        }
                      }}
                      className="mr-2 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:focus:ring-blue-600"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{status}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Site Type</label>
              <div className="space-y-2">
                {Object.values(SiteType).map((type) => (
                  <label key={type} className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 p-1 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={siteTypeFilter.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSiteTypeFilter([...siteTypeFilter, type]);
                        } else {
                          setSiteTypeFilter(siteTypeFilter.filter((t) => t !== type));
                        }
                      }}
                      className="mr-2 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:focus:ring-blue-600"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter([]);
                setSiteTypeFilter([]);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Calendar View */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      ) : (
        <>
          {currentView === 'month' && renderMonthView()}
          {currentView === 'week' && renderWeekView()}
          {currentView === 'day' && renderDayView()}
        </>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="font-medium text-gray-900 dark:text-gray-100">Status Legend:</div>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded border ${color}`}></div>
            <span className="text-gray-900 dark:text-gray-100">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export { BookingCalendar };
export default BookingCalendar;