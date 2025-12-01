/**
 * EquipmentCatalogPage
 * Page for browsing and selecting equipment
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EquipmentCatalog } from '@/features/equipment/components/EquipmentCatalog';
import { EquipmentDetailView } from '@/features/equipment/components/EquipmentDetailView';
import type { Equipment } from '@/types';

export const EquipmentCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const handleSelectEquipment = (equipment: Equipment) => {
    // Navigate to rental form or open rental modal
    navigate(`/equipment/${equipment.id}/rent`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <EquipmentCatalog
        onSelectEquipment={handleSelectEquipment}
        showActions={true}
      />

      {selectedEquipment && (
        <EquipmentDetailView
          equipmentId={selectedEquipment.id}
          onClose={() => setSelectedEquipment(null)}
          onRent={handleSelectEquipment}
        />
      )}
    </div>
  );
};
