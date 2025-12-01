/**
 * AmenitySelector Component
 * Allows selection of additional amenities for a campsite
 */

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface AmenitySelectorProps {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
}

// Common amenities that can be quickly selected
const COMMON_AMENITIES = [
  'Fire Pit',
  'Picnic Table',
  'Grill',
  'Shade',
  'Level Ground',
  'Privacy',
  'Lake View',
  'Mountain View',
  'Forest View',
  'Near Restrooms',
  'Near Showers',
  'Near Playground',
  'Accessible',
  'Pull-Through',
  'Back-In',
  'Paved Pad',
  'Gravel Pad',
  'Grass Pad',
];

export const AmenitySelector: React.FC<AmenitySelectorProps> = ({
  selectedAmenities,
  onChange,
}) => {
  const [customAmenity, setCustomAmenity] = useState('');
  const [showCommonAmenities, setShowCommonAmenities] = useState(true);

  const handleToggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      onChange(selectedAmenities.filter((a) => a !== amenity));
    } else {
      onChange([...selectedAmenities, amenity]);
    }
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !selectedAmenities.includes(trimmed)) {
      onChange([...selectedAmenities, trimmed]);
      setCustomAmenity('');
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    onChange(selectedAmenities.filter((a) => a !== amenity));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomAmenity();
    }
  };

  return (
    <div className="space-y-4">
      {/* Selected Amenities */}
      {selectedAmenities.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Amenities ({selectedAmenities.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedAmenities.map((amenity) => (
              <Badge
                key={amenity}
                variant="info"
                className="flex items-center gap-1 px-3 py-1"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => handleRemoveAmenity(amenity)}
                  className="ml-1 hover:text-red-600 transition-colors"
                  aria-label={`Remove ${amenity}`}
                >
                  <X size={14} />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Amenity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Custom Amenity
        </label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={customAmenity}
            onChange={(e) => setCustomAmenity(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter amenity name..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCustomAmenity}
            disabled={!customAmenity.trim()}
            className="flex items-center gap-1"
          >
            <Plus size={16} />
            Add
          </Button>
        </div>
      </div>

      {/* Common Amenities */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Common Amenities
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCommonAmenities(!showCommonAmenities)}
          >
            {showCommonAmenities ? 'Hide' : 'Show'}
          </Button>
        </div>

        {showCommonAmenities && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {COMMON_AMENITIES.map((amenity) => {
              const isSelected = selectedAmenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => handleToggleAmenity(amenity)}
                  className={`
                    px-3 py-2 text-sm rounded-md border transition-colors text-left
                    ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {amenity}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
