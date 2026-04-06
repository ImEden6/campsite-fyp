/**
 * SiteCard Component
 * Displays a campsite with image gallery, amenities, and pricing
 * Updated with Nature Theme Design System
 */

import { useState } from 'react';
import { MapPin, Wifi, Zap, Droplet, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Site } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CURRENCY_SYMBOL } from '@/utils/currency';
import { cn } from '@/utils/cn';

interface SiteCardProps {
  site: Site;
  isAvailable?: boolean | undefined;
  onSelect?: ((site: Site) => void) | undefined;
  onViewDetails?: ((site: Site) => void) | undefined;
  showActions?: boolean | undefined;
  className?: string | undefined;
}

export const SiteCard: React.FC<SiteCardProps> = ({
  site,
  isAvailable = true,
  onSelect,
  onViewDetails,
  showActions = true,
  className,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? site.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === site.images.length - 1 ? 0 : prev + 1
    );
  };

  const getSiteTypeColor = (type: string) => {
    switch (type) {
      case 'TENT':
        return 'bg-nature-100 text-nature-800 border-nature-200';
      case 'RV':
        return 'bg-secondary-100 text-secondary-800 border-secondary-200';
      case 'CABIN':
        return 'bg-primary-100 text-primary-800 border-primary-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      className={cn(
        "group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden transition-all duration-300",
        "border border-secondary-200/60 dark:border-secondary-700",
        "hover:shadow-lg hover:-translate-y-1 hover:border-primary-300 dark:hover:border-primary-700",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Gallery */}
      <div className="relative h-56 bg-secondary-100 dark:bg-gray-700 overflow-hidden">
        {site.images && site.images.length > 0 ? (
          <>
            <div
              className="absolute inset-0 transition-transform duration-500 ease-in-out flex"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {site.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${site.name} - View ${idx + 1}`}
                  className="w-full h-full object-cover flex-shrink-0"
                  loading="lazy"
                />
              ))}
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />

            {/* Navigation Controls only show on hover */}
            {site.images.length > 1 && (
              <div className={`absolute inset-0 flex items-center justify-between px-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                <button
                  onClick={handlePrevImage}
                  className="bg-white/90 text-secondary-800 p-1.5 rounded-full hover:bg-white hover:scale-110 transition shadow-sm backdrop-blur-sm"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="bg-white/90 text-secondary-800 p-1.5 rounded-full hover:bg-white hover:scale-110 transition shadow-sm backdrop-blur-sm"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Dots Indicator */}
            {site.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-full">
                {site.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white w-3' : 'bg-white/60'
                      }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary-400 bg-secondary-50 dark:bg-secondary-900">
            <span className="flex flex-col items-center gap-2">
              <MapPin className="w-8 h-8 opacity-50" />
              <span className="text-sm font-medium">No images</span>
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm backdrop-blur-md bg-white/90",
            getSiteTypeColor(site.type)
          )}>
            {site.type}
          </span>
        </div>

        {!isAvailable && (
          <div className="absolute top-3 right-3">
            <Badge variant="error" className="shadow-sm">Unavailable</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {site.name}
            </h3>
            <div className="flex items-center gap-1 text-sm text-secondary-500 dark:text-secondary-400 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{site.size.length}x{site.size.width} {site.size.unit}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {CURRENCY_SYMBOL}{site.basePrice}
              </span>
            </div>
            <span className="text-xs text-secondary-500">per night</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 leading-relaxed">
          {site.description || "Experience the outdoors at this beautiful campsite location."}
        </p>

        {/* Amenities Preview */}
        <div className="flex items-center gap-3 mb-5 py-3 border-t border-b border-secondary-100 dark:border-secondary-800">
          <div className="flex -space-x-2 overflow-hidden">
            {/* Amenity Icons — unified neutral palette */}
            {site.hasElectricity && (
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary-100 text-secondary-600 border-2 border-white dark:border-gray-800 dark:bg-secondary-800/70 dark:text-secondary-300" title="Electricity">
                <Zap className="w-4 h-4" />
              </div>
            )}
            {site.hasWater && (
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary-100 text-secondary-600 border-2 border-white dark:border-gray-800 dark:bg-secondary-800/70 dark:text-secondary-300" title="Water">
                <Droplet className="w-4 h-4" />
              </div>
            )}
            {site.hasWifi && (
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary-100 text-secondary-600 border-2 border-white dark:border-gray-800 dark:bg-secondary-800/70 dark:text-secondary-300" title="WiFi">
                <Wifi className="w-4 h-4" />
              </div>
            )}
            {site.isPetFriendly && (
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary-100 text-secondary-600 border-2 border-white dark:border-gray-800 dark:bg-secondary-800/70 dark:text-secondary-300" title="Pets Allowed">
                <Heart className="w-4 h-4" />
              </div>
            )}

            {/* Capacity Badge in the stack */}
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary-100 text-secondary-600 border-2 border-white dark:border-gray-800 dark:bg-secondary-800/70 dark:text-secondary-300" title={`Capacity: ${site.capacity}`}>
              <span className="text-xs font-bold">{site.capacity}</span>
            </div>
          </div>

          <span className="text-xs text-secondary-500 ml-auto">
            {(() => {
              const trackedCount = [
                site.hasElectricity,
                site.hasWater,
                site.hasWifi,
                site.isPetFriendly,
              ].filter(Boolean).length;
              const extraCount = Math.max(0, site.amenities.length - trackedCount);
              return extraCount > 0
                ? `+${extraCount} more`
                : 'All essentials included';
            })()}
          </span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(site)}
              className="w-full border-secondary-200 hover:bg-secondary-50 hover:text-secondary-900"
            >
              Details
            </Button>
            {isAvailable && onSelect ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSelect(site)}
                className="w-full shadow-sm"
              >
                Book Now
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="w-full opacity-50 cursor-not-allowed"
                disabled
              >
                Booked
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
