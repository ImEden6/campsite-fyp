import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: readonly SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  searchable = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === 'ArrowUp' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, optionValue: string, optionDisabled?: boolean) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!optionDisabled) {
        handleSelect(optionValue);
      }
    }
  };

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
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-night-surface px-3 py-2.5 text-left text-sm text-secondary-900 dark:text-primary-100',
          'focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20',
          'disabled:cursor-not-allowed disabled:bg-secondary-100 dark:disabled:bg-night-bg disabled:text-secondary-500 dark:disabled:text-secondary-400',
          error && 'border-error-500 dark:border-error-400 focus:border-error-500 dark:focus:border-error-400 focus:ring-error-500/20 dark:focus:ring-error-400/20'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label || placeholder}
      >
        <span className={cn(!selectedOption && 'text-secondary-500 dark:text-secondary-400')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={cn('h-5 w-5 text-secondary-500 dark:text-secondary-400 transition-transform', isOpen && 'rotate-180')}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-night-surface shadow-lg">
          {searchable && (
            <div className="border-b border-secondary-200 dark:border-secondary-700 p-2">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                className="w-full rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-night-surface text-secondary-900 dark:text-primary-100 placeholder-secondary-500 dark:placeholder-secondary-400 px-3 py-2 text-sm focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20"
              />
            </div>
          )}
          <ul
            className="max-h-60 overflow-auto py-1"
            role="listbox"
            tabIndex={-1}
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-secondary-500 dark:text-secondary-400">No options found</li>
            ) : (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  onKeyDown={(e) => handleOptionKeyDown(e, option.value, option.disabled)}
                  tabIndex={option.disabled ? -1 : 0}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-sm text-secondary-900 dark:text-primary-100',
                    option.value === value && 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300',
                    !option.disabled && 'hover:bg-secondary-100 dark:hover:bg-night-surface-alt focus:bg-secondary-100 dark:focus:bg-night-surface-alt focus:outline-none',
                    option.disabled && 'cursor-not-allowed text-secondary-400 dark:text-secondary-500'
                  )}
                >
                  {option.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export { Select };
export default Select;
