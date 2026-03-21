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
  Sparkles,
  Award,
  TrendingUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getSites } from '@/services/api/sites';
import { queryKeys } from '@/config/query-keys';

import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { format } from 'date-fns';
import { SiteCard } from '@/features/sites/components/SiteCard';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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
      title: 'Browse Sites',
      description: 'Explore our wide selection of campsites with detailed information and photos',
      icon: Search,
    },
    {
      step: 2,
      title: 'Select Dates',
      description: 'Choose your check-in and check-out dates with real-time availability',
      icon: Calendar,
    },
    {
      step: 3,
      title: 'Book & Pay',
      description: 'Complete your booking with secure payment - no account required',
      icon: Shield,
    },
    {
      step: 4,
      title: 'Enjoy Your Stay',
      description: 'Receive confirmation and enjoy your camping adventure',
      icon: Tent,
    },
  ];

  const stats = [
    { label: 'Available Sites', value: sites.length > 0 ? sites.length.toString() : '50+', icon: MapPin },
    { label: 'Happy Campers', value: '10,000+', icon: Users },
    { label: 'Average Rating', value: '4.8', icon: Star },
    { label: 'Years Experience', value: '10+', icon: Award },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      location: 'Seattle, WA',
      rating: 5,
      text: 'Amazing experience! The booking process was seamless and the campsite exceeded our expectations. Will definitely book again!',
      avatar: 'SJ',
    },
    {
      name: 'Mike Chen',
      location: 'Portland, OR',
      rating: 5,
      text: 'Best camping platform I\'ve used. Real-time availability and instant confirmation made planning our trip so easy.',
      avatar: 'MC',
    },
    {
      name: 'Emily Rodriguez',
      location: 'San Francisco, CA',
      rating: 5,
      text: 'The site details were accurate and the amenities were exactly as described. Great customer service too!',
      avatar: 'ER',
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
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-950 dark:via-gray-900 dark:to-gray-950 text-white py-20 lg:py-32 overflow-hidden">
        {/* Background Pattern - Trees/Nature */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M40 10 L50 30 L30 30 Z'/%3E%3Cpath d='M40 25 L55 50 L25 50 Z'/%3E%3Crect x='37' y='50' width='6' height='10'/%3E%3Ccircle cx='15' cy='65' r='3'/%3E%3Ccircle cx='65' cy='70' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <Sparkles className="w-4 h-4 text-accent-300" />
              <span className="text-sm font-medium">Discover Your Perfect Campsite</span>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Your Next Adventure
              <br />
              <span className="text-primary-200">Awaits</span>
            </h1>

            <p className="text-xl md:text-2xl mb-12 text-primary-100 max-w-3xl mx-auto">
              Find and book the perfect campsite for your outdoor adventure.
              Real-time availability, instant booking, and secure payments.
            </p>

            {/* Search Bar */}
            <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Sites
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                      className="pl-10 text-gray-900 dark:text-gray-100"
                      aria-label="Search sites"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Check In
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="pl-10 text-gray-900 dark:text-gray-100"
                      aria-label="Check-in date"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Check Out
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate || format(new Date(), 'yyyy-MM-dd')}
                      className="pl-10 text-gray-900 dark:text-gray-100"
                      aria-label="Check-out date"
                    />
                  </div>
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
      <section className="py-12 bg-nature-surface-alt dark:bg-night-surface-alt border-b border-secondary-200/50 dark:border-secondary-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-3 ring-4 ring-primary-50 dark:ring-primary-950/50">
                  <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
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
      <section className="py-20 bg-nature-surface-alt dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              Everything you need for a seamless camping booking experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-campsite hover:shadow-organic transition-all duration-300 hover:-translate-y-1 border border-secondary-100/50 dark:border-secondary-800/50"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 ${feature.bgColor} rounded-2xl mb-4 ring-4 ring-white dark:ring-gray-700 transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
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
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              Book your perfect campsite in just four simple steps
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
                  <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
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
      <section className="py-20 bg-nature-surface-alt dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
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
              <p className="text-gray-600 dark:text-gray-400">Loading sites...</p>
            </div>
          ) : sitesError ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-2">Failed to load sites</p>
              <p className="text-gray-600 dark:text-gray-400">Please try again later</p>
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
              <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No sites available at the moment</p>
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

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              What Our Campers Say
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              Don't just take our word for it - hear from our happy campers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-nature-surface-alt dark:bg-gray-900 rounded-2xl p-6 shadow-campsite border border-secondary-100/50 dark:border-secondary-800/50"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent-400 text-accent-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500 dark:bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-nature-surface-alt dark:bg-gray-900" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">
              Everything you need to know about booking with us
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border transition-all duration-300 ${openFaqIndex === index
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
                  <span className={`font-semibold text-lg transition-colors duration-200 ${openFaqIndex === index ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'
                    }`}>
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 ml-4 p-1 rounded-full transition-colors duration-200 ${openFaqIndex === index ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:text-primary-500'
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
      <section className="py-20 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 dark:from-primary-950 dark:via-gray-900 dark:to-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
            Join thousands of happy campers and discover your perfect campsite today.
            Book instantly with secure payments and instant confirmation.
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
