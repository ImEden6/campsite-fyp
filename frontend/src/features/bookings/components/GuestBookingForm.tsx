import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Calendar, Car, Package, DollarSign, AlertCircle } from 'lucide-react';
import type { Site, Vehicle } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { createGuestBooking, calculateBookingPrice, CreateGuestBookingData } from '@/services/api/bookings';
import { VehicleInput } from './VehicleInput';
import { EquipmentSelector } from './EquipmentSelector';
import { PricingBreakdown } from './PricingBreakdown';

interface GuestBookingFormProps {
  site: Site;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  initialCheckInDate?: string;
  initialCheckOutDate?: string;
  initialGuests?: number;
  onSuccess?: (bookingId: string, accessToken: string, bookingNumber: string) => void;
  onCancel?: () => void;
}

interface FormData {
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  pets: number;
  vehicles: Omit<Vehicle, 'id'>[];
  equipmentRentals: { equipmentId: string; quantity: number }[];
  specialRequests: string;
}

const initialFormData: FormData = {
  checkInDate: '',
  checkOutDate: '',
  adults: 2,
  children: 0,
  pets: 0,
  vehicles: [],
  equipmentRentals: [],
  specialRequests: '',
};

export const GuestBookingForm: React.FC<GuestBookingFormProps> = ({
  site,
  guestInfo,
  initialCheckInDate = '',
  initialCheckOutDate = '',
  initialGuests = 2,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    checkInDate: initialCheckInDate,
    checkOutDate: initialCheckOutDate,
    adults: initialGuests,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  // Calculate pricing
  const { data: pricing, isLoading: isPricingLoading } = useQuery({
    queryKey: ['booking-price', site.id, formData.checkInDate, formData.checkOutDate, formData.equipmentRentals],
    queryFn: () =>
      calculateBookingPrice(
        site.id,
        formData.checkInDate,
        formData.checkOutDate,
        formData.equipmentRentals
      ),
    enabled: !!formData.checkInDate && !!formData.checkOutDate,
  });

  // Create guest booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (data: CreateGuestBookingData) => createGuestBooking(data),
    onSuccess: (result) => {
      onSuccess?.(result.booking.id, result.accessToken, result.booking.bookingNumber);
    },
    onError: (error: Error) => {
      setErrors({ submit: error.message || 'Failed to create booking' });
    },
  });

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.checkInDate) {
        newErrors.checkInDate = 'Check-in date is required';
      }
      if (!formData.checkOutDate) {
        newErrors.checkOutDate = 'Check-out date is required';
      }
      if (formData.checkInDate && formData.checkOutDate && formData.checkInDate >= formData.checkOutDate) {
        newErrors.checkOutDate = 'Check-out must be after check-in';
      }
      if (formData.adults < 1) {
        newErrors.adults = 'At least one adult is required';
      }
      const totalGuests = formData.adults + formData.children;
      if (totalGuests > site.capacity) {
        newErrors.adults = `Total guests cannot exceed site capacity of ${site.capacity}`;
      }
    }

    if (step === 2) {
      if (formData.vehicles.length === 0) {
        newErrors.vehicles = 'At least one vehicle is required';
      }
      if (formData.vehicles.length > site.maxVehicles) {
        newErrors.vehicles = `Maximum ${site.maxVehicles} vehicles allowed`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    const bookingData: CreateGuestBookingData = {
      siteId: site.id,
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      guests: {
        adults: formData.adults,
        children: formData.children,
        pets: formData.pets,
      },
      vehicles: formData.vehicles,
      specialRequests: formData.specialRequests || undefined,
      equipmentRentals: formData.equipmentRentals.length > 0 ? formData.equipmentRentals : undefined,
      firstName: guestInfo.firstName,
      lastName: guestInfo.lastName,
      email: guestInfo.email,
      phone: guestInfo.phone,
    };

    createBookingMutation.mutate(bookingData);
  };

  const updateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const today = new Date().toISOString().split('T')[0];

  // Reuse the same form structure as BookingForm but with guest-specific submission
  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Dates', icon: Calendar },
            { num: 2, label: 'Vehicles', icon: Car },
            { num: 3, label: 'Equipment', icon: Package },
            { num: 4, label: 'Review', icon: DollarSign },
          ].map((step, index) => (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                    currentStep >= step.num
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {step.num}
                </div>
                <div className={`text-xs mt-2 text-center font-medium transition-colors ${
                  currentStep >= step.num
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {step.label}
                </div>
              </div>
              {index < 3 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded transition-all duration-200 ${
                    currentStep > step.num 
                      ? 'bg-blue-600 dark:bg-blue-500' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content - Reuse BookingForm structure */}
      <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
        {/* Step 1: Dates & Guests */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
              Select Dates & Guests
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Check-in Date *
                </label>
                <Input
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('checkInDate', e.target.value)}
                  min={today}
                  className={errors.checkInDate ? 'border-red-500 dark:border-red-500' : ''}
                />
                {errors.checkInDate && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.checkInDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Check-out Date *
                </label>
                <Input
                  type="date"
                  value={formData.checkOutDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('checkOutDate', e.target.value)}
                  min={formData.checkInDate || today}
                  className={errors.checkOutDate ? 'border-red-500 dark:border-red-500' : ''}
                />
                {errors.checkOutDate && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.checkOutDate}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adults (18+) *
                </label>
                <Input
                  type="number"
                  value={formData.adults}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('adults', parseInt(e.target.value) || 0)}
                  min="1"
                  max={site.capacity}
                  className={errors.adults ? 'border-red-500 dark:border-red-500' : ''}
                />
                {errors.adults && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.adults}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Children (0-17)
                </label>
                <Input
                  type="number"
                  value={formData.children}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('children', parseInt(e.target.value) || 0)}
                  min="0"
                  max={site.capacity}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pets
                </label>
                <Input
                  type="number"
                  value={formData.pets}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('pets', parseInt(e.target.value) || 0)}
                  min="0"
                  max="5"
                  disabled={!site.isPetFriendly}
                />
                {!site.isPetFriendly && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pets not allowed at this site</p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 p-4 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                <strong>Site Capacity:</strong> {site.capacity} guests | <strong>Total Selected:</strong> {formData.adults + formData.children} guest{formData.adults + formData.children !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Vehicles */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Car size={20} className="text-blue-600 dark:text-blue-400" />
              Vehicle Information
            </h2>

            <VehicleInput
              vehicles={formData.vehicles}
              onChange={(vehicles: Omit<Vehicle, 'id'>[]) => updateFormData('vehicles', vehicles)}
              maxVehicles={site.maxVehicles}
            />

            {errors.vehicles && (
              <div className="flex items-center gap-2 text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 p-3 rounded-lg">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{errors.vehicles}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Equipment */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Package size={20} className="text-blue-600 dark:text-blue-400" />
                Equipment Rentals (Optional)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add equipment rentals to enhance your camping experience
              </p>
            </div>

            <EquipmentSelector
              checkInDate={formData.checkInDate}
              checkOutDate={formData.checkOutDate}
              selectedEquipment={formData.equipmentRentals}
              onChange={(equipment: { equipmentId: string; quantity: number }[]) => updateFormData('equipmentRentals', equipment)}
            />
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
              Review & Confirm
            </h2>

            {/* Booking Summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
              <div className="border-b border-gray-200 dark:border-gray-600 pb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Site Information</h3>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{site.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 capitalize">{site.type.toLowerCase().replace('_', ' ')}</p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-600 pb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Dates</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-900 dark:text-white">{new Date(formData.checkInDate).toLocaleDateString()}</span>
                  <span className="text-gray-500 dark:text-gray-300">→</span>
                  <span className="text-gray-900 dark:text-white">{new Date(formData.checkOutDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-600 pb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Guests</h3>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formData.adults} Adult{formData.adults !== 1 ? 's' : ''}
                  {formData.children > 0 && `, ${formData.children} Child${formData.children !== 1 ? 'ren' : ''}`}
                  {formData.pets > 0 && `, ${formData.pets} Pet${formData.pets !== 1 ? 's' : ''}`}
                </p>
              </div>

              <div className={formData.equipmentRentals.length > 0 ? 'border-b border-gray-200 dark:border-gray-600 pb-3' : 'pb-3'}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Vehicles</h3>
                <div className="space-y-1">
                  {formData.vehicles.map((vehicle, index) => (
                    <p key={index} className="text-sm text-gray-900 dark:text-white">
                      • {vehicle.year} {vehicle.make} {vehicle.model} <span className="text-gray-600 dark:text-gray-300">({vehicle.type})</span>
                    </p>
                  ))}
                </div>
              </div>

              {formData.equipmentRentals.length > 0 && (
                <div className={formData.specialRequests ? 'border-b border-gray-200 dark:border-gray-600 pb-3' : 'pb-3'}>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Equipment Rentals</h3>
                  <p className="text-sm text-gray-900 dark:text-white">{formData.equipmentRentals.length} item(s) selected</p>
                </div>
              )}

              {formData.specialRequests && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Special Requests</h3>
                  <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-600/50 p-3 rounded border border-gray-200 dark:border-gray-500">{formData.specialRequests}</p>
                </div>
              )}
            </div>

            {/* Pricing Breakdown */}
            {pricing && (
              <PricingBreakdown pricing={pricing} loading={isPricingLoading} />
            )}

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Special Requests (Optional)
              </label>
              <textarea
                value={formData.specialRequests}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateFormData('specialRequests', e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                placeholder="Any special requests or requirements..."
              />
            </div>

            {errors.submit && (
              <div className="flex items-center gap-2 text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 p-3 rounded-lg">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{errors.submit}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            {onCancel && currentStep === 1 && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < 4 ? (
              <Button variant="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={createBookingMutation.isPending}
              >
                {createBookingMutation.isPending ? 'Creating Booking...' : 'Confirm Booking'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

