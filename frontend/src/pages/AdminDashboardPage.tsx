/**
 * AdminDashboardPage
 * Map management dashboard for administrators
 */

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import SiteFormModal from '@/components/admin/SiteFormModal';
import { useLazyFramerMotion } from '@/hooks/useLazyFramerMotion';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Settings,
  Eye,
  Home,
  Tent,
  Truck,
  Calendar,
  DollarSign,
  TrendingUp,
  Map,
  RefreshCw,
  Users,
  BarChart3,
} from 'lucide-react';
import { getSites, deleteSite } from '@/services/api/sites';
import { getDashboardMetrics } from '@/services/api/analytics';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

import { SiteType, SiteStatus, UserRole } from '@/types';
import type { Site } from '@/types';
import { formatCurrency, CURRENCY_SYMBOL } from '@/utils/currency';

interface MapBoxProps {
  type: SiteType;
  sites: Site[];
  isAdmin: boolean;
  onAddSite: () => void;
  onEditSite: (site: Site) => void;
  onDeleteSite: (siteId: string) => void;
  onViewMap: () => void;
}

const MapBox: React.FC<MapBoxProps> = ({
  type,
  sites,
  isAdmin,
  onAddSite,
  onEditSite,
  onDeleteSite,
  onViewMap
}) => {
  const { motion } = useLazyFramerMotion();
  const MotionDiv = motion?.div || 'div';

  const typeConfig: Record<SiteType, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; title: string }> = {
    [SiteType.TENT]: {
      icon: Tent,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      title: 'Tent Sites'
    },
    [SiteType.RV]: {
      icon: Truck,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      title: 'RV Sites'
    },
    [SiteType.CABIN]: {
      icon: Home,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      title: 'Cabins'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const availableSites = sites.filter(s => s.status === 'AVAILABLE').length;
  const occupiedSites = sites.filter(s => s.status === 'OCCUPIED').length;
  const maintenanceSites = sites.filter(s => s.status === 'MAINTENANCE').length;

  return (
    <MotionDiv
      {...(motion ? { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } } : {})}
    >
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${config.color}`} />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-primary-100">{config.title}</h2>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">{sites.length} total sites</p>
              </div>
            </div>
            <button
              onClick={onViewMap}
              className="p-2 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-800/40 rounded-lg transition-colors"
              title="View Map"
            >
              <Eye className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 grid grid-cols-3 gap-3 border-b border-secondary-200 dark:border-secondary-700 bg-white/30 dark:bg-night-surface/30">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{availableSites}</p>
            <p className="text-xs text-secondary-600 dark:text-secondary-400">Available</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{occupiedSites}</p>
            <p className="text-xs text-secondary-600 dark:text-secondary-400">Occupied</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{maintenanceSites}</p>
            <p className="text-xs text-secondary-600 dark:text-secondary-400">Maintenance</p>
          </div>
        </div>

        {/* Sites List */}
        <div className="p-4 max-h-80 overflow-y-auto">
          {sites.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-secondary-100 dark:bg-night-surface-alt flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-8 h-8 text-secondary-400" />
              </div>
              <p className="text-secondary-600 dark:text-secondary-400">No sites yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sites.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between p-3 bg-white/50 dark:bg-night-surface/50 rounded-lg hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-primary-100">{site.name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${site.status === 'AVAILABLE' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' :
                        site.status === 'OCCUPIED' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400'
                        }`}>
                        {site.status}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      Capacity: {site.capacity} | {CURRENCY_SYMBOL}{site.basePrice}/night
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEditSite(site)}
                        className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        title="Edit Site"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteSite(site.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Site"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {isAdmin && (
          <div className="p-4 border-t border-secondary-200 dark:border-secondary-700">
            <Button
              onClick={onAddSite}
              className="w-full"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New {type === SiteType.TENT ? 'Tent Site' : type === SiteType.RV ? 'RV Site' : 'Cabin'}
            </Button>
          </div>
        )}
                  </Card>
    </MotionDiv>
  );
};

