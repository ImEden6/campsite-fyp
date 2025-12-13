/**
 * SiteCard Component
 * Displays a campsite with image gallery, amenities, and pricing
 */

import { useState } from 'react';
import { MapPin, Users, Wifi, Zap, Droplet, Heart } from 'lucide-react';
import type { Site } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface SiteCardProps {
  site: Site;
  isAvailable?: boolean;
  onSelect?: (site: Site) => void;
  onViewDetails?: (site: Site) => void;
  showActions?: boolean;
}

export const SiteCard: React.FC<SiteCardProps> = ({
  site,
  isAvailable = true,
  onSelect,
  onViewDetails,
  showActions = true,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? site.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === site.images.length - 1 ? 0 : prev + 1
    );
  };

  const getSiteTypeColor = (type: string) => {
    switch (type) {
      case 'TENT':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'RV':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'CABIN':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'OCCUPIED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'MAINTENANCE':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'OUT_OF_SERVICE':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image Gallery */}
      <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
        {site.images && site.images.length > 0 ? (
          <>
            <img
              src={site.images[currentImageIndex]}
              alt={`${site.name} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
            {site.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                  aria-label="Next image"
                >
                  ›
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {site.images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No images available
          </div>
        )}

        {/* Availability Badge */}
        {!isAvailable && (
          <div className="absolute top-2 right-2">
            <Badge variant="error">Unavailable</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{site.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getSiteTypeColor(site.type)}>{site.type}</Badge>
              <Badge className={getStatusColor(site.status)}>{site.status}</Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ${site.basePrice}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">per night</div>
          </div>
        </div>

        {/* Description */}
        {site.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {site.description}
          </p>
        )}

        {/* Capacity and Size */}
        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>Up to {site.capacity} guests</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={16} />
            <span>
              {site.size.length}x{site.size.width} {site.size.unit}
            </span>
          </div>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-4">
          {site.hasElectricity && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              <Zap size={14} />
              <span>Electric</span>
            </div>
          )}
          {site.hasWater && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              <Droplet size={14} />
              <span>Water</span>
            </div>
          )}
          {site.hasWifi && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              <Wifi size={14} />
              <span>WiFi</span>
            </div>
          )}
          {site.isPetFriendly && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              <Heart size={14} />
              <span>Pet Friendly</span>
            </div>
          )}
          {site.amenities.length > 4 && (
            <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              +{site.amenities.length - 4} more
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(site)}
              className="flex-1"
            >
              View Details
            </Button>
            {isAvailable && onSelect && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSelect(site)}
                className="flex-1"
              >
                Select Site
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
