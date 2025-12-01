/**
 * SiteDetailView Component
 * Displays detailed information about a campsite
 */

import { useState } from 'react';
import {
  X,
  MapPin,
  Users,
  Maximize2,
  Wifi,
  Zap,
  Droplet,
  Heart,
  Car,
  Tent,
  Check,
} from 'lucide-react';
import type { Site } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface SiteDetailViewProps {
  site: Site;
  isOpen: boolean;
  onClose: () => void;
  onBook?: (site: Site) => void;
  isAvailable?: boolean;
}

export const SiteDetailView: React.FC<SiteDetailViewProps> = ({
  site,
  isOpen,
  onClose,
  onBook,
  isAvailable = true,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  const getSiteTypeColor = (type: string) => {
    switch (type) {
      case 'TENT':
        return 'bg-green-100 text-green-800';
      case 'RV':
        return 'bg-blue-100 text-blue-800';
      case 'CABIN':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <div className="max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{site.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getSiteTypeColor(site.type)}>{site.type}</Badge>
                {!isAvailable && <Badge variant="error">Unavailable</Badge>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>

          {/* Image Gallery */}
          <div className="px-6 py-4">
            {site.images && site.images.length > 0 ? (
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden group">
                  <img
                    src={site.images[selectedImageIndex]}
                    alt={`${site.name} - Image ${selectedImageIndex + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                  />
                  <button
                    onClick={() => setShowImageModal(true)}
                    className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition opacity-0 group-hover:opacity-100"
                    aria-label="View fullscreen"
                  >
                    <Maximize2 size={20} />
                  </button>
                </div>

                {/* Thumbnail Grid */}
                {site.images.length > 1 && (
                  <div className="grid grid-cols-6 gap-2">
                    {site.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative h-20 rounded-lg overflow-hidden border-2 transition ${
                          index === selectedImageIndex
                            ? 'border-blue-600'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                No images available
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-6 pb-6 space-y-6">
            {/* Pricing and Capacity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Price per night</div>
                <div className="text-3xl font-bold text-blue-900 mt-1">
                  ${site.basePrice}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Capacity</div>
                <div className="text-3xl font-bold text-green-900 mt-1 flex items-center gap-2">
                  <Users size={28} />
                  {site.capacity}
                </div>
              </div>
            </div>

            {/* Description */}
            {site.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{site.description}</p>
              </div>
            )}

            {/* Site Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Site Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={20} className="text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">Size</div>
                    <div className="text-sm">
                      {site.size.length} x {site.size.width} {site.size.unit}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Car size={20} className="text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">Max Vehicles</div>
                    <div className="text-sm">{site.maxVehicles}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Tent size={20} className="text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">Max Tents</div>
                    <div className="text-sm">{site.maxTents}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {site.hasElectricity && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">
                      <Zap size={20} />
                    </div>
                    <span className="font-medium">Electricity</span>
                  </div>
                )}
                {site.hasWater && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      <Droplet size={20} />
                    </div>
                    <span className="font-medium">Water Hookup</span>
                  </div>
                )}
                {site.hasSewer && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                      <Check size={20} />
                    </div>
                    <span className="font-medium">Sewer Hookup</span>
                  </div>
                )}
                {site.hasWifi && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                      <Wifi size={20} />
                    </div>
                    <span className="font-medium">WiFi</span>
                  </div>
                )}
                {site.isPetFriendly && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">
                      <Heart size={20} />
                    </div>
                    <span className="font-medium">Pet Friendly</span>
                  </div>
                )}
              </div>

              {/* Additional Amenities */}
              {site.amenities && site.amenities.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Additional Features
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {site.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            {site.location && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                <div className="text-sm text-gray-600">
                  Coordinates: {site.location.latitude.toFixed(6)},{' '}
                  {site.location.longitude.toFixed(6)}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              {isAvailable && onBook && (
                <Button variant="primary" onClick={() => onBook(site)} className="flex-1">
                  Book This Site
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Fullscreen Image Modal */}
      {showImageModal && (
        <Modal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          size="xl"
        >
          <div className="relative h-full bg-black flex items-center justify-center">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
              aria-label="Close"
            >
              <X size={32} />
            </button>
            <img
              src={site.images[selectedImageIndex]}
              alt={`${site.name} - Fullscreen`}
              className="max-w-full max-h-full object-contain"
            />
            {site.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {site.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition ${
                      index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};
