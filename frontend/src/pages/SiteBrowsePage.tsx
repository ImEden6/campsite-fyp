import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Grid, List, X, SlidersHorizontal, Zap, Droplet, Wifi, Heart } from 'lucide-react';
import { getSites } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';

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
    queryFn: () => getSites(),
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
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg">
      {/* Hero / Header Section */}
      <div className="bg-nature-surface border-b border-secondary-200/60 dark:bg-gray-900 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
            Find Your <span className="text-primary-600 dark:text-primary-400">Perfect Spot</span>
          </h1>
          <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl font-light">
            Discover over {sites.length}+ unique campsites nestled in nature. Filter by amenities, location, and style.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search sites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 rounded-xl border-secondary-200"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative border-secondary-200 rounded-xl"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-primary-600 text-white text-xs rounded-full shadow-sm">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          {/* Sidebar Filters (Desktop Sticky + Mobile Drawer) */}
          <div className={`
             lg:w-80 flex-shrink-0 lg:block
             ${showFilters ? 'block' : 'hidden'}
          `}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-secondary-200/60 dark:border-secondary-700 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary-500" />
                  Filters
                </h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-secondary-500 hover:text-primary-600 underline decoration-dotted underline-offset-2"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="space-y-8">
                {/* Search (Desktop only) */}
                <div className="hidden lg:block relative">
                  <label className="text-sm font-semibold text-secondary-700 mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search sites..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-10 text-sm bg-gray-50 border-secondary-200"
                    />
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-3 block">Site Type</label>
                  <div className="space-y-2">
                    {['all', SiteType.TENT, SiteType.RV, SiteType.CABIN].map((type) => (
                      <label key={type} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${typeFilter === type
                          ? 'bg-primary-600 border-primary-600'
                          : 'bg-white border-secondary-300 group-hover:border-primary-400'
                          }`}>
                          {typeFilter === type && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <input
                          type="radio"
                          className="hidden"
                          checked={typeFilter === type}
                          onChange={() => setTypeFilter(type as SiteType | 'all')}
                        />
                        <span className="text-secondary-600 dark:text-secondary-400 capitalize">
                          {type === 'all' ? 'All Types' : type.toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-3 block">Price Range / Night</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 text-xs">$</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full pl-6 pr-2 py-2 text-sm border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                    <span className="text-secondary-400">-</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 text-xs">$</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full pl-6 pr-2 py-2 text-sm border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-3 block">Amenities</label>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Electricity', state: hasElectricity, set: setHasElectricity, icon: Zap },
                      { label: 'Water', state: hasWater, set: setHasWater, icon: Droplet },
                      { label: 'Sewer', state: hasSewer, set: setHasSewer, icon: null },
                      { label: 'WiFi', state: hasWifi, set: setHasWifi, icon: Wifi },
                      { label: 'Pet Friendly', state: isPetFriendly, set: setIsPetFriendly, icon: Heart },
                    ].map((amenity) => (
                      <label key={amenity.label} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${amenity.state
                          ? 'bg-primary-600 border-primary-600'
                          : 'bg-white border-secondary-300 group-hover:border-primary-400'
                          }`}>
                          {amenity.state && <X className="w-3.5 h-3.5 text-white stroke-[3] transform rotate-45" />}
                          {/* Using rotated X as checkmark or Check icon would be better if imported */}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={amenity.state}
                          onChange={(e) => amenity.set(e.target.checked)}
                        />
                        <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
                          {amenity.icon && <amenity.icon className="w-3.5 h-3.5 opacity-70" />}
                          <span>{amenity.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Sort / View Toggle Header */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-secondary-600 dark:text-secondary-400">
                Showing <span className="font-bold text-gray-900 dark:text-gray-100">{filteredSites.length}</span> results
              </p>

              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-secondary-200 dark:border-secondary-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid'
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-secondary-400 hover:text-secondary-600'
                    }`}
                  title="Grid View"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list'
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-secondary-400 hover:text-secondary-600'
                    }`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Results Grid */}
            {isLoading ? (
              <div className="text-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-secondary-500">Loading amazing campsites...</p>
              </div>
            ) : sitesError ? (
              <div className="text-center py-12 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
                <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
                  Unable to load sites
                </p>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Please try refreshing the page or check your connection
                </p>
              </div>
            ) : filteredSites.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-secondary-200 border-dashed">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-50 mb-4">
                  <Search className="w-8 h-8 text-secondary-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                  No campsites found
                </h3>
                <p className="text-secondary-500 max-w-md mx-auto mb-6">
                  We couldn't find any sites directly matching your filters. Try removing some filters or expanding your search.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all border border-secondary-200/60 p-4 flex gap-6 cursor-pointer group"
                    onClick={() => handleSiteClick(site)}
                  >
                    {site.images && site.images.length > 0 && (
                      <div className="w-64 h-40 flex-shrink-0 rounded-xl overflow-hidden bg-secondary-100">
                        <img
                          src={site.images[0]}
                          alt={site.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{site.name}</h3>
                            <p className="text-sm text-secondary-500 flex items-center gap-1">
                              <span className="capitalize">{site.type.toLowerCase()}</span> • {site.size.length}x{site.size.width} {site.size.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary-600">${site.basePrice}</div>
                            <div className="text-xs text-secondary-400">per night</div>
                          </div>
                        </div>
                        <p className="text-secondary-600 mt-3 line-clamp-2 text-sm">{site.description}</p>
                      </div>

                      <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          handleSiteClick(site);
                        }}>
                          Details
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteBrowsePage;

