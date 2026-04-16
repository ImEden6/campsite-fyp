import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  MapPin,
  ArrowRight,
  Shield,
  Clock,
  Star,
  Users,
  Tent,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getSites } from '@/services/api/sites';
import { get } from '@/services/api/client';
import { queryKeys } from '@/config/query-keys';

import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/forms/DatePicker';
import { SiteCard } from '@/features/sites/components/SiteCard';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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

  // Fetch featured sites
  const { data: sites = [], isLoading: isLoadingSites, error: sitesError } = useQuery({
    queryKey: queryKeys.sites.all,
    queryFn: async () => {
      try {
        const apiSites = await getSites();
        return apiSites;
      } catch {
        return [];
      }
    },
  });

  // Fetch public stats
  const { data: publicStats } = useQuery({
    queryKey: ['publicStats'],
    queryFn: async () => {
      const response = await get<{ data: { siteCount: number; activeBookings: number; totalCustomers: number } }>('/public/stats');
      return response.data;
    },
  });

  const popularSites = sites.slice(0, 3);

  const handleSearch = () => {
    // Validate dates
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      if (checkOut <= checkIn) {
        alert('Check-out date must be after check-in date');
        return;
      }
    }

    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (checkInDate) params.set('checkIn', checkInDate);
    if (checkOutDate) params.set('checkOut', checkOutDate);
    navigate(`/sites?${params.toString()}`);
  };

  const handleBookNow = (siteId: string) => {
    if (isAuthenticated) {
      navigate(`/customer/bookings/new?siteId=${siteId}`);
    } else {
      navigate(`/book/guest?siteId=${siteId}`);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const features = [
    {
      icon: Shield,
      title: 'Secure Booking',
      description: 'Safe and secure payment processing with instant confirmation',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/30',
    },
    {
      icon: Clock,
      title: 'Instant Confirmation',
      description: 'Get immediate booking confirmation and access to your reservation',
      color: 'text-accent-600 dark:text-accent-400',
      bgColor: 'bg-accent-100 dark:bg-accent-900/30',
    },
    {
      icon: Star,
      title: 'Verified Sites',
      description: 'All campsites are verified and regularly maintained for quality',
      color: 'text-secondary-600 dark:text-secondary-400',
      bgColor: 'bg-secondary-100 dark:bg-secondary-900/30',
    },
    {
      icon: Users,
      title: '24/7 Support',
      description: 'Round-the-clock customer support for all your camping needs',
      color: 'text-info-600 dark:text-info-400',
      bgColor: 'bg-info-100 dark:bg-info-900/30',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Search',
      description: 'Enter a location or browse by region to find campsites that match your needs',
      icon: Search,
    },
    {
      step: 2,
      title: 'Pick Dates',
      description: 'Select your check-in and check-out dates — see real-time availability instantly',
      icon: Calendar,
    },
    {
      step: 3,
      title: 'Book',
      description: 'Confirm your reservation with secure payment. No account needed.',
      icon: Shield,
    },
    {
      step: 4,
      title: 'Camp',
      description: 'Get your confirmation email and head out — everything is set',
      icon: Tent,
    },
  ];

  const stats = [
    { label: 'Available Sites', value: publicStats?.siteCount?.toString() || '8', icon: MapPin },
    { label: 'Happy Campers', value: '500+', icon: Users },
    { label: 'Average Rating', value: '4.8', icon: Star },
    { label: 'Years Experience', value: '3+', icon: Award },
  ];

  const liveStats = [
    {
      icon: MapPin,
      label: 'Active campsites',
      value: publicStats?.siteCount?.toString() || sites.length.toString(),
      detail: 'At one location',
    },
    {
      icon: Calendar,
      label: 'Bookings this month',
      value: publicStats?.activeBookings?.toString() || '0',
      detail: 'Booked this month',
    },
    {
      icon: Star,
      label: 'Average rating',
      value: '4.8',
      detail: 'From verified stays',
    },
    {
      icon: Clock,
      label: 'Avg. booking time',
      value: '< 60s',
      detail: 'From search to confirmation',
    },
  ];

  const faqs = [
    {
      question: 'Do I need to create an account to book?',
      answer: 'No! You can book as a guest without creating an account. However, creating an account allows you to manage your bookings, view history, and get faster checkout.',
    },
    {
      question: 'What is your cancellation policy?',
      answer: 'Cancellations made 7+ days before check-in receive a full refund. Cancellations 3-7 days before receive 50% refund. Cancellations within 3 days are non-refundable.',
    },
    {
      question: 'Can I modify my booking after confirmation?',
      answer: 'Yes! You can modify your booking dates, number of guests, or add equipment. Price differences will be calculated and charged or refunded accordingly.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and digital payment methods through our secure payment processor.',
    },
    {
      question: 'Are pets allowed at the campsites?',
      answer: 'Many of our sites are pet-friendly. Look for the pet-friendly badge when browsing sites. Additional fees may apply.',
    },
    {
      question: 'What amenities are included?',
      answer: 'Amenities vary by site but may include electricity, water, sewer, WiFi, restrooms, and more. Check individual site listings for full details.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative text-white py-20 lg:py-32 overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero.png" 
            alt="Scenic campsite at sunrise" 
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          {/* Warm sunset overlay - replaces cold gray */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-950/50 via-gray-900/30 to-primary-950/40" />
          {/* Atmospheric haze */}
          <div className="absolute inset-0 bg-gradient-to-t from-secondary-900/20 via-transparent to-nature-bg/30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Warm amber badge - more inviting than neutral */}
            <div className="inline-flex items-center gap-2 bg-secondary-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-secondary-400/30">
              <span className="text-sm font-medium text-secondary-100">{publicStats?.siteCount || 8} sites · Book in 60 seconds</span>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Real sites. Real availability.
              <br />
              <span className="text-accent-300">No surprises.</span>
            </h1>

            <p className="text-xl md:text-2xl mb-12 text-secondary-100 max-w-3xl mx-auto">
              Search by location, pick your dates, and book — no account required.
            </p>

            {/* Search Bar - warmer surface tint */}
            <div className="max-w-5xl mx-auto bg-nature-surface/95 dark:bg-night-surface/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 border border-secondary-200/30 dark:border-secondary-700/30">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-500 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Search by name, location, or amenities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                      className="pl-10 text-primary-900 dark:text-primary-100 border-secondary-200 focus:border-secondary-400"
                      aria-label="Search sites"
                    />
                  </div>
                </div>
                  <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Check In
                  </label>
                  <DatePicker
                    value={checkInDate ? new Date(checkInDate) : null}
                    onChange={handleCheckInChange}
                    minDate={new Date()}
                    placeholder="Select check-in"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Check Out
                  </label>
                  <DatePicker
                    value={checkOutDate ? new Date(checkOutDate) : null}
                    onChange={handleCheckOutChange}
                    minDate={checkInDate ? new Date(checkInDate) : new Date()}
                    placeholder="Select check-out"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleSearch}
                  variant="accent"
                  size="lg"
                  className="flex-1"
                >
                  Search Sites
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  onClick={() => navigate('/sites')}
                  variant="outline"
                  size="lg"
                >
                  Browse All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary-50 dark:bg-night-surface-alt border-b border-primary-100/30 dark:border-secondary-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-3 ring-4 ring-primary-50 dark:ring-primary-950/50">
                  <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="font-heading text-3xl font-bold text-primary-900 dark:text-primary-100 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-secondary-600 dark:text-secondary-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-nature-surface-alt dark:bg-night-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-3">Why Choose Us</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-900 dark:text-primary-100 mb-4">
              Everything you need for a seamless booking
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              From secure payments to verified sites, we handle the details so you can focus on the outdoors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white dark:bg-night-surface rounded-2xl p-6 shadow-campsite hover:shadow-organic transition-all duration-300 hover:-translate-y-1 border border-secondary-100/50 dark:border-secondary-800/50"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 ${feature.bgColor} rounded-2xl mb-4 ring-4 ring-white dark:ring-night-surface-alt transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-primary-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-night-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-3">How It Works</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-900 dark:text-primary-100 mb-4">
              Four steps to your campsite
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              From search to confirmation in under a minute
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 dark:bg-primary-600 text-white rounded-full text-2xl font-bold mb-4 relative z-10 shadow-lg">
                    {step.step}
                  </div>
                  {index < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-primary-200 dark:bg-primary-800 -z-0" style={{ width: 'calc(100% - 4rem)', marginLeft: 'calc(50% + 2rem)' }} />
                  )}
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-4">
                    <step.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-primary-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Sites Section */}
      <section className="py-20 bg-nature-surface-alt dark:bg-night-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-900 dark:text-primary-100 mb-4">
                Popular Campsites
              </h2>
              <p className="text-lg text-secondary-600 dark:text-secondary-400">
                Handpicked sites loved by our campers
              </p>
            </div>
            <Button
              onClick={() => navigate('/sites')}
              variant="outline"
              className="hidden md:flex"
            >
              View All
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {isLoadingSites ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-secondary-400">Loading sites...</p>
            </div>
          ) : sitesError ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-2">Failed to load sites</p>
              <p className="text-gray-600 dark:text-secondary-400">Please try again later</p>
            </div>
          ) : popularSites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularSites.map((site) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  onViewDetails={() => navigate(`/sites/${site.id}`)}
                  onSelect={() => handleBookNow(site.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto text-secondary-400 mb-4" />
              <p className="text-gray-600 dark:text-secondary-400">No sites available at the moment</p>
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Button
              onClick={() => navigate('/sites')}
              variant="primary"
            >
              View All Sites
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Live Stats Section */}
      <section className="py-20 bg-white dark:bg-night-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-900 dark:text-primary-100 mb-4">
              Booking in Numbers
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              Real data from our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {liveStats.map((stat, index) => (
              <div
                key={index}
                className="bg-nature-surface-alt dark:bg-night-bg rounded-2xl p-6 shadow-campsite border border-secondary-100/50 dark:border-secondary-800/50"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl mb-4">
                  <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="font-heading text-3xl font-bold text-primary-900 dark:text-primary-100 mb-1">
                  {stat.value}
                </div>
                <div className="font-medium text-gray-700 dark:text-secondary-300 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-secondary-500 dark:text-secondary-400">
                  {stat.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-nature-surface-alt dark:bg-night-bg" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-3">FAQ</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-900 dark:text-primary-100 mb-4">
              Common Questions
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">
              Quick answers before you book
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`bg-white dark:bg-night-surface rounded-2xl shadow-sm border transition-all duration-300 ${openFaqIndex === index
                    ? 'border-primary-500 shadow-md ring-1 ring-primary-500/20'
                    : 'border-secondary-100 dark:border-secondary-800 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset rounded-2xl"
                  aria-expanded={openFaqIndex === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className={`font-semibold text-lg transition-colors duration-200 ${openFaqIndex === index ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-primary-100'
                    }`}>
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 ml-4 p-1 rounded-full transition-colors duration-200 ${openFaqIndex === index ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'bg-primary-100 dark:bg-primary-900/30 text-secondary-500 group-hover:text-primary-500'
                    }`}>
                    {openFaqIndex === index ? (
                      <ChevronUp className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-5 h-5" aria-hidden="true" />
                    )}
                  </div>
                </button>

                <div
                  id={`faq-answer-${index}`}
                  className={`px-6 text-secondary-600 dark:text-secondary-400 overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'
                    }`}
                  role="region"
                >
                  <p className="leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 dark:from-primary-950 dark:via-night-bg dark:to-night-bg text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
            Search by location, pick your dates, and book — no account required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/sites')}
              variant="accent"
              size="lg"
            >
              Browse All Sites
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            {!isAuthenticated && (
              <Button
                onClick={() => navigate('/register')}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                size="lg"
              >
                Create Account
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
