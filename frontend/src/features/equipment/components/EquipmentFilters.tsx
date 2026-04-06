import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { EquipmentFilters } from '@/types';
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from '../utils/equipmentConstants';

interface EquipmentFiltersProps {
  filters: EquipmentFilters;
  searchTerm: string;
  onFilterChange: (key: keyof EquipmentFilters, value: string | number | boolean | string[]) => void;
  onSearch: (value: string) => void;
  onClear: () => void;
}

function normalizeFilterValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export const EquipmentFilters: React.FC<EquipmentFiltersProps> = ({
  filters,
  searchTerm,
  onFilterChange,
  onSearch,
  onClear,
}) => {
  const hasActiveFilters = filters.category || filters.status || filters.availableOnly || searchTerm;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <Input
            type="text"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <Select
          value={normalizeFilterValue(filters.category)}
          onChange={(value) => onFilterChange('category', value || '')}
          options={CATEGORY_OPTIONS}
        />

        <Select
          value={normalizeFilterValue(filters.status)}
          onChange={(value) => onFilterChange('status', value || '')}
          options={STATUS_OPTIONS}
        />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.availableOnly || false}
            onChange={(e) => onFilterChange('availableOnly', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Available only</span>
        </label>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};
