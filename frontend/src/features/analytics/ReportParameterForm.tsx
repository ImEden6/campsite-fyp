/**
 * ReportParameterForm Component
 * Dynamic form for configuring report parameters
 */

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import type { ReportType, ReportParameter } from '@/services/api/analytics';

interface ReportParameterFormProps {
  reportType: ReportType;
  onSubmit: (parameters: Record<string, unknown>) => void;
  loading?: boolean;
}

export const ReportParameterForm: React.FC<ReportParameterFormProps> = ({
  reportType,
  onSubmit,
  loading,
}) => {
  const [parameters, setParameters] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize parameters with default values
  useEffect(() => {
    const initialParams: Record<string, unknown> = {};
    reportType.parameters.forEach((param) => {
      if (param.defaultValue !== undefined) {
        initialParams[param.name] = param.defaultValue;
      }
    });
    setParameters(initialParams);
  }, [reportType]);

  const handleChange = (name: string, value: unknown) => {
    setParameters((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    reportType.parameters.forEach((param) => {
      if (param.required && !parameters[param.name]) {
        newErrors[param.name] = `${param.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(parameters);
    }
  };

  const renderField = (param: ReportParameter) => {
    const value = parameters[param.name];
    const error = errors[param.name];

    switch (param.type) {
      case 'date':
        return (
          <div key={param.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {param.label}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <input
                type="date"
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => handleChange(param.name, e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'dateRange':
        return (
          <div key={param.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {param.label}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="date"
                  value={(value && typeof value === 'object' && 'startDate' in value && typeof value.startDate === 'string') ? value.startDate : ''}
                  onChange={(e) =>
                    handleChange(param.name, { ...(typeof value === 'object' ? value : {}), startDate: e.target.value })
                  }
                  placeholder="Start Date"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <input
                  type="date"
                  value={(value && typeof value === 'object' && 'endDate' in value && typeof value.endDate === 'string') ? value.endDate : ''}
                  onChange={(e) =>
                    handleChange(param.name, { ...(typeof value === 'object' ? value : {}), endDate: e.target.value })
                  }
                  placeholder="End Date"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={param.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {param.label}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <select
                value={typeof value === 'string' || typeof value === 'number' ? value : ''}
                onChange={(e) => handleChange(param.name, e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select {param.label}</option>
                {param.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'multiSelect':
        return (
          <div key={param.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {param.label}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              {param.options?.map((option) => (
                <label key={option.value} className="flex items-center mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) && value.includes(option.value)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: string) => v !== option.value);
                      handleChange(param.name, newValues);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={param.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {param.label}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={typeof value === 'number' ? value : ''}
              onChange={(e) => handleChange(param.name, parseFloat(e.target.value))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'text':
      default:
        return (
          <div key={param.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {param.label}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => handleChange(param.name, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Parameters</h3>
      
      {reportType.parameters.map((param) => renderField(param))}

      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </form>
  );
};
