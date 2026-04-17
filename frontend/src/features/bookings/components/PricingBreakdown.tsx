/**
 * PricingBreakdown Component
 * Displays detailed pricing breakdown for a booking
 */

import { DollarSign, Loader } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { BookingPricing } from '@/services/api/bookings';
import { formatCurrency } from '@/utils/currency';

interface PricingBreakdownProps {
  pricing: BookingPricing;
  loading?: boolean;
}

export const PricingBreakdown: React.FC<PricingBreakdownProps> = ({ pricing, loading }) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-primary-100 mb-4 flex items-center gap-2">
        <DollarSign size={20} />
        Pricing Breakdown
      </h3>

      <div className="space-y-3">
        {/* Nightly Breakdown */}
        {pricing.breakdown && pricing.breakdown.length > 0 && (
          <div className="border-b border-gray-200 dark:border-secondary-700 pb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-secondary-300 mb-2">Nightly Rates</h4>
            {pricing.breakdown.map((item, index) => (
              <div key={index} className="flex justify-between text-sm text-gray-600 dark:text-secondary-400">
                <span>
                  {new Date(item.date).toLocaleDateString()} - {item.description}
                </span>
                <span>{formatCurrency(item.rate || 0)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Base Price */}
        <div className="flex justify-between text-gray-700 dark:text-secondary-300">
          <span>
            Base Price ({pricing.nights} night{pricing.nights !== 1 ? 's' : ''})
          </span>
          <span>{formatCurrency(pricing.subtotal || 0)}</span>
        </div>

        {/* Equipment */}
        {pricing.equipmentTotal > 0 && (
          <div className="flex justify-between text-gray-700 dark:text-secondary-300">
            <span>Equipment Rentals</span>
            <span>{formatCurrency(pricing.equipmentTotal || 0)}</span>
          </div>
        )}

        {/* Discount */}
        {pricing.discountAmount > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Discount</span>
            <span>-{formatCurrency(pricing.discountAmount || 0)}</span>
          </div>
        )}

        {/* Tax */}
        <div className="flex justify-between text-gray-700 dark:text-secondary-300">
          <span>Tax</span>
          <span>{formatCurrency(pricing.taxAmount || 0)}</span>
        </div>

        {/* Deposit */}
        <div className="flex justify-between text-gray-700 dark:text-secondary-300 border-t border-gray-200 dark:border-secondary-700 pt-3">
          <span className="font-medium">Deposit Required</span>
          <span className="font-medium">{formatCurrency(pricing.depositAmount || 0)}</span>
        </div>

        {/* Total */}
        <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-primary-100 border-t-2 border-gray-300 dark:border-secondary-600 pt-3">
          <span>Total Amount</span>
          <span>{formatCurrency(pricing.totalAmount || 0)}</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> A deposit of {formatCurrency(pricing.depositAmount || 0)} is required to
          confirm your booking. The remaining balance of {formatCurrency((pricing.totalAmount || 0) - (pricing.depositAmount || 0))} will be due at check-in.
        </p>
      </div>
    </Card>
  );
};
