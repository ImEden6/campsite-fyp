import React from 'react';
import { format } from 'date-fns';
import { Booking } from '@/types';
import { STATUS_COLORS } from '../constants/booking-colors';

type CalendarItemVariant = 'month' | 'week';

interface BookingCalendarItemProps {
  booking: Booking;
  variant?: CalendarItemVariant;
  onSelect?: ((booking: Booking) => void) | undefined;
}

export const BookingCalendarItem: React.FC<BookingCalendarItemProps> = ({
  booking,
  variant = 'month',
  onSelect,
}) => {
  const isMonthView = variant === 'month';

    return (
      <div
        className={`rounded border cursor-pointer hover:opacity-80 transition-opacity ${
          STATUS_COLORS[booking.status]
        } ${isMonthView ? 'text-xs p-1' : 'p-2'}`}
        onClick={() => onSelect?.(booking)}
      >
      <div className={`font-medium ${isMonthView ? 'text-xs truncate' : 'text-sm'}`}>
        {booking.site?.name || `Site ${booking.siteId}`}
      </div>
      <div className={`opacity-75 ${isMonthView ? 'text-xs truncate' : 'text-xs'}`}>
        {booking.user?.firstName} {booking.user?.lastName}
      </div>
      {!isMonthView && (
        <div className="text-xs mt-1">
          {format(
            booking.checkInDate instanceof Date ? booking.checkInDate : new Date(booking.checkInDate),
            'h:mm a'
          )} -{' '}
          {format(
            booking.checkOutDate instanceof Date ? booking.checkOutDate : new Date(booking.checkOutDate),
            'h:mm a'
          )}
        </div>
      )}
    </div>
  );
};
