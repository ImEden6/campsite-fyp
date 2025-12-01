/**
 * EquipmentCheckInOut Component
 * Interface for checking in/out equipment rentals
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBookingRentals, updateRental } from '@/services/api/equipment';
import { queryKeys } from '@/config/query-keys';
import type { EquipmentRental } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';

interface EquipmentCheckInOutProps {
  bookingId: string;
}

interface CheckInOutModalProps {
  rental: EquipmentRental;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CheckInOutModal: React.FC<CheckInOutModalProps> = ({
  rental,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [condition, setCondition] = useState('');
  const [notes, setNotes] = useState('');

  const updateRentalMutation = useMutation({
    mutationFn: (data: { returnedAt?: Date; condition?: string; notes?: string }) =>
      updateRental(rental.id, data),
    onSuccess: () => {
      showToast('Equipment checked in successfully', 'success');
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.rentals(rental.bookingId) });
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to check in equipment', 'error');
    },
  });

  const handleCheckIn = () => {
    updateRentalMutation.mutate({
      returnedAt: new Date(),
      condition: condition || 'Good',
      notes,
    });
  };

  const isReturned = !!rental.returnedAt;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReturned ? 'Equipment Details' : 'Check In Equipment'}
    >
      <div className="space-y-4">
        {/* Equipment Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            {rental.equipment?.name}
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-medium text-gray-900">{rental.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rental Period:</span>
              <span className="font-medium text-gray-900">
                {new Date(rental.startDate).toLocaleDateString()} -{' '}
                {new Date(rental.endDate).toLocaleDateString()}
              </span>
            </div>
            {isReturned && (
              <div className="flex justify-between">
                <span className="text-gray-600">Returned:</span>
                <span className="font-medium text-gray-900">
                  {new Date(rental.returnedAt!).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condition
          </label>
          {isReturned ? (
            <p className="text-gray-900">{rental.condition || 'Not specified'}</p>
          ) : (
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select condition</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Damaged">Damaged</option>
            </select>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          {isReturned ? (
            <p className="text-gray-900">{rental.notes || 'No notes'}</p>
          ) : (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any damage, missing items, or other notes..."
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {!isReturned && (
            <Button
              variant="primary"
              onClick={handleCheckIn}
              disabled={updateRentalMutation.isPending}
              className="flex-1"
            >
              {updateRentalMutation.isPending ? 'Checking In...' : 'Check In'}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {isReturned ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const EquipmentCheckInOut: React.FC<EquipmentCheckInOutProps> = ({
  bookingId,
}) => {
  const [selectedRental, setSelectedRental] = useState<EquipmentRental | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.equipment.rentals(bookingId),
    queryFn: () => getBookingRentals(bookingId),
  });

  const rentals = data?.data || [];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load equipment rentals.</p>
      </div>
    );
  }

  if (rentals.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
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
        <p className="mt-2 text-sm text-gray-600">No equipment rentals for this booking</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Equipment Rentals</h3>

      <div className="space-y-3">
        {rentals.map((rental) => (
          <div
            key={rental.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {rental.equipment?.name}
                  </h4>
                  {rental.returnedAt ? (
                    <Badge variant="success">Returned</Badge>
                  ) : (
                    <Badge variant="warning">Out</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Quantity:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {rental.quantity}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {formatPrice(rental.totalAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Start:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(rental.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">End:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(rental.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {rental.returnedAt && rental.condition && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Condition:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {rental.condition}
                    </span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRental(rental)}
              >
                {rental.returnedAt ? 'View' : 'Check In'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {selectedRental && (
        <CheckInOutModal
          rental={selectedRental}
          isOpen={true}
          onClose={() => setSelectedRental(null)}
          onSuccess={() => setSelectedRental(null)}
        />
      )}
    </div>
  );
};
