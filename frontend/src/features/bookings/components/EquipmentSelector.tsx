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
      // Use provided dates or default to next 7 days if not set
      const start = checkInDate ? new Date(checkInDate) : new Date();
      const end = checkOutDate ? new Date(checkOutDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      // getAvailableEquipment already handles mock data fallback
      return await getAvailableEquipment(start, end);
    },
    // Always enabled - use default dates if not provided
    enabled: true,
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
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mr-2" size={24} />
          <span className="text-gray-600 dark:text-gray-400">Loading available equipment...</span>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Package size={48} className="mx-auto mb-2 text-red-400 dark:text-red-500" />
        <p className="text-red-600 dark:text-red-400">Failed to load equipment availability</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Notice */}
      {(!checkInDate || !checkOutDate) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Please select check-in and check-out dates for accurate availability and pricing.
            Showing equipment with estimated availability.
          </p>
        </div>
      )}

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
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Package size={48} className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
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
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{item.category.replace('_', ' ')}</Badge>
                      {item.available ? (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                          {item.availableQuantity} available
                        </span>
                      ) : (
                        <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                          Not available
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      ${item.dailyRate}/night
                    </div>
                    {quantity > 0 && (
                      <div className="text-sm text-blue-600 dark:text-blue-400">
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
                    <span className="w-8 text-center font-medium text-gray-900 dark:text-gray-100">{quantity}</span>
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
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Equipment Summary</h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {selectedEquipment.reduce((sum, item) => sum + item.quantity, 0)} item(s) selected
          </p>
        </div>
      )}
    </div>
  );
};
