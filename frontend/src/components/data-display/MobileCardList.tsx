/**
 * MobileCardList Component
 * Card-based layout optimized for mobile viewing of list data
 */

import React from 'react';
import { cn } from '@/utils/cn';

export interface CardListItem {
  id: string | number;
  [key: string]: unknown;
}

export interface CardListField<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  primary?: boolean;
  secondary?: boolean;
}

export interface MobileCardListProps<T extends CardListItem> {
  items: T[];
  fields: CardListField<T>[];
  onItemClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

function MobileCardList<T extends CardListItem>({
  items,
  fields,
  onItemClick,
  emptyMessage = 'No items found',
  loading = false,
  className,
}: MobileCardListProps<T>) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
          >
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  const primaryField = fields.find((f) => f.primary);
  const secondaryField = fields.find((f) => f.secondary);
  const detailFields = fields.filter((f) => !f.primary && !f.secondary);

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick?.(item)}
          className={cn(
            'bg-white rounded-lg border border-gray-200 p-4 transition-shadow',
            onItemClick && 'cursor-pointer active:bg-gray-50 hover:shadow-md'
          )}
        >
          {/* Primary field - larger, bold */}
          {primaryField && (
            <div className="text-base font-semibold text-gray-900 mb-1">
              {primaryField.render(item)}
            </div>
          )}

          {/* Secondary field - smaller, muted */}
          {secondaryField && (
            <div className="text-sm text-gray-600 mb-3">
              {secondaryField.render(item)}
            </div>
          )}

          {/* Detail fields - grid layout */}
          {detailFields.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {detailFields.map((field) => (
                <div key={field.key} className="flex justify-between items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider shrink-0">
                    {field.label}
                  </span>
                  <span className="text-sm text-gray-900 text-right">
                    {field.render(item)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default MobileCardList;
