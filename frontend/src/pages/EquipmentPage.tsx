import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Tent, Waves, Flame, Loader2 } from 'lucide-react';
import { getEquipment } from '@/services/api/equipment';
import { queryKeys } from '@/config/query-keys';
import type { Equipment } from '@/types';

// Icon mapping for equipment categories
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CAMPING_GEAR: Tent,
  RECREATIONAL: Waves,
  KITCHEN: Flame,
  SAFETY: Package,
  MAINTENANCE: Package,
};

const CATEGORY_COLORS: Record<string, string> = {
  CAMPING_GEAR: 'bg-green-500',
  RECREATIONAL: 'bg-cyan-500',
  KITCHEN: 'bg-orange-500',
  SAFETY: 'bg-red-500',
  MAINTENANCE: 'bg-gray-500',
};

// Default icon and color
const DEFAULT_ICON = Package;
const DEFAULT_COLOR = 'bg-blue-500';

interface EquipmentWithDisplay extends Equipment {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  available: number; // Calculated available quantity
}

const EquipmentPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.equipment.list({}),
    queryFn: () => getEquipment({}, 1, 100),
  });

  // Transform equipment data with display properties
  const equipment: EquipmentWithDisplay[] = useMemo(() => {
    if (!data?.data) return [];
    
    return data.data.map((item: Equipment) => ({
      ...item,
      icon: CATEGORY_ICONS[item.category] || DEFAULT_ICON,
      color: CATEGORY_COLORS[item.category] || DEFAULT_COLOR,
      // Use availableQuantity from API
      available: item.availableQuantity || 0,
    }));
  }, [data]);

  // Calculate statistics
  const totalItems = useMemo(
    () => equipment.reduce((sum, e) => sum + (e.quantity || 0), 0),
    [equipment]
  );
  
  const totalAvailable = useMemo(
    () => equipment.reduce((sum, e) => sum + e.available, 0),
    [equipment]
  );
  
  const categoryCount = useMemo(
    () => new Set(equipment.map((e) => e.category)).size,
    [equipment]
  );

  // Format category name for display
  const formatCategory = (category: string): string => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Equipment Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage rental equipment inventory and availability
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mr-2" size={24} />
          <span className="text-gray-600 dark:text-gray-400">Loading equipment...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Equipment Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage rental equipment inventory and availability
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Failed to load equipment</h3>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                {error instanceof Error ? error.message : 'An unexpected error occurred. Please try again later.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (equipment.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Equipment Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage rental equipment inventory and availability
          </p>
        </div>
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No equipment found</h3>
          <p className="text-gray-600 dark:text-gray-400">Get started by adding equipment to your inventory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Equipment Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage rental equipment inventory and availability
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalItems}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalAvailable}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{categoryCount}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 font-bold">#</span>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {equipment.map((item) => {
          const Icon = item.icon;
          const quantity = item.quantity || 0;
          const available = item.available;
          const availabilityPercentage = quantity > 0 ? (available / quantity) * 100 : 0;
          
          return (
            <div 
              key={item.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
              role="article"
              aria-label={`Equipment: ${item.name}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${item.color}`} aria-hidden="true">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatCategory(item.category)}</span>
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{item.description}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Quantity:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Available:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{available}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Daily Rate:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">${(item.dailyRate || 0).toFixed(2)}</span>
                </div>
                {item.weeklyRate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Weekly Rate:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">${item.weeklyRate.toFixed(2)}</span>
                  </div>
                )}
                {item.deposit && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Deposit:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">${item.deposit.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {quantity > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={available} aria-valuemin={0} aria-valuemax={quantity}>
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${availabilityPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                    {available} of {quantity} available
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EquipmentPage;
