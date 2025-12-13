/**
 * SitesPage
 * Display and manage all campsite locations with full CRUD operations
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLazyFramerMotion } from '@/hooks/useLazyFramerMotion';
import {
  MapPin,
  Home,
  Tent,
  Truck,
  Search,
  Filter,
  Grid,
  List,
  Wifi,
  Zap,
  Droplets,
  PawPrint,
  Users,
  DollarSign,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { getSites, createSite, updateSite, deleteSite, uploadSiteImages } from '@/services/api/sites';
import { mockSites } from '@/services/api/mock-sites';
import { queryKeys } from '@/config/query-keys';
import { SiteType, SiteStatus } from '@/types';
import type { Site } from '@/types';
import { Button } from '@/components/ui/Button';
import { SiteForm, SiteFormData } from '@/features/sites/components/SiteForm';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

type ViewMode = 'grid' | 'list';
type PageMode = 'view' | 'create' | 'edit';
type SortOption = 'name' | 'price' | 'capacity' | 'status';

const SitesPage: React.FC = () => {
  const { motion } = useLazyFramerMotion();
  const MotionDiv = motion?.div || 'div';

  const [pageMode, setPageMode] = useState<PageMode>('view');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<SiteType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SiteStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  const isAdmin = user?.role === 'ADMIN';

  // Fetch sites with mock data fallback
  const { data: sites = [], isLoading } = useQuery({
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

  // Create site mutation
  const createMutation = useMutation({
    mutationFn: async (data: SiteFormData) => {
      const siteData: Partial<Site> = {
        name: data.name,
        type: data.type,
        status: data.status,
        capacity: data.capacity,
        description: data.description,
        basePrice: data.basePrice,
        maxVehicles: data.maxVehicles,
        maxTents: data.maxTents,
        isPetFriendly: data.isPetFriendly,
        hasElectricity: data.hasElectricity,
        hasWater: data.hasWater,
        hasSewer: data.hasSewer,
        hasWifi: data.hasWifi,
        amenities: data.amenities,
        size: data.size,
        location: data.location,
        images: [],
      };

      const newSite = await createSite(siteData);

      if (data.newImages.length > 0) {
        const imageUrls = await uploadSiteImages(newSite.id, data.newImages);
        return await updateSite(newSite.id, { images: imageUrls });
      }

      return newSite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
      showToast('Site created successfully', 'success');
      setPageMode('view');
      setSelectedSite(null);
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to create site', 'error');
    },
  });

  // Update site mutation
  const updateMutation = useMutation({
    mutationFn: async (data: SiteFormData) => {
      if (!selectedSite) throw new Error('No site selected');

      let imageUrls = [...data.images];
      if (data.newImages.length > 0) {
        const newImageUrls = await uploadSiteImages(selectedSite.id, data.newImages);
        imageUrls = [...imageUrls, ...newImageUrls];
      }

      const siteData: Partial<Site> = {
        name: data.name,
        type: data.type,
        status: data.status,
        capacity: data.capacity,
        description: data.description,
        basePrice: data.basePrice,
        maxVehicles: data.maxVehicles,
        maxTents: data.maxTents,
        isPetFriendly: data.isPetFriendly,
        hasElectricity: data.hasElectricity,
        hasWater: data.hasWater,
        hasSewer: data.hasSewer,
        hasWifi: data.hasWifi,
        amenities: data.amenities,
        size: data.size,
        location: data.location,
        images: imageUrls,
      };

      return await updateSite(selectedSite.id, siteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
      showToast('Site updated successfully', 'success');
      setPageMode('view');
      setSelectedSite(null);
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to update site', 'error');
    },
  });

  // Delete site mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
      showToast('Site deleted successfully', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to delete site', 'error');
    },
  });

  // Filter and sort sites
  const filteredSites = useMemo(() => {
    let result = [...sites];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        site =>
          site.name.toLowerCase().includes(term) ||
          site.description?.toLowerCase().includes(term) ||
          site.amenities.some(a => a.toLowerCase().includes(term))
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter(site => site.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(site => site.status === statusFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.basePrice - b.basePrice;
        case 'capacity':
          return b.capacity - a.capacity;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return result;
  }, [sites, searchTerm, typeFilter, statusFilter, sortBy]);

  // Site type configuration
  const typeConfig: Record<SiteType, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; label: string }> = {
    [SiteType.CABIN]: { icon: Home, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', label: 'Cabin' },
    [SiteType.RV]: { icon: Truck, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'RV Site' },
    [SiteType.TENT]: { icon: Tent, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'Tent Site' },
  };

  // Status configuration
  const statusConfig: Record<SiteStatus, { color: string; bgColor: string; label: string }> = {
    [SiteStatus.AVAILABLE]: { color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'Available' },
    [SiteStatus.OCCUPIED]: { color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'Occupied' },
    [SiteStatus.MAINTENANCE]: { color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Maintenance' },
    [SiteStatus.OUT_OF_SERVICE]: { color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700', label: 'Out of Service' },
  };

  // Calculate stats
  const stats = {
    total: sites.length,
    available: sites.filter(s => s.status === SiteStatus.AVAILABLE).length,
    occupied: sites.filter(s => s.status === SiteStatus.OCCUPIED).length,
    cabins: sites.filter(s => s.type === SiteType.CABIN).length,
    rv: sites.filter(s => s.type === SiteType.RV).length,
    tent: sites.filter(s => s.type === SiteType.TENT).length,
  };

  const handleCreateSite = () => {
    setSelectedSite(null);
    setPageMode('create');
  };

  const handleEditSite = (site: Site) => {
    setSelectedSite(site);
    setPageMode('edit');
  };

  const handleDeleteSite = async (siteId: string) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      await deleteMutation.mutateAsync(siteId);
    }
  };

  const handleSubmit = async (data: SiteFormData) => {
    if (pageMode === 'create') {
      await createMutation.mutateAsync(data);
    } else if (pageMode === 'edit') {
      await updateMutation.mutateAsync(data);
    }
  };

  const handleCancel = () => {
    setPageMode('view');
    setSelectedSite(null);
  };

  const SiteCard: React.FC<{ site: Site; index: number }> = ({ site, index }) => {
    const config = typeConfig[site.type];
    const status = statusConfig[site.status];
    const Icon = config.icon;

    return (
      <MotionDiv
        {...(motion ? {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3, delay: index * 0.05 }
        } : {})}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 group relative"
      >
        {/* Image/Icon Header */}
        <div className={`h-32 ${config.bgColor} relative flex items-center justify-center`}>
          <Icon className={`w-16 h-16 ${config.color} opacity-50 group-hover:scale-110 transition-transform`} />
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.color}`}>
              {config.label}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
              {status.label}
            </span>
          </div>
          {isAdmin && (
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEditSite(site)}
                className="p-1.5 bg-white dark:bg-gray-800 rounded-md shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                title="Edit site"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteSite(site.id)}
                className="p-1.5 bg-white dark:bg-gray-800 rounded-md shadow-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                title="Delete site"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {site.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {site.description || 'No description available'}
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-3">
            {site.hasWifi && (
              <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <Wifi className="w-3 h-3" /> WiFi
              </span>
            )}
            {site.hasElectricity && (
              <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <Zap className="w-3 h-3" /> Electric
              </span>
            )}
            {site.hasWater && (
              <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <Droplets className="w-3 h-3" /> Water
              </span>
            )}
            {site.isPetFriendly && (
              <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <PawPrint className="w-3 h-3" /> Pets OK
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span className="text-sm">Up to {site.capacity}</span>
            </div>
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
              <DollarSign className="w-4 h-4" />
              <span>{site.basePrice}/night</span>
            </div>
          </div>
        </div>
      </MotionDiv>
    );
  };

  const SiteRow: React.FC<{ site: Site; index: number }> = ({ site, index }) => {
    const config = typeConfig[site.type];
    const status = statusConfig[site.status];
    const Icon = config.icon;

    return (
      <MotionDiv
        {...(motion ? {
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          transition: { duration: 0.2, delay: index * 0.03 }
        } : {})}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow group"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${config.bgColor}`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {site.name}
              </h3>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {site.description || 'No description'}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {site.hasWifi && <Wifi className="w-4 h-4" />}
              {site.hasElectricity && <Zap className="w-4 h-4" />}
              {site.hasWater && <Droplets className="w-4 h-4" />}
              {site.isPetFriendly && <PawPrint className="w-4 h-4" />}
            </div>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span className="text-sm">{site.capacity}</span>
            </div>
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold min-w-[80px] justify-end">
              <DollarSign className="w-4 h-4" />
              <span>{site.basePrice}/night</span>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleEditSite(site)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Edit site"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSite(site.id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Delete site"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </MotionDiv>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading sites...</p>
        </div>
      </div>
    );
  }

  // Show form view for create/edit
  if (pageMode === 'create' || pageMode === 'edit') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sites
        </Button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {pageMode === 'create' ? 'Create New Site' : 'Edit Site'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {pageMode === 'create'
              ? 'Add a new campsite to your inventory'
              : 'Update site information and settings'}
          </p>
        </div>

        <SiteForm
          site={selectedSite || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  // Show main view
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Sites Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and view all {stats.total} campsite locations
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleCreateSite}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Site
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Sites</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.available}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.occupied}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Occupied</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.cabins}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cabins</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.rv}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">RV Sites</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.tent}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Tent Sites</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded text-gray-700 dark:text-gray-200 ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              title="Grid view"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded text-gray-700 dark:text-gray-200 ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              title="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Site Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as SiteType | 'all')}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Types</option>
                <option value={SiteType.CABIN}>Cabins</option>
                <option value={SiteType.RV}>RV Sites</option>
                <option value={SiteType.TENT}>Tent Sites</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SiteStatus | 'all')}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Statuses</option>
                <option value={SiteStatus.AVAILABLE}>Available</option>
                <option value={SiteStatus.OCCUPIED}>Occupied</option>
                <option value={SiteStatus.MAINTENANCE}>Maintenance</option>
                <option value={SiteStatus.OUT_OF_SERVICE}>Out of Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="capacity">Capacity</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Showing {filteredSites.length} of {sites.length} sites
      </p>

      {/* Sites Grid/List */}
      {filteredSites.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <MapPin className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No sites found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSites.map((site, index) => (
            <SiteCard key={site.id} site={site} index={index} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSites.map((site, index) => (
            <SiteRow key={site.id} site={site} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SitesPage;
