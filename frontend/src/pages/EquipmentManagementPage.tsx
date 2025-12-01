/**
 * EquipmentManagementPage
 * Admin page for managing equipment inventory
 */

import React, { useState } from 'react';
import { InventoryManager } from '@/features/equipment/components/InventoryManager';
import { EquipmentDetailView } from '@/features/equipment/components/EquipmentDetailView';
import type { Equipment } from '@/types';

export const EquipmentManagementPage: React.FC = () => {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <InventoryManager onSelectEquipment={setSelectedEquipment} />

      {selectedEquipment && (
        <EquipmentDetailView
          equipmentId={selectedEquipment.id}
          onClose={() => setSelectedEquipment(null)}
        />
      )}
    </div>
  );
};
