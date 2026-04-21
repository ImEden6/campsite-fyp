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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { QRCodeDialog } from './QRCodeDialog';
import { ReceiptDownloadDialog } from './ReceiptDownloadDialog';
import type { Booking } from '@/types';
import { formatCurrency } from '@/utils/currency';

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
  const [showGuestDetails, setShowGuestDetails] = useState(false);

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

  const sectionCardClass =
    'border-white/25 dark:border-white/12 bg-white/85 dark:bg-night-surface/70 backdrop-blur-sm';

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
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/12">
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
                  className="dark:bg-night-surface-alt/50 dark:border-white/12 dark:text-secondary-100 dark:hover:bg-night-surface-alt/75"
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
                className="dark:bg-night-surface-alt/50 dark:border-white/12 dark:text-secondary-100 dark:hover:bg-night-surface-alt/75"
              >
                <Download size={16} />
                Receipt
              </Button>
            </div>

          </div>

          {/* Site Information */}
          <Card glass className={sectionCardClass}>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-primary-100 mb-3 flex items-center gap-2">
                <MapPin size={18} />
                Site Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-secondary-300">Site Name</p>
                  <p className="font-medium text-gray-900 dark:text-primary-100">{booking.site?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-secondary-300">Site Type</p>
                  <p className="font-medium text-gray-900 dark:text-primary-100">{booking.site?.type}</p>
                </div>
                {booking.site?.amenities && booking.site.amenities.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 dark:text-secondary-300 mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {booking.site.amenities.map((amenity, index) => (
                        <Badge key={index} className="bg-gray-100 text-gray-700 dark:bg-night-surface-alt/65 dark:text-secondary-100 dark:border dark:border-white/10">
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
          <Card glass className={sectionCardClass}>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-primary-100 mb-3 flex items-center gap-2">
                <Calendar size={18} />
                Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-secondary-300">Check-in</p>
                  <p className="font-medium text-gray-900 dark:text-primary-100">{formatDate(booking.checkInDate)}</p>
                  {booking.checkInTime && (
                    <p className="text-sm text-gray-600 dark:text-secondary-300">{formatTime(booking.checkInTime)}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-secondary-300">Check-out</p>
                  <p className="font-medium text-gray-900 dark:text-primary-100">{formatDate(booking.checkOutDate)}</p>
                  {booking.checkOutTime && (
                    <p className="text-sm text-gray-600 dark:text-secondary-300">{formatTime(booking.checkOutTime)}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-secondary-300">Duration</p>
                  <p className="font-medium text-gray-900 dark:text-primary-100">
                    {calculateNights()} {calculateNights() === 1 ? 'night' : 'nights'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Guest Information */}
          <Card glass className={sectionCardClass}>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-primary-100 mb-3 flex items-center gap-2">
                <Users size={18} />
                Guests
              </h3>
              <div 
                className="grid grid-cols-3 gap-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-secondary-800 transition-colors p-2 rounded-lg -m-2"
                onClick={() => setShowGuestDetails(!showGuestDetails)}
                title="Click to view/hide guest details"
              >
                <div>
                  <p className="text-sm text-gray-600 dark:text-secondary-400">Adults</p>
                  <p className="font-medium text-gray-900 dark:text-primary-100">{booking.guests.adults}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-secondary-400">Children</p>
                  <p className="font-medium text-gray-900 dark:text-primary-100">{booking.guests.children}</p>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-secondary-400">Pets</p>
                    <p className="font-medium text-gray-900 dark:text-primary-100">{booking.guests.pets}</p>
                  </div>
                  <div className="text-secondary-400">
                    {showGuestDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>

              {showGuestDetails && booking.guestDetails && booking.guestDetails.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/12">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-primary-100 mb-3">Guest List</h4>
                  <div className="space-y-3">
                    {booking.guestDetails.map((guest, index) => (
                      <div key={guest.id || index} className="flex justify-between items-start bg-gray-50 dark:bg-night-surface-alt/55 p-3 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-primary-100">
                            {guest.firstName} {guest.lastName}
                          </p>
                          <div className="text-sm text-gray-500 dark:text-secondary-300 space-y-0.5">
                            <p>
                              {guest.type}
                              {guest.isPrimary && (
                                <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-secondary-500/25 dark:text-secondary-100 dark:border dark:border-secondary-400/40 text-xs">Primary</Badge>
                              )}
                            </p>
                            {guest.email && <p>{guest.email}</p>}
                            {guest.phone && <p>{guest.phone}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Vehicles */}
          {booking.vehicles && booking.vehicles.length > 0 && (
            <Card glass className={sectionCardClass}>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-primary-100 mb-3 flex items-center gap-2">
                  <Car size={18} />
                  Vehicles
                </h3>
                <div className="space-y-3">
                  {booking.vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-night-surface-alt/55 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-primary-100">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-secondary-300">
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
          {booking.equipmentReservations && booking.equipmentReservations.length > 0 && (
            <Card glass className={sectionCardClass}>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-primary-100 mb-3 flex items-center gap-2">
                  <Package size={18} />
                  Equipment Rentals
                </h3>
                <div className="space-y-3">
                  {booking.equipmentReservations.map((rental) => (
                    <div key={rental.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-night-surface-alt/55 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-primary-100">{rental.equipment?.name}</p>
                        <p className="text-sm text-gray-600 dark:text-secondary-300">
                          Quantity: {rental.quantity} • {formatCurrency(rental.dailyRate || 0)}/day
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-primary-100">{formatCurrency(rental.totalAmount || 0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Payment Summary */}
          <Card glass className={sectionCardClass}>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-primary-100 mb-3 flex items-center gap-2">
                <DollarSign size={18} />
                Payment Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-secondary-300">Subtotal</span>
                  <span className="text-gray-900 dark:text-primary-100">
                    {formatCurrency((booking.totalAmount || 0) - (booking.taxAmount || 0))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-secondary-300">Tax</span>
                  <span className="text-gray-900 dark:text-primary-100">{formatCurrency(booking.taxAmount || 0)}</span>
                </div>
                {(booking.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(booking.discountAmount || 0)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 dark:border-white/12 flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-primary-100">Total Amount</span>
                  <span className="font-bold text-gray-900 dark:text-primary-100">{formatCurrency(booking.totalAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-secondary-300">Paid Amount</span>
                  <span className="text-gray-900 dark:text-primary-100">{formatCurrency(booking.paidAmount || 0)}</span>
                </div>
                {(booking.paidAmount || 0) < (booking.totalAmount || 0) && (
                  <div className="flex justify-between text-sm font-semibold text-orange-600">
                    <span>Balance Due</span>
                    <span>{formatCurrency((booking.totalAmount || 0) - (booking.paidAmount || 0))}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Special Requests */}
          {booking.specialRequests && (
            <Card glass className={sectionCardClass}>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-primary-100 mb-3 flex items-center gap-2">
                  <MessageSquare size={18} />
                  Special Requests
                </h3>
                <p className="text-gray-700 dark:text-secondary-200">{booking.specialRequests}</p>
              </div>
            </Card>
          )}

          {/* Notes */}
          {booking.notes && (
            <Card glass className={sectionCardClass}>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-primary-100 mb-3 flex items-center gap-2">
                  <FileText size={18} />
                  Notes
                </h3>
                <p className="text-gray-700 dark:text-secondary-200">{booking.notes}</p>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/12">
            <Button variant="outline" onClick={onClose} className="dark:bg-night-surface-alt/50 dark:border-white/12 dark:text-secondary-100 dark:hover:bg-night-surface-alt/75">
              Close
            </Button>
            {canModify && onModify && (
              <Button variant="outline" onClick={() => onModify(booking)} className="dark:bg-night-surface-alt/50 dark:border-white/12 dark:text-secondary-100 dark:hover:bg-night-surface-alt/75">
                <Edit size={16} />
                Modify Booking
              </Button>
            )}
            {canCancel && onCancel && (
              <Button
                variant="outline"
                onClick={() => onCancel(booking)}
                className="text-red-600 hover:bg-red-50 dark:text-red-300 dark:border-red-400/30 dark:bg-red-500/10 dark:hover:bg-red-500/20"
              >
                <XCircle size={16} />
                Cancel Booking
              </Button>
            )}
          </div>
        </div >
      </Modal >

      {/* QR Code Dialog */}
      {
        showQRCode && (
          <QRCodeDialog
            booking={booking}
            isOpen={showQRCode}
            onClose={() => setShowQRCode(false)}
          />
        )
      }

      {/* Receipt Dialog */}
      {
        showReceipt && (
          <ReceiptDownloadDialog
            booking={booking}
            isOpen={showReceipt}
            onClose={() => setShowReceipt(false)}
          />
        )
      }
    </>
  );
};