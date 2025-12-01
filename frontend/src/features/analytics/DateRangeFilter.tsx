/**
 * DateRangeFilter Component
 * Provides date range selection for analytics filtering
 */

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

export interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type PresetRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

const getPresetRange = (preset: PresetRange): DateRange => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]!;
  };

  switch (preset) {
    case 'today':
      return {
        startDate: formatDate(today),
        endDate: formatDate(today),
      };
    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return {
        startDate: formatDate(weekAgo),
        endDate: formatDate(today),
      };
    }
    case 'month': {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return {
        startDate: formatDate(monthAgo),
        endDate: formatDate(today),
      };
    }
    case 'quarter': {
      const quarterAgo = new Date(today);
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      return {
        startDate: formatDate(quarterAgo),
        endDate: formatDate(today),
      };
    }
    case 'year': {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return {
        startDate: formatDate(yearAgo),
        endDate: formatDate(today),
      };
    }
    default:
      return {
        startDate: formatDate(today),
        endDate: formatDate(today),
      };
  }
};

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetRange>('month');
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetChange = (preset: PresetRange) => {
    setSelectedPreset(preset);
    if (preset === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onChange(getPresetRange(preset));
    }
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', dateValue: string) => {
    onChange({
      ...value,
      [field]: dateValue,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">Date Range</h3>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handlePresetChange('today')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedPreset === 'today'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Today
        </button>
        <button
          onClick={() => handlePresetChange('week')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedPreset === 'week'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => handlePresetChange('month')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedPreset === 'month'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => handlePresetChange('quarter')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedPreset === 'quarter'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Last 3 Months
        </button>
        <button
          onClick={() => handlePresetChange('year')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedPreset === 'year'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Last Year
        </button>
        <button
          onClick={() => handlePresetChange('custom')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedPreset === 'custom'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={value.startDate}
              onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={value.endDate}
              onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
