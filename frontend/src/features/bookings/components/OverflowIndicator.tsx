import React from 'react';
import { MoreVertical } from 'lucide-react';

interface OverflowIndicatorProps {
  count: number;
  onClick: () => void;
}

export const OverflowIndicator: React.FC<OverflowIndicatorProps> = ({
  count,
  onClick,
}) => {
  return (
    <button
      type="button"
      className="block w-full text-center px-2 py-1 text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded border border-blue-200 dark:border-blue-700 cursor-pointer transition-colors"
      onClick={(e) => {
        console.log('[OverflowIndicator] Button clicked');
        e.stopPropagation();
        onClick();
      }}
    >
      <MoreVertical className="w-3 h-3 inline mr-1" />
      +{count} more
    </button>
  );
};
