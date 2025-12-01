/**
 * QRCodeDialog Component
 * Displays QR code for booking check-in
 */

import { useQuery } from '@tanstack/react-query';
import { QrCode, Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getBookingQRCode } from '@/services/api/bookings';
import { useToast } from '@/hooks/useToast';
import type { Booking } from '@/types';

interface QRCodeDialogProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeDialog: React.FC<QRCodeDialogProps> = ({
  booking,
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();

  // Fetch QR code
  const { data: qrCode, isLoading, error } = useQuery({
    queryKey: ['booking-qr', booking.id],
    queryFn: () => getBookingQRCode(booking.id),
    enabled: isOpen,
  });

  const handleDownload = () => {
    if (!qrCode) return;

    try {
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `booking-${booking.bookingNumber}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('QR code downloaded successfully', 'success');
    } catch {
      showToast('Failed to download QR code', 'error');
    }
  };

  const handlePrint = () => {
    if (!qrCode) return;

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Please allow popups to print QR code', 'warning');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Booking QR Code - ${booking.bookingNumber}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .container {
                text-align: center;
                max-width: 600px;
              }
              h1 {
                font-size: 24px;
                margin-bottom: 10px;
                color: #1f2937;
              }
              .booking-number {
                font-size: 18px;
                color: #6b7280;
                margin-bottom: 20px;
              }
              img {
                max-width: 400px;
                height: auto;
                margin: 20px 0;
              }
              .info {
                margin-top: 20px;
                padding: 15px;
                background: #f3f4f6;
                border-radius: 8px;
                text-align: left;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
                font-size: 14px;
              }
              .label {
                font-weight: 600;
                color: #4b5563;
              }
              .value {
                color: #1f2937;
              }
              .instructions {
                margin-top: 20px;
                padding: 15px;
                background: #dbeafe;
                border-radius: 8px;
                font-size: 14px;
                color: #1e40af;
              }
              @media print {
                body {
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Campsite Check-in QR Code</h1>
              <div class="booking-number">Booking #${booking.bookingNumber}</div>
              <img src="${qrCode}" alt="QR Code" />
              <div class="info">
                <div class="info-row">
                  <span class="label">Site:</span>
                  <span class="value">${booking.site?.name || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Check-in:</span>
                  <span class="value">${new Date(booking.checkInDate).toLocaleDateString()}</span>
                </div>
                <div class="info-row">
                  <span class="label">Check-out:</span>
                  <span class="value">${new Date(booking.checkOutDate).toLocaleDateString()}</span>
                </div>
                <div class="info-row">
                  <span class="label">Guests:</span>
                  <span class="value">${booking.guests.adults} adults, ${booking.guests.children} children</span>
                </div>
              </div>
              <div class="instructions">
                <strong>Instructions:</strong> Present this QR code at check-in. 
                Staff will scan it to verify your booking and complete the check-in process.
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch {
      showToast('Failed to print QR code', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Check-in QR Code"
      size="md"
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">How to use your QR code:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Save or print this QR code</li>
                <li>Present it at check-in</li>
                <li>Staff will scan it to verify your booking</li>
                <li>Complete the check-in process</li>
              </ol>
            </div>
          </div>
        </div>

        {/* QR Code Display */}
        <div className="flex flex-col items-center justify-center py-8">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={48} className="animate-spin text-gray-400" />
              <p className="text-gray-600">Generating QR code...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 text-red-600">
              <AlertCircle size={48} />
              <p>Failed to load QR code</p>
              <p className="text-sm text-gray-600">Please try again or contact support</p>
            </div>
          ) : qrCode ? (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
                <img
                  src={qrCode}
                  alt="Booking QR Code"
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  Booking #{booking.bookingNumber}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {booking.site?.name}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Booking Info */}
        {qrCode && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Check-in</p>
                <p className="font-medium text-gray-900">
                  {new Date(booking.checkInDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Check-out</p>
                <p className="font-medium text-gray-900">
                  {new Date(booking.checkOutDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Guests</p>
                <p className="font-medium text-gray-900">
                  {booking.guests.adults + booking.guests.children}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-medium text-gray-900">{booking.status}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {qrCode && (
            <>
              <Button variant="outline" onClick={handlePrint}>
                <QrCode size={16} />
                Print
              </Button>
              <Button variant="primary" onClick={handleDownload}>
                <Download size={16} />
                Download
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
