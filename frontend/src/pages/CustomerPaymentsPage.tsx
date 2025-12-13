import React from 'react';
import { PaymentHistory } from '@/features/payments/components/PaymentHistory';

const CustomerPaymentsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Payment History</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View all your payment transactions
        </p>
      </div>
      <PaymentHistory />
    </div>
  );
};

export default CustomerPaymentsPage;

