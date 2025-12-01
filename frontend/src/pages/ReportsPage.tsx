/**
 * ReportsPage
 * Interface for generating and managing reports
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ReportTypeSelector,
  ReportParameterForm,
  ReportDisplay,
  ReportHistory,
} from '@/features/analytics';
import {
  getReportTypes,
  generateReport,
  getReportHistory,
  downloadReport,
  type ReportType,
  type ReportConfig,
  type GeneratedReport,
} from '@/services/api/analytics';
import { queryKeys } from '@/config/query-keys';
import { FileText, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

type Step = 'select' | 'configure' | 'display';

export const ReportsPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch report types
  const { data: reportTypes, isLoading: typesLoading } = useQuery({
    queryKey: queryKeys.analytics.reports(),
    queryFn: getReportTypes,
  });

  // Fetch report history
  const { data: reportHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['reportHistory'],
    queryFn: getReportHistory,
  });

  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: (config: ReportConfig) => generateReport(config),
    onSuccess: (report) => {
      setGeneratedReport(report);
      setCurrentStep('display');
      queryClient.invalidateQueries({ queryKey: ['reportHistory'] });
      showToast('Report generated successfully', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to generate report', 'error');
    },
  });

  const handleReportTypeSelect = (reportType: ReportType) => {
    setSelectedReportType(reportType);
    setCurrentStep('configure');
  };

  const handleParametersSubmit = (parameters: Record<string, unknown>) => {
    if (!selectedReportType) return;

    const config: ReportConfig = {
      reportTypeId: selectedReportType.id,
      parameters,
      format: 'pdf', // Default format, could be made configurable
    };

    generateMutation.mutate(config);
  };

  const handleDownload = async (reportId: string, format: string) => {
    try {
      setDownloadingReportId(reportId);
      const blob = await downloadReport(reportId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${reportId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('Report downloaded successfully', 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to download report', 'error');
    } finally {
      setDownloadingReportId(null);
    }
  };

  const handleBack = () => {
    if (currentStep === 'configure') {
      setCurrentStep('select');
      setSelectedReportType(null);
    } else if (currentStep === 'display') {
      setCurrentStep('select');
      setSelectedReportType(null);
      setGeneratedReport(null);
    }
  };

  const handleNewReport = () => {
    setCurrentStep('select');
    setSelectedReportType(null);
    setGeneratedReport(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStep !== 'select' && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div className="p-3 bg-blue-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {currentStep === 'select' && 'Select a report type to generate'}
                  {currentStep === 'configure' && 'Configure report parameters'}
                  {currentStep === 'display' && 'Your report is ready'}
                </p>
              </div>
            </div>
            {currentStep === 'display' && (
              <button
                onClick={handleNewReport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Generate New Report
              </button>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  currentStep === 'select'
                    ? 'bg-blue-600 text-white'
                    : 'bg-green-600 text-white'
                }`}
              >
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Select Type</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  currentStep === 'configure'
                    ? 'bg-blue-600 text-white'
                    : currentStep === 'display'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Configure</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  currentStep === 'display'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Download</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === 'select' && (
              <ReportTypeSelector
                reportTypes={reportTypes || []}
                selectedType={selectedReportType?.id || null}
                onSelect={handleReportTypeSelect}
                loading={typesLoading}
              />
            )}

            {currentStep === 'configure' && selectedReportType && (
              <ReportParameterForm
                reportType={selectedReportType}
                onSubmit={handleParametersSubmit}
                loading={generateMutation.isPending}
              />
            )}

            {currentStep === 'display' && generatedReport && (
              <ReportDisplay
                report={generatedReport}
                onDownload={handleDownload}
                downloading={downloadingReportId === generatedReport.id}
              />
            )}
          </div>

          {/* Sidebar - Report History */}
          <div className="lg:col-span-1">
            <ReportHistory
              reports={reportHistory || []}
              onDownload={handleDownload}
              loading={historyLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
