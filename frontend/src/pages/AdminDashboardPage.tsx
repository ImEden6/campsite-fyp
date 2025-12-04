/**
 * AdminDashboardPage
 * Map management dashboard for administrators
 */

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  RefreshCw
} from 'lucide-react';
import { getSites, deleteSite } from '@/services/api/sites';
import { SiteType, SiteStatus } from '@/types';
import type { Site } from '@/types';

interface MapBoxProps {
  type: SiteType;
  sites: Site[];
  onAddSite: () => void;
  onEditSite: (site: Site) => void;
  onDeleteSite: (siteId: string) => void;
  onViewMap: () => void;
}

const MapBox: React.FC<MapBoxProps> = ({ 
  type, 
  sites, 
  onAddSite, 
  onEditSite, 
  onDeleteSite,
  onViewMap 
}) => {
  const { motion } = useLazyFramerMotion();
  const MotionDiv = motion?.div || 'div';
  
  const typeConfig: Record<SiteType, { icon: React.ComponentType<{ className?: string }>; color: string; borderColor: string; title: string }> = {
    [SiteType.TENT]: { 
      icon: Tent, 
      color: 'bg-green-500', 
      borderColor: 'border-green-200',
      title: 'Tent Sites' 
    },
    [SiteType.RV]: { 
      icon: Truck, 
      color: 'bg-blue-500', 
      borderColor: 'border-blue-200',
      title: 'RV Sites' 
    },
    [SiteType.CABIN]: { 
      icon: Home, 
      color: 'bg-orange-500', 
      borderColor: 'border-orange-200',
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
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${config.borderColor} dark:border-gray-700 overflow-hidden`}
    >
      {/* Header */}
      <div className={`${config.color} p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <Icon className="w-8 h-8 text-white" />
          <div>
            <h2 className="text-xl font-bold text-white">{config.title}</h2>
            <p className="text-white/90 text-sm">{sites.length} total sites</p>
          </div>
        </div>
        <button
          onClick={onViewMap}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          title="View Map"
        >
          <Eye className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-3 gap-3 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{availableSites}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Available</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{occupiedSites}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Occupied</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{maintenanceSites}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Maintenance</p>
        </div>
      </div>

      {/* Sites List */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {sites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No sites yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sites.map((site) => (
              <div
                key={site.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{site.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      site.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                      site.status === 'OCCUPIED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {site.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Capacity: {site.capacity} | ${site.basePrice}/night
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditSite(site)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Edit Site"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteSite(site.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete Site"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onAddSite}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${config.color} text-white rounded-lg font-medium hover:opacity-90 transition-opacity`}
        >
          <Plus className="w-5 h-5" />
          Add New {type === SiteType.TENT ? 'Tent Site' : type === SiteType.RV ? 'RV Site' : 'Cabin'}
        </button>
      </div>
    </MotionDiv>
  );
};

export const AdminDashboardPage: React.FC = () => {
  const { motion } = useLazyFramerMotion();
  const MotionDiv = motion?.div || 'div';
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch all sites
  const { data: sites = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['sites'],
    queryFn: () => getSites(),
  });

  // Group sites by type
  const tentSites = sites.filter(s => s.type === SiteType.TENT);
  const rvSites = sites.filter(s => s.type === SiteType.RV);
  const cabinSites = sites.filter(s => s.type === SiteType.CABIN);

  // Calculate metrics
  const totalSites = sites.length;
  const occupiedSites = sites.filter(s => s.status === SiteStatus.OCCUPIED).length;
  const availableSites = sites.filter(s => s.status === SiteStatus.AVAILABLE).length;
  const maintenanceSites = sites.filter(s => s.status === SiteStatus.MAINTENANCE).length;
  const occupancyRate = totalSites > 0 ? Math.round((occupiedSites / totalSites) * 100) : 0;
  const totalRevenue = sites.reduce((sum, site) => sum + (site.status === SiteStatus.OCCUPIED ? site.basePrice : 0), 0);

  // Stats for the cards
  const stats = [
    { 
      name: 'Total Revenue', 
      value: `$${totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'bg-blue-500',
      subtext: 'Current occupied sites'
    },
    { 
      name: 'Occupancy Rate', 
      value: `${occupancyRate}%`, 
      icon: TrendingUp, 
      color: 'bg-green-500',
      subtext: `${occupiedSites} of ${totalSites} sites`
    },
    { 
      name: 'Available Sites', 
      value: availableSites, 
      icon: Calendar, 
      color: 'bg-purple-500',
      subtext: 'Ready for booking'
    },
    { 
      name: 'Maintenance', 
      value: maintenanceSites, 
      icon: Settings, 
      color: 'bg-orange-500',
      subtext: 'Sites under maintenance'
    }
  ];

  const handleAddSite = (type: SiteType) => {
    // TODO: Open modal/dialog to add new site
    console.log('Add site:', type);
    alert(`Add new ${type} site - Feature coming soon!`);
  };

  const handleEditSite = (site: Site) => {
    // TODO: Open modal/dialog to edit site
    console.log('Edit site:', site);
    alert(`Edit ${site.name} - Feature coming soon!`);
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Overview and site management</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/admin/maps')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Map className="w-4 h-4" />
            Maps
          </button>
          <button
            onClick={() => navigate('/admin/settings')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <MotionDiv
                key={stat.name}
                {...(motion ? { 
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.3, delay: index * 0.1 }
                } : {})}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stat.subtext}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </MotionDiv>
            ))}
          </div>

          {/* Map Boxes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <MapBox
              type={SiteType.TENT}
              sites={tentSites}
              onAddSite={() => handleAddSite(SiteType.TENT)}
              onEditSite={handleEditSite}
              onDeleteSite={handleDeleteSite}
              onViewMap={() => handleViewMap(SiteType.TENT)}
            />
            <MapBox
              type={SiteType.RV}
              sites={rvSites}
              onAddSite={() => handleAddSite(SiteType.RV)}
              onEditSite={handleEditSite}
              onDeleteSite={handleDeleteSite}
              onViewMap={() => handleViewMap(SiteType.RV)}
            />
            <MapBox
              type={SiteType.CABIN}
              sites={cabinSites}
              onAddSite={() => handleAddSite(SiteType.CABIN)}
              onEditSite={handleEditSite}
              onDeleteSite={handleDeleteSite}
              onViewMap={() => handleViewMap(SiteType.CABIN)}
            />
          </div>
        </>
      )}
    </div>
  );
};
