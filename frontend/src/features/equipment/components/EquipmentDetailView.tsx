/**
 * EquipmentDetailView Component
 * Displays detailed information about a specific equipment item
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEquipmentById } from '@/services/api/equipment';
import { queryKeys } from '@/config/query-keys';
import type { Equipment } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface EquipmentDetailViewProps {
  equipmentId: string;
  onClose: () => void;
  onRent?: (equipment: Equipment) => void;
  onEdit?: (equipment: Equipment) => void;
}

export const EquipmentDetailView: React.FC<EquipmentDetailViewProps> = ({
  equipmentId,
  onClose,
  onRent,
  onEdit,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.equipment.detail(equipmentId),
    queryFn: () => getEquipmentById(equipmentId),
  });

  const equipment = data?.data;

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
    <Modal isOpen={true} onClose={onClose} size="lg" title="Equipment Details">
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load equipment details.</p>
        </div>
      )}

      {equipment && (
        <div className="space-y-6">
          {/* Image Gallery */}
          <div className="space-y-2">
            {/* Main Image */}
            <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden">
              {equipment.images && equipment.images.length > 0 ? (
                <img
                  src={equipment.images[selectedImageIndex]}
                  alt={equipment.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg
                    className="w-24 h-24"
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
            </div>

            {/* Thumbnail Gallery */}
            {equipment.images && equipment.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {equipment.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index
                        ? 'border-blue-600'
                        : 'border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${equipment.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {equipment.name}
              </h2>
              <Badge variant={getStatusColor(equipment.status)}>
                {equipment.status}
              </Badge>
            </div>
            <p className="text-lg text-gray-600">
              {getCategoryLabel(equipment.category)}
            </p>
          </div>

          {/* Description */}
          {equipment.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-gray-700">{equipment.description}</p>
            </div>
          )}

          {/* Availability */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Availability
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Available Quantity:</span>
              <span className="text-xl font-bold text-gray-900">
                {equipment.availableQuantity} / {equipment.quantity}
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Rental Rates
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Daily Rate</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatPrice(equipment.dailyRate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Weekly Rate</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatPrice(equipment.weeklyRate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Rate</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatPrice(equipment.monthlyRate)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Security Deposit:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatPrice(equipment.deposit)}
                </span>
              </div>
            </div>
          </div>

          {/* Specifications */}
          {equipment.specifications &&
            Object.keys(equipment.specifications).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Specifications
                </h3>
                <dl className="grid grid-cols-2 gap-4">
                  {Object.entries(equipment.specifications).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-sm text-gray-600 capitalize">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {onRent && equipment.availableQuantity > 0 && (
              <Button
                variant="primary"
                onClick={() => onRent(equipment)}
                className="flex-1"
              >
                Rent Equipment
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                onClick={() => onEdit(equipment)}
                className="flex-1"
              >
                Edit
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
