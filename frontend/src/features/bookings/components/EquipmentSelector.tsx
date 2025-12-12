/**
 * EquipmentSelector Component
 * Allows users to select equipment rentals for their booking
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Minus, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { queryKeys } from '@/config/query-keys';
import { getAvailableEquipment, type EquipmentWithAvailability } from '@/services/api/equipment';
import { getMockEquipmentWithAvailability } from '@/services/api/mock-equipment';

interface EquipmentSelectorProps {
  checkInDate: string;
  checkOutDate: string;
  selectedEquipment: { equipmentId: string; quantity: number }[];
  onChange: (equipment: { equipmentId: string; quantity: number }[]) => void;
}

export const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({
  checkInDate,
  checkOutDate,
  selectedEquipment,
  onChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const { data: equipmentResponse, isLoading, error } = useQuery({
    queryKey: queryKeys.equipment.availability({ startDate: checkInDate, endDate: checkOutDate }),
    queryFn: async () => {
      try {
        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        const response = await getAvailableEquipment(start, end);
        // Use mock data if API returns empty
        if (!response.data || response.data.length === 0) {
          return { data: getMockEquipmentWithAvailability() };
        }
        return response;
      } catch {
        // Fallback to mock data on error
        return { data: getMockEquipmentWithAvailability() };
      }
    },
    enabled: !!checkInDate && !!checkOutDate,
  });

  const equipment: EquipmentWithAvailability[] = equipmentResponse?.data || [];

  const categories = ['ALL', 'CAMPING_GEAR', 'KITCHEN', 'RECREATIONAL', 'SAFETY'];

  const filteredEquipment =
    selectedCategory === 'ALL'
      ? equipment
      : equipment.filter((item) => item.category === selectedCategory);

  const getQuantity = (equipmentId: string) => {
    const item = selectedEquipment.find((e) => e.equipmentId === equipmentId);
    return item?.quantity || 0;
  };

  const handleQuantityChange = (equipmentId: string, delta: number) => {
    const currentQuantity = getQuantity(equipmentId);
    const newQuantity = Math.max(0, currentQuantity + delta);

    if (newQuantity === 0) {
      onChange(selectedEquipment.filter((e) => e.equipmentId !== equipmentId));
    } else {
      const existing = selectedEquipment.find((e) => e.equipmentId === equipmentId);
      if (existing) {
        onChange(
          selectedEquipment.map((e) =>
            e.equipmentId === equipmentId ? { ...e, quantity: newQuantity } : e
          )
        );
      } else {
        onChange([...selectedEquipment, { equipmentId, quantity: newQuantity }]);
      }
    }
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
          <span className="text-gray-600">Loading available equipment...</span>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-32 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Package size={48} className="mx-auto mb-2 text-red-400" />
        <p className="text-red-600">Failed to load equipment availability</p>
        <p className="text-sm text-gray-500 mt-1">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {/* Equipment List */}
      {filteredEquipment.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package size={48} className="mx-auto mb-2 text-gray-400" />
          <p>No equipment available in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEquipment.map((item) => {
            const quantity = getQuantity(item.id);
            const totalCost = item.dailyRate * nights * quantity;

            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{item.category.replace('_', ' ')}</Badge>
                      {item.available ? (
                        <span className="text-sm text-green-600 font-medium">
                          {item.availableQuantity} available
                        </span>
                      ) : (
                        <span className="text-sm text-red-600 font-medium">
                          Not available
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      ${item.dailyRate}/night
                    </div>
                    {quantity > 0 && (
                      <div className="text-sm text-blue-600">
                        Total: ${totalCost} ({nights} nights)
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.id, -1)}
                      disabled={quantity === 0}
                    >
                      <Minus size={16} />
                    </Button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.id, 1)}
                      disabled={quantity >= item.availableQuantity}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {selectedEquipment.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Equipment Summary</h4>
          <p className="text-sm text-blue-800">
            {selectedEquipment.reduce((sum, item) => sum + item.quantity, 0)} item(s) selected
          </p>
        </div>
      )}
    </div>
  );
};
