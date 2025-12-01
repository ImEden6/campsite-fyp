import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface InlineErrorProps {
  message?: string;
  className?: string;
}

const InlineError: React.FC<InlineErrorProps> = ({ message, className }) => {
  if (!message) return null;

  return (
    <div
      className={cn(
        'flex items-start gap-2 text-sm text-red-600 mt-1',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
};

export default InlineError;
