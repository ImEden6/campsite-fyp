/**
 * SiteList Component
 * Displays a list of sites with filters and search
 */

import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import type { Site, SiteType, SiteStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SiteCard } from './SiteCard';
import { Card } from '@/components/ui/Card';

interface SiteListProps {
  sites: Site[];
  isLoading?: boolean;
  onCreateSite?: () => void;
  onEditSite?: (site: Site) => void;
  onDeleteSite?: (siteId: string) => void;
  showActions?: boolean;
}

interface SiteFilters {
  searchTerm: string;
  type: SiteType | 'ALL';
  status: SiteStatus | 'ALL';
  hasElectricity: boolean | null;
  hasWater: boolean | null;
  hasSewer: boolean | null;
  isPetFriendly: boolean | null;
  minPrice: string;
  maxPrice: string;
}

export const SiteList: React.FC<SiteListProps> = ({
  sites,
  isLoading = false,
  onCreateSite,
  onEditSite,
  onDeleteSite: _onDeleteSite,
  showActions = true,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SiteFilters>({
    searchTerm: '',
    type: 'ALL',
    status: 'ALL',
    hasElectricity: null,
    hasWater: null,
    hasSewer: null,
    isPetFriendly: null,
    minPrice: '',
    maxPrice: '',
  });

  const handleFilterChange = (key: keyof SiteFilters, value: string | boolean | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      type: 'ALL',
      status: 'ALL',
      hasElectricity: null,
      hasWater: null,
      hasSewer: null,
      isPetFriendly: null,
      minPrice: '',
      maxPrice: '',
    });
  };

  const filteredSites = sites.filter((site) => {
    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        site.name.toLowerCase().includes(searchLower) ||
        site.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filters.type !== 'ALL' && site.type !== filters.type) {
      return false;
    }

    // Status filter
    if (filters.status !== 'ALL' && site.status !== filters.status) {
      return false;
    }

    // Amenity filters
    if (filters.hasElectricity !== null && site.hasElectricity !== filters.hasElectricity) {
      return false;
    }
    if (filters.hasWater !== null && site.hasWater !== filters.hasWater) {
      return false;
    }
    if (filters.hasSewer !== null && site.hasSewer !== filters.hasSewer) {
      return false;
    }
    if (filters.isPetFriendly !== null && site.isPetFriendly !== filters.isPetFriendly) {
      return false;
    }

    // Price range filter
    if (filters.minPrice && site.basePrice < parseFloat(filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice && site.basePrice > parseFloat(filters.maxPrice)) {
      return false;
    }

    return true;
  });

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'searchTerm') return false;
    if (key === 'type' || key === 'status') return value !== 'ALL';
    if (key === 'minPrice' || key === 'maxPrice') return value !== '';
    return value !== null;
  }).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Site Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredSites.length} of {sites.length} sites
          </p>
        </div>
        {onCreateSite && (
          <Button onClick={onCreateSite} className="flex items-center gap-2">
            <Plus size={20} />
            Add New Site
          </Button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search sites by name or description..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={20} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value as SiteType | 'ALL')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="TENT">Tent</option>
                  <option value="RV">RV</option>
                  <option value="CABIN">Cabin</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value as SiteStatus | 'ALL')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
              </div>

              {/* Price Range */}
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
                  step="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price
                </label>
                <Input
                  type="number"
                  placeholder="$500"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  min="0"
                  step="10"
                />
              </div>
            </div>

            {/* Amenity Filters */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amenities
              </label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasElectricity === true}
                    onChange={(e) =>
                      handleFilterChange('hasElectricity', e.target.checked ? true : null)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Electricity</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasWater === true}
                    onChange={(e) =>
                      handleFilterChange('hasWater', e.target.checked ? true : null)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Water</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasSewer === true}
                    onChange={(e) =>
                      handleFilterChange('hasSewer', e.target.checked ? true : null)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Sewer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.isPetFriendly === true}
                    onChange={(e) =>
                      handleFilterChange('isPetFriendly', e.target.checked ? true : null)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Pet Friendly</span>
                </label>
              </div>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" onClick={clearFilters} size="sm">
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Site Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-96 animate-pulse bg-gray-100">
              <div className="h-full" />
            </Card>
          ))}
        </div>
      ) : filteredSites.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 text-lg">No sites found matching your criteria</p>
          {activeFilterCount > 0 && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              showActions={showActions}
              onViewDetails={onEditSite}
            />
          ))}
        </div>
      )}
    </div>
  );
};
