import { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Car,
  DollarSign,
  FileText,
  QrCode,
  Download,
  Edit,
  XCircle,
  Package,
  MessageSquare,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { QRCodeDialog } from './QRCodeDialog';
import { ReceiptDownloadDialog } from './ReceiptDownloadDialog';
import type { Booking } from '@/types';

interface BookingDetailViewProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onModify?: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
  onUpdate?: () => void;
  onDownloadReceipt?: (booking: Booking) => void;
  onViewQRCode?: (booking: Booking) => void;
}

export const BookingDetailView: React.FC<BookingDetailViewProps> = ({
  booking,
  isOpen,
  onClose,
  onModify,
  onCancel,
  onDownloadReceipt,
  onViewQRCode,
}) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateNights = () => {
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const canModify = booking.status === 'CONFIRMED' || booking.status === 'PENDING';
  const canCancel = booking.status === 'CONFIRMED' || booking.status === 'PENDING';
  const canViewQRCode = booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Booking #${booking.bookingNumber}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Status Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
              <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                {booking.paymentStatus}
              </Badge>
            </div>
            <div className="flex gap-2">
              {canViewQRCode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowQRCode(true);
                    onViewQRCode?.(booking);
                  }}
                >
                  <QrCode size={16} />
                  QR Code
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowReceipt(true);
                  onDownloadReceipt?.(booking);
                }}
              >
                <Download size={16} />
                Receipt
              </Button>
            </div>
          </div>

          {/* Site Information */}
          <Card>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={18} />
                Site Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Site Name</p>
                  <p className="font-medium text-gray-900">{booking.site?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Site Type</p>
                  <p className="font-medium text-gray-900">{booking.site?.type}</p>
                </div>
                {booking.site?.amenities && booking.site.amenities.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {booking.site.amenities.map((amenity, index) => (
                        <Badge key={index} className="bg-gray-100 text-gray-700">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Dates and Duration */}
          <Card>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar size={18} />
                Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Check-in</p>
                  <p className="font-medium text-gray-900">{formatDate(booking.checkInDate)}</p>
                  {booking.checkInTime && (
                    <p className="text-sm text-gray-600">{formatTime(booking.checkInTime)}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Check-out</p>
                  <p className="font-medium text-gray-900">{formatDate(booking.checkOutDate)}</p>
                  {booking.checkOutTime && (
                    <p className="text-sm text-gray-600">{formatTime(booking.checkOutTime)}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium text-gray-900">
                    {calculateNights()} {calculateNights() === 1 ? 'night' : 'nights'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Guest Information */}
          <Card>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users size={18} />
                Guests
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Adults</p>
                  <p className="font-medium text-gray-900">{booking.guests.adults}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Children</p>
                  <p className="font-medium text-gray-900">{booking.guests.children}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pets</p>
                  <p className="font-medium text-gray-900">{booking.guests.pets}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Vehicles */}
          {booking.vehicles && booking.vehicles.length > 0 && (
            <Card>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Car size={18} />
                  Vehicles
                </h3>
                <div className="space-y-3">
                  {booking.vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-gray-600">
                          {vehicle.color} {vehicle.type.toUpperCase()} • {vehicle.licensePlate} ({vehicle.state})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Equipment Rentals */}
          {booking.equipmentRentals && booking.equipmentRentals.length > 0 && (
            <Card>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package size={18} />
                  Equipment Rentals
                </h3>
                <div className="space-y-3">
                  {booking.equipmentRentals.map((rental) => (
                    <div key={rental.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{rental.equipment?.name}</p>
                        <p className="text-sm text-gray-600">
                          Quantity: {rental.quantity} • ${rental.dailyRate}/day
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">${rental.totalAmount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Payment Summary */}
          <Card>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign size={18} />
                Payment Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    ${(booking.totalAmount - booking.taxAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${booking.taxAmount.toFixed(2)}</span>
                </div>
                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${booking.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 flex justify-between">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="font-bold text-gray-900">${booking.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid Amount</span>
                  <span className="text-gray-900">${booking.paidAmount.toFixed(2)}</span>
                </div>
                {booking.paidAmount < booking.totalAmount && (
                  <div className="flex justify-between text-sm font-semibold text-orange-600">
                    <span>Balance Due</span>
                    <span>${(booking.totalAmount - booking.paidAmount).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Special Requests */}
          {booking.specialRequests && (
            <Card>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare size={18} />
                  Special Requests
                </h3>
                <p className="text-gray-700">{booking.specialRequests}</p>
              </div>
            </Card>
          )}

          {/* Notes */}
          {booking.notes && (
            <Card>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText size={18} />
                  Notes
                </h3>
                <p className="text-gray-700">{booking.notes}</p>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {canModify && onModify && (
              <Button variant="outline" onClick={() => onModify(booking)}>
                <Edit size={16} />
                Modify Booking
              </Button>
            )}
            {canCancel && onCancel && (
              <Button
                variant="outline"
                onClick={() => onCancel(booking)}
                className="text-red-600 hover:bg-red-50"
              >
                <XCircle size={16} />
                Cancel Booking
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* QR Code Dialog */}
      {showQRCode && (
        <QRCodeDialog
          booking={booking}
          isOpen={showQRCode}
          onClose={() => setShowQRCode(false)}
        />
      )}

      {/* Receipt Dialog */}
      {showReceipt && (
        <ReceiptDownloadDialog
          booking={booking}
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </>
  );
};