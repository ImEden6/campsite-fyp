import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';

export interface DatePickerProps {
  value?: Date | null | undefined;
  onChange?: ((date: Date | null) => void) | undefined;
  label?: string | undefined;
  error?: string | undefined;
  placeholder?: string | undefined;
  minDate?: Date | undefined;
  maxDate?: Date | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

export interface DateRangePickerProps {
  startDate?: Date | null | undefined;
  endDate?: Date | null | undefined;
  onChange?: ((startDate: Date | null, endDate: Date | null) => void) | undefined;
  label?: string | undefined;
  error?: string | undefined;
  minDate?: Date | undefined;
  maxDate?: Date | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  error,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!isDateDisabled(selectedDate)) {
      onChange?.(selectedDate);
      setIsOpen(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between rounded-xl border border-secondary-200 dark:border-secondary-700',
          'bg-secondary-50 dark:bg-night-surface-alt px-3 py-2.5 text-left text-sm',
          'text-primary-900 dark:text-primary-100',
          'focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20',
          'disabled:cursor-not-allowed disabled:bg-secondary-100 disabled:text-secondary-400',
          error && 'border-error-500 dark:border-error-400 focus:border-error-500 dark:focus:border-error-400 focus:ring-error-500/20 dark:focus:ring-error-400/20'
        )}
      >
        <span className={cn(!value && 'text-secondary-400 dark:text-secondary-400')}>
          {value ? formatDate(value) : placeholder}
        </span>
        <svg className="h-5 w-5 text-secondary-500 dark:text-secondary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <div className="absolute left-0 top-0 w-full h-full" onClick={() => setIsOpen(false)} />
          <div 
            className="absolute mt-1 w-72 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-night-surface p-4 shadow-xl pointer-events-auto"
            style={{ 
              left: containerRef.current ? containerRef.current.getBoundingClientRect().left : 'auto',
              top: containerRef.current ? containerRef.current.getBoundingClientRect().bottom + 4 : 'auto'
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="rounded-lg p-1.5 hover:bg-secondary-100 dark:hover:bg-night-surface-alt"
              >
                <svg className="h-5 w-5 text-secondary-600 dark:text-secondary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="font-semibold text-primary-900 dark:text-primary-100">
                {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="rounded-lg p-1.5 hover:bg-secondary-100 dark:hover:bg-night-surface-alt"
              >
                <svg className="h-5 w-5 text-secondary-600 dark:text-secondary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="font-semibold text-secondary-500 dark:text-secondary-400">
                  {day}
                </div>
              ))}
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} />
              ))}
              {days.map((day) => {
                const date = new Date(year, month, day);
                const isSelected = value && date.toDateString() === value.toDateString();
                const isDisabled = isDateDisabled(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    disabled={isDisabled}
                    className={cn(
                      'rounded-lg p-2 text-sm font-medium',
                      isSelected && 'bg-primary-600 text-white',
                      !isSelected && !isDisabled && 'text-primary-900 dark:text-primary-100 hover:bg-secondary-100 dark:hover:bg-night-surface-alt',
                      isToday && !isSelected && 'ring-2 ring-primary-500',
                      isDisabled && 'cursor-not-allowed text-secondary-300 dark:text-secondary-600'
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  label,
  error,
  minDate,
  maxDate,
  disabled = false,
  className,
}) => {

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <DatePicker
          value={startDate}
          onChange={(date) => {
            onChange?.(date, endDate || null);
          }}
          placeholder="Start date"
          minDate={minDate}
          maxDate={endDate || maxDate}
          disabled={disabled}
          className="flex-1"
        />
        <span className="text-gray-500">to</span>
        <DatePicker
          value={endDate}
          onChange={(date) => {
            onChange?.(startDate || null, date);
          }}
          placeholder="End date"
          minDate={startDate || minDate}
          maxDate={maxDate}
          disabled={disabled}
          className="flex-1"
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default DatePicker;
