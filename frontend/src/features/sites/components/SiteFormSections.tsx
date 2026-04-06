import type { SiteType, SiteStatus, MeasurementUnit } from '@/types';
import type { SiteFormData } from './SiteForm';
import { Input } from '@/components/ui/Input';
import { AmenitySelector } from './AmenitySelector';
import { ImageUpload } from './ImageUpload';

interface SiteSectionBase {
  errors?: Record<string, string>;
}

interface BasicInfoData {
  name: string;
  type: SiteType;
  status: SiteStatus;
  capacity: number;
  description: string;
  basePrice: number;
  maxVehicles: number;
  maxTents: number;
}

interface BasicInfoSectionProps extends SiteSectionBase {
  data: BasicInfoData;
  onChange: <K extends keyof SiteFormData>(field: K, value: SiteFormData[K]) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ data, onChange, errors }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Site Name <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g., Site A1"
          error={errors?.name}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Site Type <span className="text-red-500">*</span>
        </label>
        <select
          value={data.type}
          onChange={(e) => onChange('type', e.target.value as SiteType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="TENT">Tent Site</option>
          <option value="RV">RV Site</option>
          <option value="CABIN">Cabin</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          value={data.status}
          onChange={(e) => onChange('status', e.target.value as SiteStatus)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="AVAILABLE">Available</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="OUT_OF_SERVICE">Out of Service</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Capacity (guests) <span className="text-red-500">*</span>
        </label>
        <Input
          type="number"
          value={data.capacity}
          onChange={(e) => onChange('capacity', parseInt(e.target.value) || 0)}
          min="1"
          error={errors?.capacity}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Base Price (per night) <span className="text-red-500">*</span>
        </label>
        <Input
          type="number"
          value={data.basePrice}
          onChange={(e) => onChange('basePrice', parseFloat(e.target.value) || 0)}
          min="0"
          step="0.01"
          placeholder="0.00"
          error={errors?.basePrice}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Max Vehicles</label>
        <Input
          type="number"
          value={data.maxVehicles}
          onChange={(e) => onChange('maxVehicles', parseInt(e.target.value) || 0)}
          min="0"
          error={errors?.maxVehicles}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Max Tents</label>
        <Input
          type="number"
          value={data.maxTents}
          onChange={(e) => onChange('maxTents', parseInt(e.target.value) || 0)}
          min="0"
          error={errors?.maxTents}
        />
      </div>
    </div>
  );
};

interface DescriptionSectionProps {
  description: string;
  onChange: (value: string) => void;
}

export const DescriptionSection: React.FC<DescriptionSectionProps> = ({ description, onChange }) => {
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <textarea
        value={description}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Describe the site features and location..."
      />
    </div>
  );
};

interface DimensionsData {
  length: number;
  width: number;
  unit: MeasurementUnit;
}

interface DimensionsSectionProps extends SiteSectionBase {
  data: DimensionsData;
  onChange: <K extends keyof DimensionsData>(field: K, value: DimensionsData[K]) => void;
}

export const DimensionsSection: React.FC<DimensionsSectionProps> = ({ data, onChange, errors: _errors }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Length <span className="text-red-500">*</span>
        </label>
        <Input
          type="number"
          value={data.length}
          onChange={(e) => onChange('length', parseFloat(e.target.value) || 0)}
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
          value={data.width}
          onChange={(e) => onChange('width', parseFloat(e.target.value) || 0)}
          min="0"
          step="0.1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
        <select
          value={data.unit}
          onChange={(e) => onChange('unit', e.target.value as MeasurementUnit)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="feet">Feet</option>
          <option value="meters">Meters</option>
        </select>
      </div>
    </div>
  );
};

interface AmenitiesData {
  isPetFriendly: boolean;
  hasElectricity: boolean;
  hasWater: boolean;
  hasSewer: boolean;
  hasWifi: boolean;
  amenities: string[];
}

interface AmenitiesSectionProps {
  data: AmenitiesData;
  onChange: <K extends keyof SiteFormData>(field: K, value: SiteFormData[K]) => void;
}

export const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({ data, onChange }) => {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.hasElectricity}
            onChange={(e) => onChange('hasElectricity', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Electricity</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.hasWater}
            onChange={(e) => onChange('hasWater', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Water</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.hasSewer}
            onChange={(e) => onChange('hasSewer', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Sewer</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.hasWifi}
            onChange={(e) => onChange('hasWifi', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">WiFi</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isPetFriendly}
            onChange={(e) => onChange('isPetFriendly', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Pet Friendly</span>
        </label>
      </div>

      <AmenitySelector
        selectedAmenities={data.amenities}
        onChange={(amenities) => onChange('amenities', amenities)}
      />
    </div>
  );
};

interface ImagesSectionProps {
  images: string[];
  newImages: File[];
  onImagesChange: (images: string[]) => void;
  onNewImagesChange: (files: File[]) => void;
}

export const ImagesSection: React.FC<ImagesSectionProps> = ({
  images,
  newImages: _newImages,
  onImagesChange,
  onNewImagesChange,
}) => {
  return (
    <ImageUpload
      existingImages={images}
      onImagesChange={onImagesChange}
      onNewImagesChange={onNewImagesChange}
    />
  );
};

interface LocationData {
  latitude: number;
  longitude: number;
  mapPosition: { x: number; y: number };
}

interface LocationSectionProps {
  data: LocationData;
  onChange: (field: string, value: number) => void;
  onMapPositionChange: (field: 'x' | 'y', value: number) => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({ data, onChange, onMapPositionChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
        <Input
          type="number"
          value={data.latitude}
          onChange={(e) => onChange('latitude', parseFloat(e.target.value) || 0)}
          step="0.000001"
          placeholder="0.000000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
        <Input
          type="number"
          value={data.longitude}
          onChange={(e) => onChange('longitude', parseFloat(e.target.value) || 0)}
          step="0.000001"
          placeholder="0.000000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Map Position X</label>
        <Input
          type="number"
          value={data.mapPosition.x}
          onChange={(e) => onMapPositionChange('x', parseFloat(e.target.value) || 0)}
          step="1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Map Position Y</label>
        <Input
          type="number"
          value={data.mapPosition.y}
          onChange={(e) => onMapPositionChange('y', parseFloat(e.target.value) || 0)}
          step="1"
        />
      </div>
    </div>
  );
};
