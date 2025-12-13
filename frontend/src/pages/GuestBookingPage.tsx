import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Mail, Phone } from 'lucide-react';
import { getSiteById } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';
import { mockSites } from '@/services/api/mock-sites';
import { GuestBookingForm } from '@/features/bookings/components/GuestBookingForm';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { createGuestBooking, CreateGuestBookingData, getBookingById } from '@/services/api/bookings';
import { PaymentModal } from '@/features/payments/components/PaymentModal';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/config/query-keys';

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
    queryKey: queryKeys.sites.byId(siteId!),
    queryFn: async () => {
      try {
        return await getSiteById(siteId!);
      } catch {
        return mockSites.find((s) => s.id === siteId) || mockSites[0];
      }
    },
    enabled: !!siteId,
  });

  const handleGuestInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('booking-form');
  };


  const handleBookingFormSubmit = async (bookingFormData: any) => {
    // Convert booking form data to guest booking data
    const guestBookingData: CreateGuestBookingData = {
      ...bookingFormData,
      firstName: guestInfo.firstName,
      lastName: guestInfo.lastName,
      email: guestInfo.email,
      phone: guestInfo.phone,
    };
    
    createGuestBookingMutation.mutate(guestBookingData);
  };

  // Fetch booking to get payment amount
  const { data: booking } = useQuery({
    queryKey: queryKeys.bookings.detail(bookingId!),
    queryFn: () => getBookingById(bookingId!),
    enabled: !!bookingId && showPaymentModal,
    onSuccess: (data) => {
      const amountDue = data.totalAmount - data.paidAmount;
      setPaymentAmount(Math.round(amountDue * 100)); // Convert to cents
    },
  });

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
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Site not found
          </p>
          <button
            onClick={() => navigate('/sites')}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Sites
          </button>
        </div>
      </div>
    );
  }

  if (step === 'guest-info') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <button
          onClick={() => navigate('/sites')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sites</span>
        </button>

        <Card className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Guest Information
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please provide your contact information to complete your booking
          </p>

          <form onSubmit={handleGuestInfoSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    required
                    value={guestInfo.firstName}
                    onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    required
                    value={guestInfo.lastName}
                    onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="email"
                  required
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="tel"
                  required
                  value={guestInfo.phone}
                  onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="createAccount"
                checked={guestInfo.createAccount}
                onChange={(e) => setGuestInfo({ ...guestInfo, createAccount: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="createAccount" className="text-sm text-gray-700 dark:text-gray-300">
                Create an account to manage your bookings
              </label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => navigate('/sites')} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Continue
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  if (step === 'booking-form') {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <GuestBookingForm
          site={site}
          guestInfo={guestInfo}
          initialCheckInDate={checkInDate}
          initialCheckOutDate={checkOutDate}
          initialGuests={initialGuests}
          onSuccess={(bookingId: string, accessToken: string, bookingNumber: string) => {
            setBookingId(bookingId);
            setBookingNumber(bookingNumber);
            setStep('payment');
            setShowPaymentModal(true);
          }}
          onCancel={() => setStep('guest-info')}
        />
      </div>
    );
  }

  // Payment step
  if (step === 'payment' && bookingId) {
    return (
      <>
        {showPaymentModal && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setStep('booking-form');
            }}
            bookingId={bookingId}
            amount={paymentAmount || (booking ? Math.round((booking.totalAmount - booking.paidAmount) * 100) : 0)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </>
    );
  }

  return null;
};

export default GuestBookingPage;

