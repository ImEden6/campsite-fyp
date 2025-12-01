/**
 * SiteForm Component
 * Form for creating and editing campsite information
 */

import { useState } from 'react';
import type { Site, SiteType, SiteStatus, MeasurementUnit } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { AmenitySelector } from './AmenitySelector';
import { ImageUpload } from './ImageUpload';

interface SiteFormProps {
  site?: Site;
  onSubmit: (data: SiteFormData) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface SiteFormData {
  name: string;
  type: SiteType;
  status: SiteStatus;
  capacity: number;
  description: string;
  basePrice: number;
  maxVehicles: number;
  maxTents: number;
  isPetFriendly: boolean;
  hasElectricity: boolean;
  hasWater: boolean;
  hasSewer: boolean;
  hasWifi: boolean;
  amenities: string[];
  images: string[];
  newImages: File[];
  size: {
    length: number;
    width: number;
    unit: MeasurementUnit;
  };
  location: {
    latitude: number;
    longitude: number;
    mapPosition: { x: number; y: number };
  };
}

export const SiteForm: React.FC<SiteFormProps> = ({
  site,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<SiteFormData>({
    name: site?.name || '',
    type: (site?.type || 'TENT') as SiteType,
    status: (site?.status || 'AVAILABLE') as SiteStatus,
    capacity: site?.capacity || 4,
    description: site?.description || '',
    basePrice: site?.basePrice || 0,
    maxVehicles: site?.maxVehicles || 1,
    maxTents: site?.maxTents || 1,
    isPetFriendly: site?.isPetFriendly || false,
    hasElectricity: site?.hasElectricity || false,
    hasWater: site?.hasWater || false,
    hasSewer: site?.hasSewer || false,
    hasWifi: site?.hasWifi || false,
    amenities: site?.amenities || [],
    images: site?.images || [],
    newImages: [],
    size: site?.size || { length: 0, width: 0, unit: 'feet' as MeasurementUnit },
    location: site?.location || {
      latitude: 0,
      longitude: 0,
      mapPosition: { x: 0, y: 0 },
    },
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SiteFormData, string>>>({});

  const handleChange = (field: keyof SiteFormData, value: string | number | boolean | string[] | File[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNestedChange = (
    parent: 'size' | 'location',
    field: string,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const handleMapPositionChange = (field: 'x' | 'y', value: number) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        mapPosition: {
          ...prev.location.mapPosition,
          [field]: value,
        },
      },
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SiteFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Site name is required';
    }

    if (formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }

    if (formData.basePrice < 0) {
      newErrors.basePrice = 'Price cannot be negative';
    }

    if (formData.maxVehicles < 0) {
      newErrors.maxVehicles = 'Max vehicles cannot be negative';
    }

    if (formData.maxTents < 0) {
      newErrors.maxTents = 'Max tents cannot be negative';
    }

    if (formData.size.length <= 0 || formData.size.width <= 0) {
      newErrors.size = 'Site dimensions must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Site Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Site A1"
              error={errors.name}
            />
          </div>

          {/* Site Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value as SiteType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TENT">Tent Site</option>
              <option value="RV">RV Site</option>
              <option value="CABIN">Cabin</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as SiteStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity (guests) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)}
              min="1"
              error={errors.capacity}
            />
          </div>

          {/* Base Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Price (per night) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.basePrice}
              onChange={(e) => handleChange('basePrice', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              placeholder="0.00"
              error={errors.basePrice}
            />
          </div>

          {/* Max Vehicles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Vehicles
            </label>
            <Input
              type="number"
              value={formData.maxVehicles}
              onChange={(e) => handleChange('maxVehicles', parseInt(e.target.value) || 0)}
              min="0"
              error={errors.maxVehicles}
            />
          </div>

          {/* Max Tents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Tents
            </label>
            <Input
              type="number"
              value={formData.maxTents}
              onChange={(e) => handleChange('maxTents', parseInt(e.target.value) || 0)}
              min="0"
              error={errors.maxTents}
            />
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the site features and location..."
          />
        </div>
      </Card>

      {/* Site Dimensions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Dimensions</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Length <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.size.length}
              onChange={(e) => handleNestedChange('size', 'length', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.size.width}
              onChange={(e) => handleNestedChange('size', 'width', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <select
              value={formData.size.unit}
              onChange={(e) => handleNestedChange('size', 'unit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="feet">Feet</option>
              <option value="meters">Meters</option>
            </select>
          </div>
        </div>
        {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size}</p>}
      </Card>

      {/* Amenities */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities & Features</h3>

        {/* Basic Amenities Checkboxes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasElectricity}
              onChange={(e) => handleChange('hasElectricity', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Electricity</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasWater}
              onChange={(e) => handleChange('hasWater', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Water</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasSewer}
              onChange={(e) => handleChange('hasSewer', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Sewer</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasWifi}
              onChange={(e) => handleChange('hasWifi', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">WiFi</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPetFriendly}
              onChange={(e) => handleChange('isPetFriendly', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Pet Friendly</span>
          </label>
        </div>

        {/* Additional Amenities */}
        <AmenitySelector
          selectedAmenities={formData.amenities}
          onChange={(amenities) => handleChange('amenities', amenities)}
        />
      </Card>

      {/* Images */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Images</h3>
        <ImageUpload
          existingImages={formData.images}
          onImagesChange={(images) => handleChange('images', images)}
          onNewImagesChange={(files) => handleChange('newImages', files)}
        />
      </Card>

      {/* Location */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <Input
              type="number"
              value={formData.location.latitude}
              onChange={(e) => handleNestedChange('location', 'latitude', parseFloat(e.target.value) || 0)}
              step="0.000001"
              placeholder="0.000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <Input
              type="number"
              value={formData.location.longitude}
              onChange={(e) => handleNestedChange('location', 'longitude', parseFloat(e.target.value) || 0)}
              step="0.000001"
              placeholder="0.000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Map Position X
            </label>
            <Input
              type="number"
              value={formData.location.mapPosition.x}
              onChange={(e) => handleMapPositionChange('x', parseFloat(e.target.value) || 0)}
              step="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Map Position Y
            </label>
            <Input
              type="number"
              value={formData.location.mapPosition.y}
              onChange={(e) => handleMapPositionChange('y', parseFloat(e.target.value) || 0)}
              step="1"
            />
          </div>
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : site ? 'Update Site' : 'Create Site'}
        </Button>
      </div>
    </form>
  );
};
