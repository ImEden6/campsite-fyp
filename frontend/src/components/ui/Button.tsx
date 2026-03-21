import React from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | undefined;
  size?: 'sm' | 'md' | 'lg' | undefined;
  loading?: boolean | undefined;
  children: React.ReactNode;
  ariaLabel?: string | undefined;
  ariaDescribedBy?: string | undefined;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ariaLabel, ariaDescribedBy, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-400 dark:text-primary-950 dark:hover:bg-primary-300 focus-visible:ring-primary-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
      secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 dark:bg-secondary-400 dark:text-secondary-950 dark:hover:bg-secondary-300 focus-visible:ring-secondary-500',
      outline: 'border-2 border-primary-500/30 dark:border-primary-400/30 bg-transparent text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/50 hover:border-primary-500 dark:hover:border-primary-400 focus-visible:ring-primary-400',
      ghost: 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/50 focus-visible:ring-primary-400',
      danger: 'bg-error-500 text-white hover:bg-error-600 dark:bg-error-400 dark:hover:bg-error-500 focus-visible:ring-error-500',
      accent: 'bg-accent-500 text-accent-950 hover:bg-accent-400 dark:bg-accent-400 dark:text-accent-950 dark:hover:bg-accent-300 focus-visible:ring-accent-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
    };

    // Mobile-optimized sizes with larger touch targets (min 44x44px for accessibility)
    const sizes = {
      sm: 'h-9 px-3 text-sm min-h-[36px]',
      md: 'h-11 px-4 text-base min-h-[44px]',
      lg: 'h-12 px-6 text-lg min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
