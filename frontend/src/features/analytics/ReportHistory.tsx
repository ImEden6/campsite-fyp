/**
 * ReportHistory Component
 * Displays list of previously generated reports
 */

import React from 'react';
import { Download, FileText, Calendar, Trash2 } from 'lucide-react';
import type { GeneratedReport } from '@/services/api/analytics';

interface ReportHistoryProps {
  reports: GeneratedReport[];
  onDownload: (reportId: string, format: string) => void;
  onDelete?: (reportId: string) => void;
  loading?: boolean;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  reports,
  onDownload,
  onDelete,
  loading,
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFormatBadgeColor = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return 'bg-red-100 text-red-700';
      case 'csv':
        return 'bg-green-100 text-green-700';
      case 'excel':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report History</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report History</h3>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No reports generated yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Generate your first report to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Report History</h3>
      
      <div className="space-y-3">
        {reports.map((report) => {
          const expired = isExpired(report.expiresAt);
          
          return (
            <div
              key={report.id}
              className={`border rounded-lg p-4 transition-all ${
                expired
                  ? 'border-gray-200 bg-gray-50 opacity-60'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{report.reportName}</h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${getFormatBadgeColor(
                        report.format
                      )}`}
                    >
                      {report.format.toUpperCase()}
                    </span>
                    {expired && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                        Expired
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(report.generatedAt)}</span>
                    </div>
                    {!expired && (
                      <span className="text-xs">
                        Expires: {formatDate(report.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {!expired && (
                    <button
                      onClick={() => onDownload(report.id, report.format)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download Report"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(report.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
