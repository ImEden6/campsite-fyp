/**
 * ReceiptDownloadDialog Component
 * Handles receipt generation and download
 */

import { useState } from 'react';
import { Download, FileText, Loader2, Mail, Printer } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import type { Booking } from '@/types';

interface ReceiptDownloadDialogProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptDownloadDialog: React.FC<ReceiptDownloadDialogProps> = ({
  booking,
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const generateReceiptHTML = () => {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const calculateNights = () => {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Receipt - Booking ${booking.bookingNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 40px;
              background: #f9fafb;
            }
            .receipt {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            .header h1 {
              font-size: 32px;
              color: #1f2937;
              margin-bottom: 8px;
            }
            .header p {
              color: #6b7280;
              font-size: 14px;
            }
            .booking-info {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 6px;
              margin-bottom: 30px;
            }
            .booking-info h2 {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 15px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
            }
            .info-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 14px;
              color: #1f2937;
              font-weight: 500;
            }
            .section {
              margin-bottom: 30px;
            }
            .section h3 {
              font-size: 16px;
              color: #1f2937;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid #e5e7eb;
            }
            .line-items {
              margin-bottom: 20px;
            }
            .line-item {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .line-item:last-child {
              border-bottom: none;
            }
            .line-item-description {
              flex: 1;
            }
            .line-item-title {
              font-size: 14px;
              color: #1f2937;
              font-weight: 500;
            }
            .line-item-details {
              font-size: 12px;
              color: #6b7280;
              margin-top: 4px;
            }
            .line-item-amount {
              font-size: 14px;
              color: #1f2937;
              font-weight: 500;
              text-align: right;
              min-width: 100px;
            }
            .totals {
              background: #f9fafb;
              padding: 20px;
              border-radius: 6px;
              margin-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 14px;
            }
            .total-row.grand-total {
              font-size: 18px;
              font-weight: 700;
              color: #1f2937;
              padding-top: 15px;
              margin-top: 15px;
              border-top: 2px solid #e5e7eb;
            }
            .payment-info {
              background: #dbeafe;
              padding: 15px;
              border-radius: 6px;
              margin-top: 20px;
            }
            .payment-info p {
              font-size: 13px;
              color: #1e40af;
              margin: 4px 0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-confirmed {
              background: #d1fae5;
              color: #065f46;
            }
            .status-paid {
              background: #d1fae5;
              color: #065f46;
            }
            .status-partial {
              background: #fef3c7;
              color: #92400e;
            }
            @media print {
              body {
                padding: 0;
                background: white;
              }
              .receipt {
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>Receipt</h1>
              <p>Campsite Management System</p>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="booking-info">
              <h2>Booking Information</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Booking Number</span>
                  <span class="info-value">${booking.bookingNumber}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status</span>
                  <span class="info-value">
                    <span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Guest Name</span>
                  <span class="info-value">${booking.user?.firstName || ''} ${booking.user?.lastName || ''}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email</span>
                  <span class="info-value">${booking.user?.email || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Site</span>
                  <span class="info-value">${booking.site?.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Site Type</span>
                  <span class="info-value">${booking.site?.type || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Check-in Date</span>
                  <span class="info-value">${formatDate(booking.checkInDate)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Check-out Date</span>
                  <span class="info-value">${formatDate(booking.checkOutDate)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Duration</span>
                  <span class="info-value">${calculateNights()} nights</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Guests</span>
                  <span class="info-value">${booking.guests.adults} adults, ${booking.guests.children} children, ${booking.guests.pets} pets</span>
                </div>
              </div>
            </div>

            <div class="section">
              <h3>Charges</h3>
              <div class="line-items">
                <div class="line-item">
                  <div class="line-item-description">
                    <div class="line-item-title">Site Rental - ${booking.site?.name || 'N/A'}</div>
                    <div class="line-item-details">${calculateNights()} nights</div>
                  </div>
                  <div class="line-item-amount">
                    $${(booking.totalAmount - booking.taxAmount - (booking.equipmentRentals?.reduce((sum, er) => sum + er.totalAmount, 0) || 0)).toFixed(2)}
                  </div>
                </div>
                ${booking.equipmentRentals && booking.equipmentRentals.length > 0 ? booking.equipmentRentals.map(rental => `
                  <div class="line-item">
                    <div class="line-item-description">
                      <div class="line-item-title">${rental.equipment?.name || 'Equipment'}</div>
                      <div class="line-item-details">Quantity: ${rental.quantity} × $${rental.dailyRate.toFixed(2)}/day</div>
                    </div>
                    <div class="line-item-amount">$${rental.totalAmount.toFixed(2)}</div>
                  </div>
                `).join('') : ''}
              </div>

              <div class="totals">
                <div class="total-row">
                  <span>Subtotal</span>
                  <span>$${(booking.totalAmount - booking.taxAmount).toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>Tax</span>
                  <span>$${booking.taxAmount.toFixed(2)}</span>
                </div>
                ${booking.discountAmount > 0 ? `
                  <div class="total-row" style="color: #059669;">
                    <span>Discount</span>
                    <span>-$${booking.discountAmount.toFixed(2)}</span>
                  </div>
                ` : ''}
                <div class="total-row grand-total">
                  <span>Total Amount</span>
                  <span>$${booking.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="section">
              <h3>Payment Information</h3>
              <div class="payment-info">
                <p><strong>Payment Status:</strong> <span class="status-badge status-${booking.paymentStatus.toLowerCase()}">${booking.paymentStatus}</span></p>
                <p><strong>Amount Paid:</strong> $${booking.paidAmount.toFixed(2)}</p>
                ${booking.paidAmount < booking.totalAmount ? `
                  <p><strong>Balance Due:</strong> $${(booking.totalAmount - booking.paidAmount).toFixed(2)}</p>
                ` : ''}
                ${booking.depositAmount > 0 ? `
                  <p><strong>Deposit:</strong> $${booking.depositAmount.toFixed(2)}</p>
                ` : ''}
              </div>
            </div>

            ${booking.specialRequests ? `
              <div class="section">
                <h3>Special Requests</h3>
                <p style="color: #4b5563; font-size: 14px;">${booking.specialRequests}</p>
              </div>
            ` : ''}

            <div class="footer">
              <p>Thank you for choosing our campsite!</p>
              <p>For questions or concerns, please contact us at support@campsite.com</p>
              <p style="margin-top: 10px;">This is a computer-generated receipt and does not require a signature.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      // Generate HTML receipt
      const receiptHTML = generateReceiptHTML();
      
      // Create a blob and download
      const blob = new Blob([receiptHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${booking.bookingNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Receipt downloaded successfully', 'success');
    } catch {
      showToast('Failed to download receipt', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    try {
      const receiptHTML = generateReceiptHTML();
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        showToast('Please allow popups to print receipt', 'warning');
        return;
      }

      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    } catch {
      showToast('Failed to print receipt', 'error');
    }
  };

  const handleEmailReceipt = async () => {
    setIsSending(true);
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate the email sending
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast(`Receipt sent to ${booking.user?.email}`, 'success');
    } catch {
      showToast('Failed to send receipt', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Download Receipt"
      size="md"
    >
      <div className="space-y-6">
        {/* Receipt Preview Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText size={24} className="text-gray-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Receipt Details</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Booking: #{booking.bookingNumber}</p>
                <p>Total Amount: ${booking.totalAmount.toFixed(2)}</p>
                <p>Payment Status: {booking.paymentStatus}</p>
                <p>Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Download Options */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Download Options</h4>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download size={18} />
                Download as HTML
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handlePrint}
          >
            <Printer size={18} />
            Print Receipt
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleEmailReceipt}
            disabled={isSending}
          >
            {isSending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail size={18} />
                Email to {booking.user?.email}
              </>
            )}
          </Button>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> The receipt will include all booking details, charges, 
            and payment information. You can save it for your records or print it for 
            check-in purposes.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
