/**
 * BookingCard Component
 * Displays a booking summary card
 */

import { Calendar, Users, DollarSign, Clock } from 'lucide-react';
import type { Booking } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface BookingCardProps {
  booking: Booking;
  onViewDetails?: (booking: Booking) => void;
  onModify?: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
  showActions?: boolean;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onViewDetails,
  onModify,
  onCancel,
  showActions = true,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CHECKED_IN':
        return 'bg-blue-100 text-blue-800';
      case 'CHECKED_OUT':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NO_SHOW':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-orange-100 text-orange-800';
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateNights = () => {
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const canModify = booking.status === 'CONFIRMED' || booking.status === 'PENDING';
  const canCancel = booking.status === 'CONFIRMED' || booking.status === 'PENDING';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Booking #{booking.bookingNumber}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {booking.site?.name || 'Site information unavailable'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
            <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
              {booking.paymentStatus}
            </Badge>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar size={18} className="text-gray-400" />
            <div>
              <div className="text-sm font-medium">Check-in</div>
              <div className="text-sm">{formatDate(booking.checkInDate)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar size={18} className="text-gray-400" />
            <div>
              <div className="text-sm font-medium">Check-out</div>
              <div className="text-sm">{formatDate(booking.checkOutDate)}</div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={16} />
            <span>{calculateNights()} nights</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={16} />
            <span>
              {booking.guests.adults + booking.guests.children} guests
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign size={16} />
            <span>${booking.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Info */}
        {booking.paymentStatus === 'PARTIAL' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Balance Due:</strong> $
              {(booking.totalAmount - booking.paidAmount).toFixed(2)}
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(booking)}
              className="flex-1"
            >
              View Details
            </Button>
            {canModify && onModify && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onModify(booking)}
                className="flex-1"
              >
                Modify
              </Button>
            )}
            {canCancel && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(booking)}
                className="flex-1 text-red-600 hover:bg-red-50"
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
