/**
 * EquipmentCatalog Component
 * Browse and filter equipment with grid/list views
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEquipment } from '@/services/api/equipment';
import { queryKeys } from '@/config/query-keys';
import type { Equipment, EquipmentFilters } from '@/types';
import { EquipmentCard } from './EquipmentCard';
import { Button } from '@/components/ui/Button';
import { EquipmentFilters as EquipmentFilterBar } from './EquipmentFilters';
import { LayoutGrid, List } from 'lucide-react';

interface EquipmentCatalogProps {
  onSelectEquipment?: (equipment: Equipment) => void;
  onEditEquipment?: (equipment: Equipment) => void;
  showActions?: boolean;
  initialFilters?: EquipmentFilters;
}

type ViewMode = 'grid' | 'list';

export const EquipmentCatalog: React.FC<EquipmentCatalogProps> = ({
  onSelectEquipment,
  onEditEquipment,
  showActions = false,
  initialFilters,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<EquipmentFilters>(initialFilters || {});
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.equipment.list({ ...filters, search: searchTerm }),
    queryFn: () => getEquipment({ ...filters, search: searchTerm }, page, 20),
  });

  const handleFilterChange = (key: keyof EquipmentFilters, value: string | number | boolean | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Equipment Catalog</h2>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={20} />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List size={20} />
          </Button>
        </div>
      </div>

      <EquipmentFilterBar
        filters={filters}
        searchTerm={searchTerm}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onClear={clearFilters}
      />

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load equipment. Please try again.</p>
        </div>
      )}

      {!isLoading && !error && data && (
        <>
          {data.data.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No equipment found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
              {data.data.map((equipment) => (
                <EquipmentCard
                  key={equipment.id}
                  equipment={equipment}
                  onSelect={onSelectEquipment}
                  onEdit={onEditEquipment}
                  showActions={showActions}
                />
              ))}
            </div>
          )}

          {data.pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {data.pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                disabled={page === data.pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
