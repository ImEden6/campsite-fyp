import React from 'react';
import { cn } from '@/utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className, label }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <svg
        className={cn('animate-spin text-blue-600', sizes[size], className)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        aria-label={label || 'Loading'}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && (
        <span className="text-sm text-gray-600" aria-live="polite">
          {label}
        </span>
      )}
    </div>
  );
};

// Full page loading spinner
export const PageSpinner: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Spinner size="lg" label={label} />
  </div>
);

// Overlay spinner for modals or sections
export const OverlaySpinner: React.FC<{ label?: string }> = ({ label }) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75 backdrop-blur-sm">
    <Spinner size="lg" label={label} />
  </div>
);

// Inline spinner for buttons or small areas
export const InlineSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('animate-spin h-4 w-4', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default Spinner;
