/**
 * ReportDisplay Component
 * Displays generated report with export options
 */

import React from 'react';
import { Download, FileText, Calendar, CheckCircle } from 'lucide-react';
import type { GeneratedReport } from '@/services/api/analytics';

interface ReportDisplayProps {
  report: GeneratedReport;
  onDownload: (reportId: string, format: string) => void;
  downloading?: boolean;
}

export const ReportDisplay: React.FC<ReportDisplayProps> = ({
  report,
  onDownload,
  downloading,
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFormatIcon = () => {
    return <FileText className="w-5 h-5" />;
  };

  const getFormatColor = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'csv':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'excel':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{report.reportName}</h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Generated: {formatDate(report.generatedAt)}</span>
              </div>
              <div
                className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${getFormatColor(
                  report.format
                )}`}
              >
                {getFormatIcon()}
                <span className="font-medium uppercase">{report.format}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Parameters */}
      {Object.keys(report.parameters).length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Report Parameters</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(report.parameters).map(([key, value]) => (
              <div key={key}>
                <span className="text-xs text-gray-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <p className="text-sm font-medium text-gray-900">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download Options */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onDownload(report.id, report.format)}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Downloading...' : `Download ${report.format.toUpperCase()}`}
        </button>

        {report.format !== 'csv' && (
          <button
            onClick={() => onDownload(report.id, 'csv')}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        )}

        {report.format !== 'pdf' && (
          <button
            onClick={() => onDownload(report.id, 'pdf')}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        )}
      </div>

      {/* Expiration Notice */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          This report will expire on {formatDate(report.expiresAt)}
        </p>
      </div>
    </div>
  );
};
