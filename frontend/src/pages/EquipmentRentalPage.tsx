/**
 * EquipmentRentalPage
 * Page for renting equipment for a booking
 */

import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { EquipmentRentalForm } from '@/features/equipment/components/EquipmentRentalForm';

export const EquipmentRentalPage: React.FC = () => {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const bookingId = searchParams.get('bookingId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!equipmentId || !bookingId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Missing required parameters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Rent Equipment</h1>
        
        <EquipmentRentalForm
          equipmentId={equipmentId}
          bookingId={bookingId}
          defaultStartDate={startDate ? new Date(startDate) : undefined}
          defaultEndDate={endDate ? new Date(endDate) : undefined}
          onSuccess={() => navigate(`/bookings/${bookingId}`)}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
};
