/**
 * EquipmentCard Component
 * Displays equipment information in a card format
 */

import React from 'react';
import type { Equipment } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface EquipmentCardProps {
  equipment: Equipment;
  onSelect?: (equipment: Equipment) => void;
  onEdit?: (equipment: Equipment) => void;
  showActions?: boolean;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  onSelect,
  onEdit,
  showActions = false,
}) => {
  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'RENTED':
        return 'warning';
      case 'MAINTENANCE':
        return 'info';
      case 'OUT_OF_SERVICE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCategoryLabel = (category: Equipment['category']) => {
    return category.replace(/_/g, ' ');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {equipment.images && equipment.images.length > 0 ? (
          <img
            src={equipment.images[0]}
            alt={equipment.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={getStatusColor(equipment.status)}>
            {equipment.status}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {equipment.name}
          </h3>
          <p className="text-sm text-gray-500">
            {getCategoryLabel(equipment.category)}
          </p>
        </div>

        {/* Description */}
        {equipment.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {equipment.description}
          </p>
        )}

        {/* Availability */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">Available:</span>
          <span className="text-sm font-medium text-gray-900">
            {equipment.availableQuantity} / {equipment.quantity}
          </span>
        </div>

        {/* Pricing */}
        <div className="border-t pt-3 mb-3">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Daily</p>
              <p className="font-semibold text-gray-900">
                {formatPrice(equipment.dailyRate)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Weekly</p>
              <p className="font-semibold text-gray-900">
                {formatPrice(equipment.weeklyRate)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Monthly</p>
              <p className="font-semibold text-gray-900">
                {formatPrice(equipment.monthlyRate)}
              </p>
            </div>
          </div>
        </div>

        {/* Deposit */}
        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-gray-600">Deposit:</span>
          <span className="font-medium text-gray-900">
            {formatPrice(equipment.deposit)}
          </span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2">
            {onSelect && equipment.availableQuantity > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSelect(equipment)}
                className="flex-1"
              >
                Select
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(equipment)}
                className="flex-1"
              >
                Edit
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
