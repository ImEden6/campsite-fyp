import React from 'react';
import { cn } from '@/utils/cn';

export interface DataGridItem {
  id: string | number;
  [key: string]: unknown;
}

export interface DataGridProps<T extends DataGridItem> {
  data: T[];
  renderCard: (item: T) => React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  loading?: boolean;
  emptyMessage?: string;
  onItemClick?: (item: T) => void;
  className?: string;
}

function DataGrid<T extends DataGridItem>({
  data,
  renderCard,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  gap = 4,
  loading = false,
  emptyMessage = 'No items to display',
  onItemClick,
  className,
}: DataGridProps<T>) {
  const gridColsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const gapClasses = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
  };

  const getGridClasses = () => {
    const classes = [];
    
    if (columns.xs) classes.push(gridColsClasses[columns.xs as keyof typeof gridColsClasses]);
    if (columns.sm) classes.push(`sm:${gridColsClasses[columns.sm as keyof typeof gridColsClasses]}`);
    if (columns.md) classes.push(`md:${gridColsClasses[columns.md as keyof typeof gridColsClasses]}`);
    if (columns.lg) classes.push(`lg:${gridColsClasses[columns.lg as keyof typeof gridColsClasses]}`);
    if (columns.xl) classes.push(`xl:${gridColsClasses[columns.xl as keyof typeof gridColsClasses]}`);
    
    return classes.join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <svg
            className="h-8 w-8 animate-spin text-blue-600"
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
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid',
        getGridClasses(),
        gapClasses[gap as keyof typeof gapClasses] || 'gap-4',
        className
      )}
    >
      {data.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick?.(item)}
          className={cn(onItemClick && 'cursor-pointer')}
        >
          {renderCard(item)}
        </div>
      ))}
    </div>
  );
}

export default DataGrid;
