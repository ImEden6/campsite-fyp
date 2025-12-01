/**
 * SiteAvailabilityGrid Component
 * Displays available sites in a grid with filters
 */

import { useState, useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import type { Site, SiteType } from '@/types';
import { SiteCard } from './SiteCard';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

interface SiteAvailabilityGridProps {
  sites: Site[];
  loading?: boolean;
  onSiteSelect?: (site: Site) => void;
  onSiteViewDetails?: (site: Site) => void;
}

interface Filters {
  type: SiteType | 'ALL';
  minPrice: string;
  maxPrice: string;
  minCapacity: string;
  hasElectricity: boolean;
  hasWater: boolean;
  hasSewer: boolean;
  hasWifi: boolean;
  isPetFriendly: boolean;
  searchTerm: string;
}

const initialFilters: Filters = {
  type: 'ALL',
  minPrice: '',
  maxPrice: '',
  minCapacity: '',
  hasElectricity: false,
  hasWater: false,
  hasSewer: false,
  hasWifi: false,
  isPetFriendly: false,
  searchTerm: '',
};

export const SiteAvailabilityGrid: React.FC<SiteAvailabilityGridProps> = ({
  sites,
  loading = false,
  onSiteSelect,
  onSiteViewDetails,
}) => {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  // Filter sites based on current filters
  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      // Type filter
      if (filters.type !== 'ALL' && site.type !== filters.type) {
        return false;
      }

      // Price filter
      if (filters.minPrice && site.basePrice < parseFloat(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && site.basePrice > parseFloat(filters.maxPrice)) {
        return false;
      }

      // Capacity filter
      if (filters.minCapacity && site.capacity < parseInt(filters.minCapacity)) {
        return false;
      }

      // Amenity filters
      if (filters.hasElectricity && !site.hasElectricity) return false;
      if (filters.hasWater && !site.hasWater) return false;
      if (filters.hasSewer && !site.hasSewer) return false;
      if (filters.hasWifi && !site.hasWifi) return false;
      if (filters.isPetFriendly && !site.isPetFriendly) return false;

      // Search term
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesName = site.name.toLowerCase().includes(searchLower);
        const matchesDescription = site.description?.toLowerCase().includes(searchLower);
        const matchesAmenities = site.amenities.some((amenity) =>
          amenity.toLowerCase().includes(searchLower)
        );
        if (!matchesName && !matchesDescription && !matchesAmenities) {
          return false;
        }
      }

      return true;
    });
  }, [sites, filters]);

  const handleFilterChange = (key: keyof Filters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'ALL') count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.minCapacity) count++;
    if (filters.hasElectricity) count++;
    if (filters.hasWater) count++;
    if (filters.hasSewer) count++;
    if (filters.hasWifi) count++;
    if (filters.isPetFriendly) count++;
    if (filters.searchTerm) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search sites by name, description, or amenities..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" onClick={handleClearFilters} size="sm">
            <X size={16} />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Site Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Type
              </label>
              <Select
                value={filters.type}
                onChange={(value) => handleFilterChange('type', value as SiteType | 'ALL')}
                options={[
                  { value: 'ALL', label: 'All Types' },
                  { value: 'TENT', label: 'Tent Sites' },
                  { value: 'RV', label: 'RV Sites' },
                  { value: 'CABIN', label: 'Cabins' },
                ]}
              />
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <Input
                type="number"
                placeholder="$0"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                min="0"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <Input
                type="number"
                placeholder="$1000"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                min="0"
              />
            </div>

            {/* Min Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Capacity
              </label>
              <Input
                type="number"
                placeholder="1"
                value={filters.minCapacity}
                onChange={(e) => handleFilterChange('minCapacity', e.target.value)}
                min="1"
              />
            </div>
          </div>

          {/* Amenity Checkboxes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amenities
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasElectricity}
                  onChange={(e) => handleFilterChange('hasElectricity', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Electricity</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasWater}
                  onChange={(e) => handleFilterChange('hasWater', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Water</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasSewer}
                  onChange={(e) => handleFilterChange('hasSewer', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Sewer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasWifi}
                  onChange={(e) => handleFilterChange('hasWifi', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">WiFi</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isPetFriendly}
                  onChange={(e) => handleFilterChange('isPetFriendly', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Pet Friendly</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredSites.length} of {sites.length} sites
      </div>

      {/* Sites Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-t-lg" />
              <div className="bg-white p-4 rounded-b-lg border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No sites found matching your criteria</p>
          <Button variant="outline" onClick={handleClearFilters} className="mt-4">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              isAvailable={site.status === 'AVAILABLE'}
              onSelect={onSiteSelect}
              onViewDetails={onSiteViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};
