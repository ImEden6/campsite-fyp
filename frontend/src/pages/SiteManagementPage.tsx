/**
 * SiteManagementPage
 * Admin page for managing campsites
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { getSites, createSite, updateSite, deleteSite, uploadSiteImages } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';
import { SiteList } from '@/features/sites/components/SiteList';
import { SiteForm, SiteFormData } from '@/features/sites/components/SiteForm';
import type { Site } from '@/types';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

type ViewMode = 'list' | 'create' | 'edit';

export const SiteManagementPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN';

  // Fetch sites
  const { data: sites = [], isLoading } = useQuery({
    queryKey: queryKeys.sites.all,
    queryFn: () => getSites(),
  });

  // Create site mutation
  const createMutation = useMutation({
    mutationFn: async (data: SiteFormData) => {
      // Create site first
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

      // Upload images if any
      if (data.newImages.length > 0) {
        const imageUrls = await uploadSiteImages(newSite.id, data.newImages);
        // Update site with image URLs
        return await updateSite(newSite.id, { images: imageUrls });
      }

      return newSite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
      showToast('Site created successfully', 'success');
      setViewMode('list');
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to create site', 'error');
    },
  });

  // Update site mutation
  const updateMutation = useMutation({
    mutationFn: async (data: SiteFormData) => {
      if (!selectedSite) throw new Error('No site selected');

      // Upload new images if any
      let imageUrls = [...data.images];
      if (data.newImages.length > 0) {
        const newImageUrls = await uploadSiteImages(selectedSite.id, data.newImages);
        imageUrls = [...imageUrls, ...newImageUrls];
      }

      // Update site
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
      setViewMode('list');
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

  const handleCreateSite = () => {
    setSelectedSite(null);
    setViewMode('create');
  };

  const handleEditSite = (site: Site) => {
    setSelectedSite(site);
    setViewMode('edit');
  };

  const handleDeleteSite = async (siteId: string) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      await deleteMutation.mutateAsync(siteId);
    }
  };

  const handleSubmit = async (data: SiteFormData) => {
    if (viewMode === 'create') {
      await createMutation.mutateAsync(data);
    } else if (viewMode === 'edit') {
      await updateMutation.mutateAsync(data);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedSite(null);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {viewMode === 'list' ? (
        <SiteList
          sites={sites}
          isLoading={isLoading}
          onCreateSite={handleCreateSite}
          onEditSite={handleEditSite}
          onDeleteSite={handleDeleteSite}
          showActions={true}
        />
      ) : (
        <div>
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Sites
          </Button>

          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {viewMode === 'create' ? 'Create New Site' : 'Edit Site'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {viewMode === 'create'
                ? 'Add a new campsite to your inventory'
                : 'Update site information and settings'}
            </p>
          </div>

          {/* Form */}
          <SiteForm
            site={selectedSite || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      )}
    </div>
  );
};
