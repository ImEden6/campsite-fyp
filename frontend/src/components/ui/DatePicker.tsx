/**
 * DatePicker Component
 * Simple date picker wrapper around native input
 */

import React from 'react';

export interface DatePickerProps {
  selected: Date;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  selectsStart?: boolean;
  selectsEnd?: boolean;
  startDate?: Date;
  endDate?: Date;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selected,
  onChange,
  minDate,
  maxDate,
  className = '',
  disabled = false,
  placeholder = 'Select date',
}) => {
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      onChange(new Date(value));
    } else {
      onChange(null);
    }
  };

  return (
    <input
      type="date"
      value={formatDateForInput(selected)}
      onChange={handleChange}
      min={minDate ? formatDateForInput(minDate) : undefined}
      max={maxDate ? formatDateForInput(maxDate) : undefined}
      disabled={disabled}
      placeholder={placeholder}
      className={`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    />
  );
};
