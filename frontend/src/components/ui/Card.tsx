import React from 'react';
import { cn } from '@/utils/cn';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  hover?: boolean;
  glass?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className, loading = false, hover = false, glass = false }) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-secondary-200/50 dark:border-secondary-700/50 shadow-campsite',
        glass
          ? 'bg-white/80 dark:bg-night-surface/80 backdrop-blur-md'
          : 'bg-white dark:bg-gray-800',
        hover && 'transition-all duration-200 hover:shadow-organic hover:-translate-y-0.5',
        loading && 'relative overflow-hidden',
        className
      )}
    >
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75">
          <div className="flex flex-col items-center gap-2">
            <svg
              className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400"
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
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('border-b border-gray-200 dark:border-gray-700 px-6 py-4', className)}>
      {children}
    </div>
  );
};

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-gray-100', className)}>
      {children}
    </h3>
  );
};

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

const CardBody: React.FC<CardBodyProps> = ({ children, className }) => {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
};

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div className={cn('border-t border-gray-200 dark:border-gray-700 px-6 py-4', className)}>
      {children}
    </div>
  );
};

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardBody.displayName = 'CardBody';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardBody, CardFooter };
export default Card;
