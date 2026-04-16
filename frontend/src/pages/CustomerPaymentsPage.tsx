/**
 * CustomerPaymentsPage
 * Customer payment history page
 */

import React from 'react';
import { PaymentHistory } from '@/features/payments/components/PaymentHistory';
import { CreditCard } from 'lucide-react';

const CustomerPaymentsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-primary-100">Payment History</h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              View all your payment transactions
            </p>
          </div>
        </div>

        {/* PaymentHistory already uses GlassCard internally */}
        <PaymentHistory />
      </div>
    </div>
  );
};

export default CustomerPaymentsPage;