export const AdminDashboardPage: React.FC = () => {
  const { motion } = useLazyFramerMotion();
  const MotionDiv = motion?.div || 'div';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === UserRole.ADMIN;
  const isStaff = user?.role === UserRole.STAFF;
  const isManager = user?.role === UserRole.MANAGER;
  const dashboardTitle = isStaff ? 'Staff Dashboard' : isManager ? 'Manager Dashboard' : 'Admin Dashboard';

  // Fetch all sites (with mock data fallback)
  const { data: sites = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['sites'],
    queryFn: () => getSites(),
  });

  // Group sites by type
  const tentSites = sites.filter(s => s.type === SiteType.TENT);
  const rvSites = sites.filter(s => s.type === SiteType.RV);
  const cabinSites = sites.filter(s => s.type === SiteType.CABIN);

  // Calculate metrics for site counts
  const totalSites = sites.length;
  const occupiedSites = sites.filter(s => s.status === SiteStatus.OCCUPIED).length;

  // Fetch dashboard analytics metrics from API
  const { data: analyticsMetrics } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => getDashboardMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Default metrics if API hasn't loaded yet
  const defaultMetrics = {
    totalRevenue: 0,
    revenueChange: 0,
    occupancyRate: 0,
    occupancyChange: 0,
    activeBookings: 0,
    bookingsChange: 0,
    totalCustomers: 0,
    customersChange: 0,
    averageBookingValue: 0,
    averageStayDuration: 0,
  };

  const metrics = analyticsMetrics ?? defaultMetrics;

  // Stats for the cards - now using analytics data from API
  const allStats = [
    {
      name: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      icon: DollarSign,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      subtext: `${metrics.revenueChange >= 0 ? '+' : ''}${metrics.revenueChange.toFixed(1)}% from last period`,
      change: metrics.revenueChange,
      staffVisible: false,
    },
    {
      name: 'Occupancy Rate',
      value: `${metrics.occupancyRate.toFixed(1)}%`,
      icon: TrendingUp,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      subtext: `${occupiedSites} of ${totalSites} sites`,
      change: metrics.occupancyChange,
      staffVisible: true,
    },
    {
      name: 'Active Bookings',
      value: metrics.activeBookings,
      icon: Calendar,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      subtext: `${metrics.bookingsChange >= 0 ? '+' : ''}${metrics.bookingsChange.toFixed(1)}% from last period`,
      change: metrics.bookingsChange,
      staffVisible: true,
    },
    {
      name: 'Total Customers',
      value: metrics.totalCustomers.toLocaleString(),
      icon: Users,
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      subtext: `${metrics.customersChange >= 0 ? '+' : ''}${metrics.customersChange.toFixed(1)}% growth`,
      change: metrics.customersChange,
      staffVisible: true,
    }
  ];

  const stats = isStaff ? allStats.filter(s => s.staffVisible) : allStats;

  // Modal state
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [defaultSiteType, setDefaultSiteType] = useState<SiteType>(SiteType.TENT);

  const handleAddSite = (type: SiteType) => {
    setEditingSite(null);
    setDefaultSiteType(type);
    setSiteModalOpen(true);
  };

  const handleEditSite = (site: Site) => {
    setEditingSite(site);
    setSiteModalOpen(true);
  };

  const handleModalClose = () => {
    setSiteModalOpen(false);
    setEditingSite(null);
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site?')) return;

    try {
      await deleteSite(siteId);
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    } catch (error) {
      console.error('Failed to delete site:', error);
      alert('Failed to delete site');
    }
  };

  const handleViewMap = (_type: SiteType) => {
    // Navigate to maps list
    navigate('/admin/maps');
  };

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 px-4 lg:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-primary-100">{dashboardTitle}</h1>
            <p className="text-secondary-600 dark:text-secondary-400">Overview and site management</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {!isStaff && (
              <Button
                variant="outline"
                onClick={() => navigate('/admin/analytics')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => navigate('/admin/maps')}
              >
                <Map className="w-4 h-4 mr-2" />
                Maps
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate('/admin/settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <RefreshCw className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-secondary-600 dark:text-secondary-400">Loading dashboard...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Stats Grid */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${stats.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6`}>
              {stats.map((stat, index) => (
                <MotionDiv
                  key={stat.name}
                  {...(motion ? {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.3, delay: index * 0.1 }
                  } : {})}
                >
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">{stat.name}</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <p className="text-2xl font-bold text-gray-900 dark:text-primary-100">{stat.value}</p>
                          {stat.change !== undefined && (
                            <span className={`flex items-center text-xs font-medium ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                              <TrendingUp className={`w-3 h-3 mr-0.5 ${stat.change < 0 ? 'rotate-180' : ''}`} />
                              {Math.abs(stat.change).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{stat.subtext}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                        <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                      </div>
                    </div>
      </Card>
                </MotionDiv>
              ))}
            </div>

            {/* Map Boxes Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MapBox
                type={SiteType.TENT}
                sites={tentSites}
                isAdmin={isAdmin}
                onAddSite={() => handleAddSite(SiteType.TENT)}
                onEditSite={handleEditSite}
                onDeleteSite={handleDeleteSite}
                onViewMap={() => handleViewMap(SiteType.TENT)}
              />
              <MapBox
                type={SiteType.RV}
                sites={rvSites}
                isAdmin={isAdmin}
                onAddSite={() => handleAddSite(SiteType.RV)}
                onEditSite={handleEditSite}
                onDeleteSite={handleDeleteSite}
                onViewMap={() => handleViewMap(SiteType.RV)}
              />
              <MapBox
                type={SiteType.CABIN}
                sites={cabinSites}
                isAdmin={isAdmin}
                onAddSite={() => handleAddSite(SiteType.CABIN)}
                onEditSite={handleEditSite}
                onDeleteSite={handleDeleteSite}
                onViewMap={() => handleViewMap(SiteType.CABIN)}
              />
            </div>
          </>
        )}
      </div>

      {/* Site Form Modal */}
      <SiteFormModal
        isOpen={siteModalOpen}
        onClose={handleModalClose}
        editingSite={editingSite}
        defaultType={defaultSiteType}
      />
    </div>
  );
};
