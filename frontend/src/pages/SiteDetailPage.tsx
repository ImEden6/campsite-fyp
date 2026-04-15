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
  CheckCircle,
  Share2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getSiteById, checkSiteAvailability } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';

import { SiteType } from '@/types';
import Button from '@/components/ui/Button';

import { Badge } from '@/components/ui/Badge';
import DatePicker from '@/components/forms/DatePicker';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import { CURRENCY_SYMBOL } from '@/utils/currency';

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

  const handleCheckInChange = (date: Date | null) => {
    const newValue = date ? date.toISOString().split('T')[0] : '';
    setCheckInDate(newValue || '');
    if (checkOutDate && newValue && newValue > checkOutDate) {
      setCheckOutDate('');
    }
  };

  const handleCheckOutChange = (date: Date | null) => {
    const newValue = date ? date.toISOString().split('T')[0] : '';
    setCheckOutDate(newValue || '');
  };

  // Fetch site details
  const { data: site, isLoading } = useQuery({
    queryKey: queryKeys.sites.detail(id!),
    queryFn: () => getSiteById(id!),
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
      case SiteType.TENT: return 'Tent Site';
      case SiteType.RV: return 'RV Site';
      case SiteType.CABIN: return 'Cabin';
      default: return type;
    }
  };

  const nextImage = () => {
    if (site?.images) {
      setCurrentImageIndex((prev) => (prev === site.images.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = () => {
    if (site?.images) {
      setCurrentImageIndex((prev) => (prev === 0 ? site.images.length - 1 : prev - 1));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nature-bg dark:bg-night-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nature-bg dark:bg-night-bg p-4">
        <div className="text-center bg-white dark:bg-night-surface p-8 rounded-2xl shadow-lg border border-secondary-200 text-center max-w-md w-full">
          <h2 className="text-2xl font-heading font-bold text-secondary-900 dark:text-primary-100 mb-2">Site Not Found</h2>
          <p className="text-secondary-600 mb-6">We couldn't find the campsite you're looking for.</p>
          <Button onClick={() => navigate('/sites')} className="w-full">Back to Sites</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg pb-12">
      {/* Navigation Header */}
      <div className="bg-white dark:bg-night-surface border-b border-secondary-200/60 dark:border-secondary-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/sites')}
            className="flex items-center text-sm font-medium text-secondary-600 hover:text-primary-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to browse
          </button>
          <div className="flex gap-2">
            <button className="p-2 text-secondary-500 hover:text-primary-600 rounded-full hover:bg-primary-50 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-secondary-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">

          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Image Gallery */}
            <div className="relative aspect-video bg-secondary-100 dark:bg-night-surface rounded-3xl overflow-hidden shadow-md group">
              {site.images && site.images.length > 0 ? (
                <>
                  <img
                    src={site.images[currentImageIndex]}
                    alt={`${site.name} view ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  {/* Navigation Arrows */}
                  {site.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 backdrop-blur text-night-surface hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 backdrop-blur text-night-surface hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Dots */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full">
                        {site.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={cn(
                              "w-2 h-2 rounded-full transition-all",
                              idx === currentImageIndex ? "bg-white w-4" : "bg-white/50 hover:bg-white/80"
                            )}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-secondary-400">
                  <MapPin className="w-16 h-16 opacity-20 mb-2" />
                  <span className="text-sm">No images available</span>
                </div>
              )}
            </div>

            {/* Title & Stats */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="font-heading text-3xl md:text-4xl font-bold text-secondary-900 dark:text-primary-100 mb-2">
                    {site.name}
                  </h1>
                  <div className="flex items-center gap-3 text-secondary-600 dark:text-secondary-400">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Loop B</span>
                    <span className="w-1 h-1 bg-secondary-300 rounded-full" />
                    <Badge variant="outline" className="border-secondary-200 text-secondary-600 bg-secondary-50">
                      {getSiteTypeLabel(site.type)}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-3xl font-heading font-bold text-primary-600 dark:text-primary-400">
                    {CURRENCY_SYMBOL}{site.basePrice}
                  </div>
                  <span className="text-secondary-500 text-sm">per night</span>
                </div>
              </div>

              {/* Quick Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-secondary-100 dark:border-secondary-800">
                <div className="p-3 rounded-2xl bg-white dark:bg-night-surface border border-secondary-100 dark:border-secondary-700 flex flex-col items-center text-center">
                  <Users className="w-5 h-5 text-primary-500 mb-2" />
                  <span className="text-xs text-secondary-500 uppercase tracking-wide">Capacity</span>
                  <span className="font-semibold text-secondary-900 dark:text-primary-100">{site.capacity} Guests</span>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-night-surface border border-secondary-100 dark:border-secondary-700 flex flex-col items-center text-center">
                  <MapPin className="w-5 h-5 text-primary-500 mb-2" />
                  <span className="text-xs text-secondary-500 uppercase tracking-wide">Size</span>
                  <span className="font-semibold text-secondary-900 dark:text-primary-100">{site.size.length}' x {site.size.width}'</span>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-night-surface border border-secondary-100 dark:border-secondary-700 flex flex-col items-center text-center">
                  <Zap className="w-5 h-5 text-primary-500 mb-2" />
                  <span className="text-xs text-secondary-500 uppercase tracking-wide">Electric</span>
                  <span className="font-semibold text-secondary-900 dark:text-primary-100">{site.hasElectricity ? 'Yes' : 'No'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-night-surface border border-secondary-100 dark:border-secondary-700 flex flex-col items-center text-center">
                  <Heart className="w-5 h-5 text-primary-500 mb-2" />
                  <span className="text-xs text-secondary-500 uppercase tracking-wide">Pets</span>
                  <span className="font-semibold text-secondary-900 dark:text-primary-100">{site.isPetFriendly ? 'Allowed' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-nature dark:prose-invert max-w-none">
              <h3 className="font-heading text-xl font-bold mb-3">About this site</h3>
              <p className="text-secondary-600 dark:text-secondary-300 leading-relaxed">
                {site.description || "Nestled in the heart of nature, this campsite offers a perfect blend of seclusion and accessibility. Enjoy the sounds of the nearby creek and the shade of ancient oaks."}
              </p>
            </div>

            {/* Amenities Grid */}
            <div>
              <h3 className="font-heading text-xl font-bold mb-4">Amenities & Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                {[
                  { label: "Electricity Hookup", active: site.hasElectricity, icon: Zap },
                  { label: "Water Hookup", active: site.hasWater, icon: Droplet },
                  { label: "Sewer Connection", active: site.hasSewer, icon: CheckCircle },
                  { label: "WiFi Access", active: site.hasWifi, icon: Wifi },
                  { label: "Pet Friendly", active: site.isPetFriendly, icon: Heart },
                  ...site.amenities.map(a => ({ label: a, active: true, icon: CheckCircle }))
                ].map((item, idx) => (
                  <div key={idx} className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-colors",
                    item.active ? "bg-primary-50/50 dark:bg-primary-900/10 text-secondary-900 dark:text-primary-100" : "opacity-40 text-gray-400"
                  )}>
                    <item.icon className={cn("w-5 h-5", item.active ? "text-primary-600" : "text-gray-400")} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-night-surface rounded-3xl shadow-xl shadow-primary-900/5 border border-secondary-200/60 dark:border-secondary-700 p-6 overflow-hidden">

              {/* Header Pattern */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-400 to-primary-600" />

              <div className="mb-6">
                <h2 className="font-heading text-xl font-bold text-secondary-900 dark:text-primary-100 mb-1">Book your stay</h2>
                <p className="text-sm text-secondary-500">Select dates to check availability</p>
              </div>

              <div className="space-y-5">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-secondary-500 tracking-wider">Check In</label>
                    <DatePicker
                      value={checkInDate ? new Date(checkInDate) : null}
                      onChange={handleCheckInChange}
                      minDate={new Date()}
                      placeholder="Select check-in"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-secondary-500 tracking-wider">Check Out</label>
                    <DatePicker
                      value={checkOutDate ? new Date(checkOutDate) : null}
                      onChange={handleCheckOutChange}
                      minDate={checkInDate ? new Date(checkInDate) : new Date()}
                      placeholder="Select check-out"
                    />
                  </div>
                </div>

                {/* Availability Status */}
                {checkInDate && checkOutDate && (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      onClick={handleCheckAvailability}
                      loading={isCheckingAvailability}
                      className="w-full border-secondary-200 hover:bg-secondary-50 hover:text-secondary-900"
                    >
                      Check Availability
                    </Button>

                    {availabilityStatus && (
                      <div className={cn(
                        "p-3 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2",
                        availabilityStatus === 'available'
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      )}>
                        {availabilityStatus === 'available' ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p>Site available!</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4 text-red-600" />
                            </div>
                            <p>Not available for these dates</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Price Breakdown */}
                {checkInDate && checkOutDate && availabilityStatus === 'available' && (
                  <div className="bg-secondary-50 dark:bg-secondary-900/30 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-sm text-secondary-600">
                      <span>${site.basePrice} x {Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))} nights</span>
                      <span>${(site.basePrice * Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-secondary-600">
                      <span>Service fee</span>
                      <span>$15.00</span>
                    </div>
                    <div className="border-t border-secondary-200 dark:border-secondary-700 pt-3 flex justify-between font-bold text-secondary-900 dark:text-primary-100">
                      <span>Total</span>
                      <span>${(site.basePrice * Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)) + 15).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={handleBookNow}
                  disabled={!checkInDate || !checkOutDate || availabilityStatus === 'unavailable'}
                  className="w-full py-6 text-lg shadow-lg shadow-primary-500/20"
                >
                  {isAuthenticated ? 'Reserve Now' : 'Continue as Guest'}
                </Button>

                {!isAuthenticated && (
                  <p className="text-xs text-center text-secondary-500">
                    <button onClick={() => navigate('/customer/login')} className="text-primary-600 hover:underline font-medium">Log in</button> to earn rewards on this booking
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SiteDetailPage;

