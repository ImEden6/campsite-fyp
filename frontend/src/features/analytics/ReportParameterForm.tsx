/**
 * ReportParameterForm Component
 * Dynamic form for configuring report parameters
 */

import React, { useState, useEffect } from 'react';
import type { ReportParameter, ReportType } from '@/services/api/analytics';
import {
  DateField,
  DateRangeField,
  SelectField,
  MultiSelectField,
  NumberField,
  TextField,
} from './components';

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

    const FIELD_COMPONENTS: Record<ReportParameter['type'], React.FC<{ param: ReportParameter; value: unknown; error?: string | undefined; onChange: (name: string, value: unknown) => void }>> = {
    date: DateField,
    dateRange: DateRangeField,
    select: SelectField,
    multiSelect: MultiSelectField,
    number: NumberField,
    text: TextField,
  };

  const renderField = (param: ReportParameter) => {
    const FieldComponent = FIELD_COMPONENTS[param.type];
    return (
      <FieldComponent
        key={param.name}
        param={param}
        value={parameters[param.name]}
        error={errors[param.name]}
        onChange={handleChange}
      />
    );
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
