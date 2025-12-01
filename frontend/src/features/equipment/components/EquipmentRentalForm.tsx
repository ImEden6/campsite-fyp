/**
 * EquipmentRentalForm Component
 * Form for adding equipment rentals to a booking
 */

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createRental,
  calculateRentalPrice,
  getEquipmentById,
} from '@/services/api/equipment';
import { queryKeys } from '@/config/query-keys';
// Equipment type is imported in the API functions
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';

interface EquipmentRentalFormProps {
  equipmentId: string;
  bookingId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultStartDate?: Date;
  defaultEndDate?: Date;
}

export const EquipmentRentalForm: React.FC<EquipmentRentalFormProps> = ({
  equipmentId,
  bookingId,
  onSuccess,
  onCancel,
  defaultStartDate,
  defaultEndDate,
}) => {
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState(
    defaultStartDate ? defaultStartDate.toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    defaultEndDate ? defaultEndDate.toISOString().split('T')[0] : ''
  );
  const [pricing, setPricing] = useState<{
    totalAmount: number;
    depositAmount: number;
    days: number;
  } | null>(null);

  // Fetch equipment details
  const { data: equipmentData } = useQuery({
    queryKey: queryKeys.equipment.detail(equipmentId),
    queryFn: () => getEquipmentById(equipmentId),
  });

  const equipment = equipmentData?.data;

  // Calculate pricing when inputs change
  useEffect(() => {
    if (equipment && quantity > 0 && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end > start) {
        calculateRentalPrice(equipmentId, quantity, start, end)
          .then((response) => {
            setPricing(response.data);
          })
          .catch((error) => {
            console.error('Failed to calculate pricing:', error);
          });
      }
    }
  }, [equipment, equipmentId, quantity, startDate, endDate]);

  // Create rental mutation
  const createRentalMutation = useMutation({
    mutationFn: createRental,
    onSuccess: () => {
      showToast('Equipment rental added successfully', 'success');
      onSuccess?.();
    },
    onError: (error: unknown) => {
      showToast(
        error instanceof Error ? error.message : 'Failed to add equipment rental',
        'error'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!equipment) {
      showToast('Equipment not found', 'error');
      return;
    }

    if (quantity > equipment.availableQuantity) {
      showToast(
        `Only ${equipment.availableQuantity} units available`,
        'error'
      );
      return;
    }

    if (!startDate || !endDate) {
      showToast('Please select start and end dates', 'error');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      showToast('End date must be after start date', 'error');
      return;
    }

    createRentalMutation.mutate({
      bookingId,
      equipmentId,
      quantity,
      startDate: start,
      endDate: end,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!equipment) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Equipment Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {equipment.name}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{equipment.description}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Available:</span>
          <span className="font-medium text-gray-900">
            {equipment.availableQuantity} units
          </span>
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity
        </label>
        <Input
          type="number"
          min={1}
          max={equipment.availableQuantity}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          Maximum: {equipment.availableQuantity} units
        </p>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            required
          />
        </div>
      </div>

      {/* Pricing Breakdown */}
      {pricing && (
        <div className="bg-blue-50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-gray-900 mb-3">Pricing Summary</h4>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Rental Period:</span>
            <span className="font-medium text-gray-900">
              {pricing.days} {pricing.days === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Daily Rate:</span>
            <span className="font-medium text-gray-900">
              {formatPrice(equipment.dailyRate)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Quantity:</span>
            <span className="font-medium text-gray-900">{quantity}</span>
          </div>

          <div className="border-t border-blue-200 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Rental Total:</span>
              <span className="font-bold text-gray-900">
                {formatPrice(pricing.totalAmount)}
              </span>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Security Deposit:</span>
            <span className="font-medium text-gray-900">
              {formatPrice(pricing.depositAmount)}
            </span>
          </div>

          <div className="border-t border-blue-200 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-bold text-gray-900">Total Due:</span>
              <span className="font-bold text-blue-600 text-lg">
                {formatPrice(pricing.totalAmount + pricing.depositAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={createRentalMutation.isPending || !pricing}
          className="flex-1"
        >
          {createRentalMutation.isPending ? 'Adding...' : 'Add to Booking'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
