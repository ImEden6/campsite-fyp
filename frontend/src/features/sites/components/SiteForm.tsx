/**
 * SiteForm Component
 * Form for creating and editing campsite information
 */

import { useState } from 'react';
import type { Site, SiteType, SiteStatus, MeasurementUnit } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { validateSiteForm } from './SiteFormValidation';
import {
  BasicInfoSection,
  DescriptionSection,
  DimensionsSection,
  AmenitiesSection,
  ImagesSection,
  LocationSection,
} from './SiteFormSections';

interface SiteFormProps {
  site?: Site | undefined;
  onSubmit: (data: SiteFormData) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean | undefined;
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

  const handleChange = <K extends keyof SiteFormData>(field: K, value: SiteFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSizeChange = <K extends keyof SiteFormData['size']>(field: K, value: SiteFormData['size'][K]) => {
    setFormData((prev) => ({
      ...prev,
      size: { ...prev.size, [field]: value },
    }));
  };

  const handleLocationChange = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  };

  const handleMapPositionChange = (field: 'x' | 'y', value: number) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        mapPosition: { ...prev.location.mapPosition, [field]: value },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateSiteForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <BasicInfoSection
          data={formData}
          onChange={handleChange}
          errors={errors}
        />
        <DescriptionSection
          description={formData.description}
          onChange={(value) => handleChange('description', value)}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Dimensions</h3>
        <DimensionsSection
          data={formData.size}
          onChange={handleSizeChange}
          errors={errors}
        />
        {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size}</p>}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities & Features</h3>
        <AmenitiesSection
          data={formData}
          onChange={handleChange}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Images</h3>
        <ImagesSection
          images={formData.images}
          newImages={formData.newImages}
          onImagesChange={(images) => handleChange('images', images)}
          onNewImagesChange={(files) => handleChange('newImages', files)}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
        <LocationSection
          data={formData.location}
          onChange={handleLocationChange}
          onMapPositionChange={handleMapPositionChange}
        />
      </Card>

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
