import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Users,
  Wifi,
  Zap,
  Droplet,
  Heart,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { getSiteById, checkSiteAvailability } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';
import { mockSites } from '@/services/api/mock-sites';
import { SiteType } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';

const SiteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();

  const [checkInDate, setCheckInDate] = useState(searchParams.get('checkIn') || '');
  const [checkOutDate, setCheckOutDate] = useState(searchParams.get('checkOut') || '');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'unavailable' | null>(null);

  // Fetch site details
  const { data: site, isLoading } = useQuery({
    queryKey: queryKeys.sites.detail(id!),
    queryFn: async () => {
      try {
        const apiSite = await getSiteById(id!);
        return apiSite;
      } catch {
        // Fallback to mock data
        return mockSites.find((s) => s.id === id) || mockSites[0];
      }
    },
    enabled: !!id,
  });

  const handleCheckAvailability = async () => {
    if (!checkInDate || !checkOutDate || !site) return;

    setIsCheckingAvailability(true);
    try {
      const isAvailable = await checkSiteAvailability(site.id, checkInDate, checkOutDate);
      setAvailabilityStatus(isAvailable ? 'available' : 'unavailable');
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityStatus('unavailable');
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleBookNow = () => {
    if (!site) return;

    const params = new URLSearchParams();
    if (checkInDate) params.set('checkIn', checkInDate);
    if (checkOutDate) params.set('checkOut', checkOutDate);

    if (isAuthenticated && user?.role === 'CUSTOMER') {
      navigate(`/customer/bookings/new?siteId=${site.id}&${params.toString()}`);
    } else {
      navigate(`/book/guest?siteId=${site.id}&${params.toString()}`);
    }
  };

  const getSiteTypeLabel = (type: SiteType) => {
    switch (type) {
      case SiteType.TENT:
        return 'Tent Site';
      case SiteType.RV:
        return 'RV Site';
      case SiteType.CABIN:
        return 'Cabin';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading site details...</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Site not found
          </p>
          <Button onClick={() => navigate('/sites')}>Back to Sites</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/sites')}
        className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Sites</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {site.images && site.images.length > 0 ? (
            <div className="relative">
              <img
                src={site.images[currentImageIndex]}
                alt={site.name}
                className="w-full h-96 object-cover rounded-lg"
              />
              {site.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {site.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <MapPin className="w-16 h-16 text-gray-400" />
            </div>
          )}

          {/* Site Info */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {site.name}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                    {getSiteTypeLabel(site.type)}
                  </span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                    {site.status}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  ${site.basePrice}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">per night</div>
              </div>
            </div>

            {site.description && (
              <p className="text-gray-700 dark:text-gray-300 mb-6">{site.description}</p>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Capacity</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {site.capacity} guests
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Size</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {site.size.length}x{site.size.width} {site.size.unit}
                  </div>
                </div>
              </div>
              {site.maxVehicles > 0 && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Max Vehicles</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {site.maxVehicles}
                  </div>
                </div>
              )}
              {site.maxTents > 0 && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Max Tents</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {site.maxTents}
                  </div>
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Amenities
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {site.hasElectricity && (
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-700 dark:text-gray-300">Electricity</span>
                  </div>
                )}
                {site.hasWater && (
                  <div className="flex items-center space-x-2">
                    <Droplet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-700 dark:text-gray-300">Water</span>
                  </div>
                )}
                {site.hasSewer && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-700 dark:text-gray-300">Sewer</span>
                  </div>
                )}
                {site.hasWifi && (
                  <div className="flex items-center space-x-2">
                    <Wifi className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-700 dark:text-gray-300">WiFi</span>
                  </div>
                )}
                {site.isPetFriendly && (
                  <div className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-700 dark:text-gray-300">Pet Friendly</span>
                  </div>
                )}
              </div>
              {site.amenities.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {site.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Book This Site
            </h2>

            {/* Date Selection */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Check In
                </label>
                <Input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Check Out
                </label>
                <Input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  min={checkInDate || format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              {checkInDate && checkOutDate && (
                <Button
                  variant="outline"
                  onClick={handleCheckAvailability}
                  disabled={isCheckingAvailability}
                  className="w-full"
                >
                  {isCheckingAvailability ? 'Checking...' : 'Check Availability'}
                </Button>
              )}
              {availabilityStatus && (
                <div
                  className={`p-3 rounded-lg ${availabilityStatus === 'available'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                    }`}
                >
                  {availabilityStatus === 'available' ? (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Available for these dates</span>
                    </div>
                  ) : (
                    <span>Not available for these dates</span>
                  )}
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Price per night</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  ${site.basePrice}
                </span>
              </div>
              {checkInDate && checkOutDate && (
                <>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Nights</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {Math.ceil(
                        (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total</span>
                    <span>
                      $
                      {checkInDate && checkOutDate
                        ? (
                          Math.ceil(
                            (new Date(checkOutDate).getTime() -
                              new Date(checkInDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                          ) * site.basePrice
                        ).toFixed(2)
                        : site.basePrice.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Book Button */}
            <Button
              onClick={handleBookNow}
              disabled={!checkInDate || !checkOutDate || availabilityStatus === 'unavailable'}
              className="w-full"
            >
              {isAuthenticated ? 'Book Now' : 'Continue as Guest'}
            </Button>

            {!isAuthenticated && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                Or{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  login
                </button>{' '}
                to manage your bookings
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteDetailPage;

