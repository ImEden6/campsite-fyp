import React from 'react';
import { BarChart3 } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <BarChart3 className="w-24 h-24 text-gray-400 dark:text-gray-600 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Analytics & Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          Analytics dashboard coming soon. This will display revenue, occupancy, and performance metrics.
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPage;
