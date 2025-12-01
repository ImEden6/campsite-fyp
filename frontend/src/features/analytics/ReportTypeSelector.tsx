/**
 * ReportTypeSelector Component
 * Allows users to select report type and category
 */

import React from 'react';
import { FileText, DollarSign, Users, Package, TrendingUp } from 'lucide-react';
import type { ReportType } from '@/services/api/analytics';

interface ReportTypeSelectorProps {
  reportTypes: ReportType[];
  selectedType: string | null;
  onSelect: (reportType: ReportType) => void;
  loading?: boolean;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'financial':
      return <DollarSign className="w-5 h-5" />;
    case 'operational':
      return <TrendingUp className="w-5 h-5" />;
    case 'customer':
      return <Users className="w-5 h-5" />;
    case 'inventory':
      return <Package className="w-5 h-5" />;
    default:
      return <FileText className="w-5 h-5" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'financial':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'operational':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'customer':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'inventory':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({
  reportTypes,
  selectedType,
  onSelect,
  loading,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3"></div>
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  // Group reports by category
  const groupedReports = reportTypes.reduce((acc, report) => {
    if (!acc[report.category]) {
      acc[report.category] = [];
    }
    acc[report.category]!.push(report);
    return acc;
  }, {} as Record<string, ReportType[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedReports).map(([category, reports]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 capitalize">
            {category} Reports
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => onSelect(report)}
                className={`text-left bg-white border-2 rounded-lg p-4 transition-all hover:shadow-md ${selectedType === report.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div
                  className={`inline-flex p-2 rounded-lg mb-3 ${getCategoryColor(category)}`}
                >
                  {getCategoryIcon(category)}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{report.name}</h4>
                <p className="text-sm text-gray-600">{report.description}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
