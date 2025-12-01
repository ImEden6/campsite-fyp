/**
 * EquipmentCatalog Component
 * Browse and filter equipment with grid/list views
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEquipment } from '@/services/api/equipment';
import { queryKeys } from '@/config/query-keys';
import type { Equipment, EquipmentFilters } from '@/types';
import { EquipmentCard } from './EquipmentCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

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

  // Fetch equipment
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

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'CAMPING_GEAR', label: 'Camping Gear' },
    { value: 'RECREATIONAL', label: 'Recreational' },
    { value: 'KITCHEN', label: 'Kitchen' },
    { value: 'SAFETY', label: 'Safety' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'RENTED', label: 'Rented' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Equipment Catalog</h2>
        
        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <Input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <Select
            value={
              Array.isArray(filters.category)
                ? filters.category[0] || ''
                : filters.category || ''
            }
            onChange={(value) =>
              handleFilterChange('category', value || '')
            }
            options={categoryOptions}
          />

          {/* Status Filter */}
          <Select
            value={
              Array.isArray(filters.status)
                ? filters.status[0] || ''
                : filters.status || ''
            }
            onChange={(value) =>
              handleFilterChange('status', value || '')
            }
            options={statusOptions}
          />
        </div>

        {/* Additional Filters */}
        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.availableOnly || false}
              onChange={(e) =>
                handleFilterChange('availableOnly', e.target.checked)
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Available only</span>
          </label>

          {(filters.category || filters.status || filters.availableOnly || searchTerm) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Failed to load equipment. Please try again.
          </p>
        </div>
      )}

      {/* Equipment Grid/List */}
      {!isLoading && !error && data && (
        <>
          {data.data.length === 0 ? (
            <div className="text-center py-12">
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No equipment found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or search term.
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }
            >
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

          {/* Pagination */}
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
