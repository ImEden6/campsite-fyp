import { Calendar, ChevronDown } from 'lucide-react';
import type { ReportParameter } from '@/services/api/analytics';
import { Input } from '@/components/ui/Input';

interface ReportFieldProps {
  param: ReportParameter;
  value: unknown;
  error?: string | undefined;
  onChange: (name: string, value: unknown) => void;
}

function FieldLabel({ param }: { param: ReportParameter }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {param.label}
      {param.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function FieldWrapper({ param, children }: { param: ReportParameter; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <FieldLabel param={param} />
      {children}
    </div>
  );
}

function isDateRangeValue(value: unknown): value is { startDate?: string; endDate?: string } {
  return typeof value === 'object' && value !== null;
}

export const DateField: React.FC<ReportFieldProps> = ({ param, value, error, onChange }) => {
  return (
    <FieldWrapper param={param}>
      <div className="relative">
        <input
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(param.name, e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </FieldWrapper>
  );
};

export const DateRangeField: React.FC<ReportFieldProps> = ({ param, value, error, onChange }) => {
  const dateRange = isDateRangeValue(value) ? value : {};

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(param.name, { ...dateRange, startDate: e.target.value });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(param.name, { ...dateRange, endDate: e.target.value });
  };

  return (
    <FieldWrapper param={param}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            type="date"
            value={dateRange.startDate ?? ''}
            onChange={handleStartDateChange}
            placeholder="Start Date"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
        <div>
          <input
            type="date"
            value={dateRange.endDate ?? ''}
            onChange={handleEndDateChange}
            placeholder="End Date"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </FieldWrapper>
  );
};

export const SelectField: React.FC<ReportFieldProps> = ({ param, value, error, onChange }) => {
  return (
    <FieldWrapper param={param}>
      <div className="relative">
        <select
          value={typeof value === 'string' || typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(param.name, e.target.value)}
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
    </FieldWrapper>
  );
};

export const MultiSelectField: React.FC<ReportFieldProps> = ({ param, value, error, onChange }) => {
  const currentValues = Array.isArray(value) ? value : [];

  const handleToggle = (optionValue: string, checked: boolean) => {
    const newValues = checked
      ? [...currentValues, optionValue]
      : currentValues.filter((v: string) => v !== optionValue);
    onChange(param.name, newValues);
  };

  return (
    <FieldWrapper param={param}>
      <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
        {param.options?.map((option) => (
          <label key={option.value} className="flex items-center mb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentValues.includes(option.value)}
              onChange={(e) => handleToggle(option.value, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </FieldWrapper>
  );
};

export const NumberField: React.FC<ReportFieldProps> = ({ param, value, error, onChange }) => {
  return (
    <FieldWrapper param={param}>
      <Input
        type="number"
        value={typeof value === 'number' ? value : ''}
        onChange={(e) => onChange(param.name, parseFloat(e.target.value))}
        error={error}
      />
    </FieldWrapper>
  );
};

export const TextField: React.FC<ReportFieldProps> = ({ param, value, error, onChange }) => {
  return (
    <FieldWrapper param={param}>
      <Input
        type="text"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(param.name, e.target.value)}
        error={error}
      />
    </FieldWrapper>
  );
};
