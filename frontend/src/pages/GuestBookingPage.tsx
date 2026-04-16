import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Mail, Phone, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { getSiteById } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';

import { GuestBookingForm } from '@/features/bookings/components/GuestBookingForm';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { GlassCard } from '@/components/ui/GlassCard';
import { getBookingById } from '@/services/api/bookings';
import { PaymentModal } from '@/features/payments/components/PaymentModal';

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createAccount: boolean;
}

const GuestBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const siteId = searchParams.get('siteId');
  const checkInDate = searchParams.get('checkIn') || '';
  const checkOutDate = searchParams.get('checkOut') || '';
  const initialGuests = parseInt(searchParams.get('guests') || '2', 10);

  const [step, setStep] = useState<'guest-info' | 'booking-form' | 'payment'>('guest-info');
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    createAccount: false,
  });
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingNumber, setBookingNumber] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const { data: site, isLoading } = useQuery({
    queryKey: queryKeys.sites.detail(siteId!),
    queryFn: () => getSiteById(siteId!),
    enabled: !!siteId,
  });

  const handleGuestInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('booking-form');
  };

  // Fetch booking to get payment amount
  const { data: booking } = useQuery({
    queryKey: queryKeys.bookings.detail(bookingId!),
    queryFn: () => getBookingById(bookingId!),
    enabled: !!bookingId && showPaymentModal,
  });

  // Update payment amount when booking data is fetched
  useEffect(() => {
    if (booking) {
      const amountDue = booking.totalAmount - booking.paidAmount;
      setPaymentAmount(Math.round(amountDue * 100)); // Convert to cents
    }
  }, [booking]);

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    if (bookingNumber) {
      navigate(`/booking/confirm/${bookingNumber}`);
    } else if (bookingId) {
      navigate(`/booking/confirm/${bookingId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nature-bg dark:bg-night-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-nature-bg dark:bg-night-bg flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-8 text-center">
          <p className="text-lg font-medium text-secondary-900 dark:text-primary-100 mb-4">
            Site not found
          </p>
          <Button onClick={() => navigate('/sites')}>Back to Sites</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header / Nav */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => step === 'guest-info' ? navigate(`/sites/${siteId}`) : setStep('guest-info')}
            className="flex items-center space-x-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-sm text-secondary-500">
            <span className={step === 'guest-info' ? 'text-primary-600 font-bold' : ''}>Guest Info</span>
            <span>&rarr;</span>
            <span className={step === 'booking-form' ? 'text-primary-600 font-bold' : ''}>Details</span>
            <span>&rarr;</span>
            <span className={step === 'payment' ? 'text-primary-600 font-bold' : ''}>Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Form Area */}
          <div className="lg:col-span-2">
            {step === 'guest-info' && (
              <GlassCard className="p-6 md:p-8">
                <div className="mb-6">
                  <h1 className="font-heading text-3xl font-bold text-secondary-900 dark:text-primary-100 mb-2">
                    Enter Guest Information
                  </h1>
                  <p className="text-secondary-600 dark:text-secondary-400">
                    Your contact details are required to secure this booking.
                  </p>
                </div>

                <form onSubmit={handleGuestInfoSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-1.5">
                        First Name *
                      </label>
                      <Input
                        id="firstName"
                        type="text"
                        required
                        value={guestInfo.firstName}
                        onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                        icon={<User className="text-secondary-400 w-5 h-5" />}
                        className="bg-white/50 dark:bg-night-surface/50"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-1.5">
                        Last Name *
                      </label>
                      <Input
                        id="lastName"
                        type="text"
                        required
                        value={guestInfo.lastName}
                        onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                        icon={<User className="text-secondary-400 w-5 h-5" />}
                        className="bg-white/50 dark:bg-night-surface/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-1.5">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      icon={<Mail className="text-secondary-400 w-5 h-5" />}
                      className="bg-white/50 dark:bg-night-surface/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-1.5">
                      Phone Number *
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                      icon={<Phone className="text-secondary-400 w-5 h-5" />}
                      className="bg-white/50 dark:bg-night-surface/50"
                    />
                  </div>

                  <div className="flex items-start space-x-3 p-4 rounded-xl bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/30">
                    <input
                      type="checkbox"
                      id="createAccount"
                      checked={guestInfo.createAccount}
                      onChange={(e) => setGuestInfo({ ...guestInfo, createAccount: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="createAccount" className="text-sm">
                      <span className="block font-medium text-secondary-900 dark:text-primary-100">Create an account</span>
                      <span className="block text-secondary-500">Save your details for faster bookings next time</span>
                    </label>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" size="lg" className="w-full md:w-auto md:min-w-[200px]">
                      Continue to Details
                    </Button>
                  </div>
                </form>
              </GlassCard>
            )}

            {step === 'booking-form' && (
              <GuestBookingForm
                site={site}
                guestInfo={guestInfo}
                initialCheckInDate={checkInDate}
                initialCheckOutDate={checkOutDate}
                initialGuests={initialGuests}
                onSuccess={(bookingId: string, _accessToken: string, bookingNumber: string) => {
                  setBookingId(bookingId);
                  setBookingNumber(bookingNumber);
                  setStep('payment');
                  setShowPaymentModal(true);
                }}
                onCancel={() => setStep('guest-info')}
              />
            )}

            {/* Payment Modal/Step */}
            {step === 'payment' && bookingId && showPaymentModal && (
              <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => {
                  setShowPaymentModal(false);
                  setStep('booking-form');
                }}
                bookingId={bookingId}
                amount={
                  paymentAmount ||
                  (booking ? Math.round((booking.totalAmount - booking.paidAmount) * 100) : 0)
                }
                onSuccess={handlePaymentSuccess}
              />
            )}
          </div>

          {/* Sidebar Site Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <GlassCard className="overflow-hidden p-0" intensity="light">
                {site.images && site.images.length > 0 && (
                  <div className="h-48 w-full relative">
                    <img src={site.images[0]} alt={site.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-heading text-xl font-bold">{site.name}</h3>
                      <div className="flex items-center text-sm opacity-90">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>Loop B</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-secondary-200/50 dark:border-secondary-700/50">
                    <div className="flex items-center text-secondary-600 dark:text-secondary-400">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      <span className="text-sm">Dates</span>
                    </div>
                    <div className="text-sm font-semibold text-secondary-900 dark:text-primary-100">
                      {checkInDate && checkOutDate ? (
                        <div className="text-right">
                          <div>{checkInDate}</div>
                          <div className="text-xs text-secondary-500">to {checkOutDate}</div>
                        </div>
                      ) : 'Not selected'}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-secondary-200/50 dark:border-secondary-700/50">
                    <div className="flex items-center text-secondary-600 dark:text-secondary-400">
                      <User className="w-4 h-4 mr-2" />
                      <span className="text-sm">Guests</span>
                    </div>
                    <div className="text-sm font-semibold text-secondary-900 dark:text-primary-100">
                      {initialGuests} Guests
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="text-xs text-secondary-500 uppercase tracking-wide mb-2">Notice</div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400 leading-relaxed">
                      Full payment is required at the time of booking. Cancellation policies apply.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GuestBookingPage;

