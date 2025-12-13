import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Grid, List, X } from 'lucide-react';
import { getSites } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';
import { mockSites } from '@/services/api/mock-sites';
import { SiteType, SiteStatus } from '@/types';
import type { Site } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SiteCard } from '@/features/sites/components/SiteCard';
import { useAuthStore } from '@/stores/authStore';

type ViewMode = 'grid' | 'list';

const SiteBrowsePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState<SiteType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SiteStatus | 'all'>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [hasElectricity, setHasElectricity] = useState(false);
  const [hasWater, setHasWater] = useState(false);
  const [hasSewer, setHasSewer] = useState(false);
  const [hasWifi, setHasWifi] = useState(false);
  const [isPetFriendly, setIsPetFriendly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const checkInDate = searchParams.get('checkIn') || '';
  const checkOutDate = searchParams.get('checkOut') || '';

  // Fetch sites
  const { data: sites = [], isLoading, error: sitesError } = useQuery({
    queryKey: queryKeys.sites.all,
    queryFn: async () => {
      try {
        const apiSites = await getSites();
        return apiSites.length > 0 ? apiSites : mockSites;
      } catch {
        return mockSites;
      }
    },
  });

  // Filter and sort sites
  const filteredSites = useMemo(() => {
    let result = [...sites];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (site) =>
          site.name.toLowerCase().includes(term) ||
          site.description?.toLowerCase().includes(term) ||
          site.amenities.some((a) => a.toLowerCase().includes(term))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((site) => site.type === typeFilter);
    }

    // Status filter (only show available sites to public)
    if (statusFilter !== 'all') {
      result = result.filter((site) => site.status === statusFilter);
    } else {
      // By default, only show available sites to public users
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        result = result.filter((site) => site.status === SiteStatus.AVAILABLE);
      }
    }

    // Price filters
    if (minPrice) {
      result = result.filter((site) => site.basePrice >= parseFloat(minPrice));
    }
    if (maxPrice) {
      result = result.filter((site) => site.basePrice <= parseFloat(maxPrice));
    }

    // Amenity filters
    if (hasElectricity) {
      result = result.filter((site) => site.hasElectricity);
    }
    if (hasWater) {
      result = result.filter((site) => site.hasWater);
    }
    if (hasSewer) {
      result = result.filter((site) => site.hasSewer);
    }
    if (hasWifi) {
      result = result.filter((site) => site.hasWifi);
    }
    if (isPetFriendly) {
      result = result.filter((site) => site.isPetFriendly);
    }

    return result;
  }, [
    sites,
    searchTerm,
    typeFilter,
    statusFilter,
    minPrice,
    maxPrice,
    hasElectricity,
    hasWater,
    hasSewer,
    hasWifi,
    isPetFriendly,
    isAuthenticated,
    user,
  ]);

  const handleSiteClick = (site: Site) => {
    navigate(`/sites/${site.id}${checkInDate ? `?checkIn=${checkInDate}&checkOut=${checkOutDate}` : ''}`);
  };

  const handleBookNow = (site: Site) => {
    if (isAuthenticated && user?.role === 'CUSTOMER') {
      navigate(`/customer/bookings/new?siteId=${site.id}${checkInDate ? `&checkIn=${checkInDate}&checkOut=${checkOutDate}` : ''}`);
    } else {
      navigate(`/book/guest?siteId=${site.id}${checkInDate ? `&checkIn=${checkInDate}&checkOut=${checkOutDate}` : ''}`);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setHasElectricity(false);
    setHasWater(false);
    setHasSewer(false);
    setHasWifi(false);
    setIsPetFriendly(false);
  };

  const activeFiltersCount = [
    searchTerm,
    typeFilter !== 'all',
    statusFilter !== 'all',
    minPrice,
    maxPrice,
    hasElectricity,
    hasWater,
    hasSewer,
    hasWifi,
    isPetFriendly,
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Browse Campsites
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find the perfect campsite for your next adventure
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
            aria-expanded={showFilters}
            aria-controls="filters-panel"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full" aria-label={`${activeFiltersCount} active filters`}>
                {activeFiltersCount}
              </span>
            )}
          </Button>
          <div className="flex gap-2 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div id="filters-panel" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6" role="region" aria-label="Filters">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
              <div className="flex gap-2">
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Site Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as SiteType | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Types</option>
                  <option value={SiteType.TENT}>Tent</option>
                  <option value={SiteType.RV}>RV</option>
                  <option value={SiteType.CABIN}>Cabin</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Price
                </label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Price
                </label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>

              {/* Amenities */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasElectricity}
                      onChange={(e) => setHasElectricity(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Electricity</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasWater}
                      onChange={(e) => setHasWater(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Water</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSewer}
                      onChange={(e) => setHasSewer(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sewer</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasWifi}
                      onChange={(e) => setHasWifi(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">WiFi</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPetFriendly}
                      onChange={(e) => setIsPetFriendly(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Pet Friendly</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredSites.length} of {sites.length} sites
        </p>
      </div>

      {/* Sites Grid/List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading sites...</p>
        </div>
      ) : sitesError ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
            Failed to load sites
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Please try refreshing the page
          </p>
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No sites found
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onViewDetails={handleSiteClick}
              onSelect={handleBookNow}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleSiteClick(site)}
            >
              <div className="flex gap-6">
                {site.images && site.images.length > 0 && (
                  <img
                    src={site.images[0]}
                    alt={site.name}
                    className="w-48 h-32 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {site.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {site.type} • Up to {site.capacity} guests
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        ${site.basePrice}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">per night</div>
                    </div>
                  </div>
                  {site.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {site.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleSiteClick(site);
                    }}>
                      View Details
                    </Button>
                    <Button size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleBookNow(site);
                    }}>
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SiteBrowsePage;

